import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  Client,
  Collection,
  GatewayIntentBits,
  Partials,
  REST,
  Routes,
} from 'discord.js';
import mongoose from 'mongoose';

import { parseVariables } from './global_addons/variable_parser.js';
import { renderMessagePayload } from './global_addons/embed_renderer.js';
import { checkCommandAccess } from './global_addons/permission_guard.js';
import { checkCooldown } from './global_addons/cooldown_manager.js';
import { logError } from './global_addons/error_logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
    Partials.GuildMember,
    Partials.User,
  ],
});

client.commands = new Collection();
client.aliases = new Collection();
client.features = new Map();
client.addons = {
  parseVariables,
  renderMessagePayload,
  checkCommandAccess,
  checkCooldown,
  logError,
};

async function loadModules() {
  const commandsDir = path.join(__dirname, 'commands');
  const featuresDir = path.join(__dirname, 'features');

  // 1. Load thin command modules
  if (fs.existsSync(commandsDir)) {
    const commandFiles = fs.readdirSync(commandsDir).filter((f) => f.endsWith('.js'));
    for (const file of commandFiles) {
      const mod = await import(pathToFileURL(path.join(commandsDir, file)).href);
      const commandList = Array.isArray(mod.default) ? mod.default : [mod.default];

      for (const cmd of commandList) {
        if (!cmd?.data?.name || typeof cmd.execute !== 'function') continue;
        client.commands.set(cmd.data.name, cmd);
        if (Array.isArray(cmd.aliases)) {
          for (const alias of cmd.aliases) {
            client.aliases.set(alias, cmd.data.name);
          }
        }
      }
    }
  }

  // 2. Load event-driven feature engines
  if (fs.existsSync(featuresDir)) {
    const featureFiles = fs.readdirSync(featuresDir).filter((f) => f.endsWith('.js'));
    for (const file of featureFiles) {
      const mod = await import(pathToFileURL(path.join(featuresDir, file)).href);
      const feature = mod.default;
      if (feature?.name && typeof feature.init === 'function') {
        await feature.init(client);
        client.features.set(feature.name, feature);
      }
    }
  }
}

async function registerSlashCommands() {
  const token = process.env.DISCORD_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;
  if (!token || !clientId) return;

  const rest = new REST({ version: '10' }).setToken(token);
  const slashPayload = [...client.commands.values()].map((cmd) =>
    typeof cmd.data.toJSON === 'function' ? cmd.data.toJSON() : cmd.data
  );

  await rest.put(Routes.applicationCommands(clientId), { body: slashPayload });
}

client.once('ready', async () => {
  try {
    await registerSlashCommands();
    console.log(`[Vexora] Online as ${client.user.tag} across ${client.guilds.cache.size} servers.`);
  } catch (err) {
    await logError(client, 'SlashCommandRegistration', err);
  }
});

// Unified Slash Command Router
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    const access = await checkCommandAccess(interaction, command);
    if (!access.allowed) {
      return interaction.reply({ content: access.reason, ephemeral: true });
    }

    const cd = checkCooldown(interaction.guildId, interaction.user.id, command.data.name, command.cooldown || 3);
    if (cd.onCooldown) {
      return interaction.reply({
        content: `Please wait **${cd.remaining}s** before using \`/${command.data.name}\` again.`,
        ephemeral: true,
      });
    }

    await command.execute(interaction, client);
  } catch (err) {
    await logError(client, `Slash:${interaction.commandName}`, err, interaction.guildId);
    const msg = { content: 'Something went wrong while running that command.', ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(msg).catch(() => {});
    } else {
      await interaction.reply(msg).catch(() => {});
    }
  }
});

// Unified Prefix Command Router (supports custom server prefix & custom commands)
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  const prefix = process.env.DEFAULT_PREFIX || '!';
  if (!message.content.startsWith(prefix)) return;

  const rawArgs = message.content.slice(prefix.length).trim().split(/\s+/);
  const invoker = rawArgs.shift()?.toLowerCase();
  if (!invoker) return;

  const resolvedName = client.aliases.get(invoker) || invoker;
  const command = client.commands.get(resolvedName);
  if (!command || typeof command.executePrefix !== 'function') return;

  try {
    const access = await checkCommandAccess(message, command);
    if (!access.allowed) {
      return message.reply(access.reason);
    }

    const cd = checkCooldown(message.guild.id, message.author.id, command.data.name, command.cooldown || 3);
    if (cd.onCooldown) {
      return message.reply(`Please wait **${cd.remaining}s** before using \`${prefix}${invoker}\` again.`);
    }

    await command.executePrefix(message, rawArgs, client);
  } catch (err) {
    await logError(client, `Prefix:${invoker}`, err, message.guild.id);
  }
});

async function bootstrap() {
  if (process.env.MONGODB_URI) {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB_NAME || 'vexora',
    });
    console.log('[Vexora] Connected to MongoDB.');
  }

  await loadModules();
  await client.login(process.env.DISCORD_TOKEN);
}

bootstrap().catch((err) => {
  console.error('[Vexora] Fatal startup error:', err);
  process.exit(1);
});
        
