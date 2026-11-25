import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const afkMap = new Map();

export default [
  {
    data: new SlashCommandBuilder()
      .setName('afk')
      .setDescription('Set your AFK status so members mentioning you are notified.')
      .addStringOption((opt) => opt.setName('reason').setDescription('AFK reason').setRequired(false)),
    cooldown: 3,
    async execute(interaction) {
      const reason = interaction.options.getString('reason') || 'AFK';
      afkMap.set(`${interaction.guildId}:${interaction.user.id}`, {
        reason,
        since: Date.now(),
      });
      return interaction.reply({ content: `You are now marked as **AFK**: ${reason}`, ephemeral: true });
    },
  },

  {
    data: new SlashCommandBuilder().setName('ping').setDescription('Check Vexora’s API and WebSocket latency.'),
    cooldown: 3,
    async execute(interaction, client) {
      const sent = await interaction.reply({ content: 'Measuring latency...', fetchReply: true });
      const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
      const wsPing = Math.round(client.ws.ping);
      return interaction.editReply(`🏓 **Pong!** Roundtrip: **${roundtrip}ms** | WebSocket: **${wsPing}ms**`);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('roll')
      .setDescription('Roll dice (e.g. 1d6, 2d20).')
      .addIntegerOption((opt) =>
        opt.setName('sides').setDescription('Number of sides on the die (2-1000)').setMinValue(2).setMaxValue(1000).setRequired(false)
      )
      .addIntegerOption((opt) =>
        opt.setName('count').setDescription('How many dice to roll (1-20)').setMinValue(1).setMaxValue(20).setRequired(false)
      ),
    cooldown: 3,
    async execute(interaction) {
      const sides = interaction.options.getInteger('sides') || 6;
      const count = interaction.options.getInteger('count') || 1;
      const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
      const total = rolls.reduce((a, b) => a + b, 0);
      return interaction.reply(`🎲 Rolled **${count}d${sides}**: [${rolls.join(', ')}] — Total: **${total}**`);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('coinflip')
      .setDescription('Flip a coin for a quick 50/50 decision.'),
    cooldown: 3,
    async execute(interaction) {
      const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
      return interaction.reply(`🪙 **${result}!**`);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('pickteam')
      .setDescription('Split comma-separated players or voice channel members into balanced teams.')
      .addStringOption((opt) =>
        opt.setName('players').setDescription('Comma-separated player names/mentions').setRequired(false)
      )
      .addIntegerOption((opt) =>
        opt.setName('teams').setDescription('Number of teams (2-8)').setMinValue(2).setMaxValue(8).setRequired(false)
      ),
    cooldown: 4,
    async execute(interaction) {
      const numTeams = interaction.options.getInteger('teams') || 2;
      const rawPlayers = interaction.options.getString('players');

      let pool = [];
      if (rawPlayers) {
        pool = rawPlayers
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      } else if (interaction.member?.voice?.channel) {
        pool = interaction.member.voice.channel.members
          .filter((m) => !m.user.bot)
          .map((m) => `<@${m.id}>`);
      }

      if (pool.length < numTeams) {
        return interaction.reply({
          content: `Provide at least **${numTeams}** players (via \`players\` or by joining a voice channel).`,
          ephemeral: true,
        });
      }

      // Fisher-Yates shuffle
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }

      const buckets = Array.from({ length: numTeams }, () => []);
      pool.forEach((player, idx) => buckets[idx % numTeams].push(player));

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('Lobby Team Split')
        .addFields(
          ...buckets.map((members, idx) => ({
            name: `Team ${idx + 1} (${members.length})`,
            value: members.join('\n') || 'Empty',
            inline: true,
          }))
        );

      return interaction.reply({ embeds: [embed] });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('userinfo')
      .setDescription('Inspect member roles, join date, account age, and ID.')
      .addUserOption((opt) => opt.setName('user').setDescription('Target member').setRequired(false)),
    cooldown: 3,
    async execute(interaction) {
      const targetUser = interaction.options.getUser('user') || interaction.user;
      const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
      const roles = member
        ? member.roles.cache
            .filter((r) => r.id !== interaction.guild.id)
            .sort((a, b) => b.position - a.position)
            .map((r) => r.toString())
            .slice(0, 15)
        : [];

      const embed = new EmbedBuilder()
        .setColor(member?.displayHexColor || 0x5865f2)
        .setTitle(targetUser.tag)
        .setThumbnail(targetUser.displayAvatarURL({ size: 512 }))
        .addFields(
          { name: 'User ID', value: `\`${targetUser.id}\``, inline: true },
          {
            name: 'Account Created',
            value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`,
            inline: true,
          },
          ...(member?.joinedTimestamp
            ? [
                {
                  name: 'Joined Server',
                  value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`,
                  inline: true,
                },
              ]
            : []),
          { name: `Roles (${roles.length})`, value: roles.join(', ') || 'None' }
        );

      return interaction.reply({ embeds: [embed] });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('serverinfo')
      .setDescription('View server members, boosts, channels, and owner info.'),
    cooldown: 3,
    async execute(interaction) {
      const { guild } = interaction;
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(guild.name)
        .setThumbnail(guild.iconURL({ size: 512 }))
        .addFields(
          { name: 'Server ID', value: `\`${guild.id}\``, inline: true },
          { name: 'Owner', value: `<@${guild.ownerId}>`, inline: true },
          { name: 'Members', value: `${guild.memberCount}`, inline: true },
          { name: 'Boosts', value: `${guild.premiumSubscriptionCount || 0} (Tier ${guild.premiumTier})`, inline: true },
          { name: 'Channels', value: `${guild.channels.cache.size}`, inline: true }
        );

      return interaction.reply({ embeds: [embed] });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('avatar')
      .setDescription('Display a member’s high-resolution avatar.')
      .addUserOption((opt) => opt.setName('user').setDescription('Target member').setRequired(false)),
    cooldown: 3,
    async execute(interaction) {
      const targetUser = interaction.options.getUser('user') || interaction.user;
      const url = targetUser.displayAvatarURL({ size: 1024, extension: 'png' });
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(`${targetUser.tag} — Avatar`)
        .setImage(url);
      return interaction.reply({ embeds: [embed] });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('banner')
      .setDescription('Display a member’s profile banner if set.')
      .addUserOption((opt) => opt.setName('user').setDescription('Target member').setRequired(false)),
    cooldown: 3,
    async execute(interaction) {
      const targetUser = interaction.options.getUser('user') || interaction.user;
      const fetched = await targetUser.fetch(true);
      const bannerUrl = fetched.bannerURL({ size: 1024, extension: 'png' });
      if (!bannerUrl) {
        return interaction.reply({ content: `**${targetUser.tag}** does not have a profile banner set.`, ephemeral: true });
      }
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(`${targetUser.tag} — Banner`)
        .setImage(bannerUrl);
      return interaction.reply({ embeds: [embed] });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('roleinfo')
      .setDescription('Inspect role ID, HEX color, member count, and key permissions.')
      .addRoleOption((opt) => opt.setName('role').setDescription('Target role').setRequired(true)),
    cooldown: 3,
    async execute(interaction) {
      const role = interaction.options.getRole('role', true);
      const perms = role.permissions.toArray().slice(0, 12).join(', ') || 'None';
      const embed = new EmbedBuilder()
        .setColor(role.color || 0x5865f2)
        .setTitle(`Role Info — ${role.name}`)
        .addFields(
          { name: 'Role ID', value: `\`${role.id}\``, inline: true },
          { name: 'HEX Color', value: `\`${role.hexColor.toUpperCase()}\``, inline: true },
          { name: 'Members', value: `${role.members.size}`, inline: true },
          { name: 'Permissions', value: perms }
        );
      return interaction.reply({ embeds: [embed] });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('help')
      .setDescription('Browse Vexora’s command categories or look up a specific command.')
      .addStringOption((opt) => opt.setName('command').setDescription('Specific command name').setRequired(false)),
    cooldown: 3,
    async execute(interaction, client) {
      const specific = interaction.options.getString('command')?.toLowerCase();
      if (specific) {
        const cmd = client.commands.get(specific);
        if (!cmd) {
          return interaction.reply({ content: `No command named \`/${specific}\` found.`, ephemeral: true });
        }
        return interaction.reply({
          content: `**/${cmd.data.name}** — ${cmd.data.description}\nCooldown: **${cmd.cooldown || 3}s**`,
          ephemeral: true,
        });
      }

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('Vexora Command Guide')
        .setDescription('Use `/help command:<name>` for details on any command.')
        .addFields(
          { name: 'Moderation', value: '`/ban`, `/unban`, `/softban`, `/kick`, `/timeout`, `/unmute`, `/warn`, `/warnings`, `/clearwarns`, `/case`, `/purge`, `/slowmode`, `/lock`, `/unlock`', inline: false },
          { name: 'Economy & Shop', value: '`/balance`, `/deposit`, `/withdraw`, `/work`, `/daily`, `/crime`, `/hunt`, `/fish`, `/rob`, `/give`, `/slots`, `/flip`, `/bet`, `/richlist`, `/shop`, `/buy`, `/inventory`, `/use`, `/credit`, `/debit`', inline: false },
          { name: 'Leveling', value: '`/rank`, `/levels`, `/rankcard`, `/addxp`, `/removexp`, `/setlevel`, `/resetxp`', inline: false },
          { name: 'Mini-Games, Fun & Utility', value: '`/tictactoe`, `/rps`, `/connect4`, `/wordguess`, `/trivia`, `/8ball`, `/td`, `/dog`, `/cat`, `/fox`, `/panda`, `/bird`, `/meme`, `/joke`, `/roast`, `/compliment`, `/wanted`, `/color`, `/colorrole`, `/colorgrid`, `/afk`, `/ping`, `/roll`, `/coinflip`, `/pickteam`, `/userinfo`, `/serverinfo`, `/avatar`, `/banner`, `/roleinfo`, `/help`', inline: false }
        );

      return interaction.reply({ embeds: [embed], ephemeral: true });
    },
  },
];
              
