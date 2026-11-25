import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';
import { dispatchAuditLog, logError } from '../global_addons/error_logger.js';

/**
 * Anti-Raid, Join Gate, Lockdowns & Verification Feature Engine:
 * - Evaluates join gate rules (account age, default avatar, invite links in username, wildcard patterns)
 * - Detects join spikes and activates automatic lockdown / panic mode
 * - Provides interactive button/captcha-style verification flows and verified role assignment
 */
const recentJoinsByGuild = new Map(); // guildId -> timestamps[]
const activeLockdowns = new Map(); // guildId -> { enabledAt, reason, lockedChannels: string[] }
const pendingVerifications = new Map(); // `${guildId}:${userId}` -> { code, createdAt }

const DEFAULT_JOIN_GATE = {
  enabled: true,
  minAccountAgeHours: 24,
  blockDefaultAvatar: false,
  blockInviteInUsername: true,
  wildcardPatterns: [],
  raidThresholdJoins: 8,
  raidWindowSeconds: 10,
  raidAction: 'kick', // 'timeout' | 'kick' | 'ban' | 'quarantine'
  verifiedRoleId: null,
  verificationChannelId: null,
  logChannelId: null,
};

function matchesWildcard(username, patterns = []) {
  const lower = (username || '').toLowerCase();
  return patterns.some((pat) => {
    if (!pat) return false;
    const escaped = pat.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
    return new RegExp(`^${escaped}$`, 'i').test(lower);
  });
}

export async function setServerLockdown(guild, enabled, reason = 'Raid protection lockdown', client = null) {
  if (!guild) return { ok: false, message: 'Guild not found.' };

  if (enabled) {
    const lockedChannels = [];
    for (const [, ch] of guild.channels.cache) {
      if (ch.isTextBased?.() && ch.permissionOverwrites?.edit) {
        await ch.permissionOverwrites
          .edit(guild.roles.everyone, { SendMessages: false }, `Vexora Lockdown: ${reason}`)
          .then(() => lockedChannels.push(ch.id))
          .catch(() => {});
      }
    }

    activeLockdowns.set(guild.id, {
      enabledAt: Date.now(),
      reason,
      lockedChannels,
    });

    if (client) {
      await dispatchAuditLog(
        client,
        guild,
        null,
        `🔒 **SERVER LOCKDOWN ENABLED** — Locked **${lockedChannels.length}** channel(s). Reason: *${reason}*`
      );
    }

    return { ok: true, lockedChannels, message: `Locked **${lockedChannels.length}** channel(s).` };
  }

  const state = activeLockdowns.get(guild.id);
  const channelIds = state?.lockedChannels || [];
  let unlockedCount = 0;

  for (const chId of channelIds) {
    const ch = guild.channels.cache.get(chId);
    if (ch?.permissionOverwrites?.edit) {
      await ch.permissionOverwrites
        .edit(guild.roles.everyone, { SendMessages: null }, 'Vexora Lockdown lifted')
        .then(() => unlockedCount++)
        .catch(() => {});
    }
  }

  activeLockdowns.delete(guild.id);
  if (client) {
    await dispatchAuditLog(client, guild, null, `🔓 **SERVER LOCKDOWN LIFTED** — Unlocked **${unlockedCount}** channel(s).`);
  }

  return { ok: true, unlockedCount, message: `Unlocked **${unlockedCount}** channel(s).` };
}

export async function sendVerificationPanel(channel, verifiedRoleId = null) {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('Member Verification')
    .setDescription(
      'Click **Verify Account** below to confirm you are a human member and unlock server channels.'
    )
    .addFields({ name: 'Security Check', value: 'Instant Verification & Role Assignment', inline: false });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`vexora_verify:${verifiedRoleId || 'none'}:${code}`)
      .setLabel('Verify Account')
      .setStyle(ButtonStyle.Success)
  );

  return channel.send({ embeds: [embed], components: [row] });
}

export default {
  name: 'raid_verify',
  async init(client) {
    client.on('guildMemberAdd', async (member) => {
      try {
        const guild = member.guild;
        const cfg = { ...DEFAULT_JOIN_GATE };

        // 1. Join raid spike detection
        const now = Date.now();
        const windowMs = (cfg.raidWindowSeconds || 10) * 1000;
        const joins = (recentJoinsByGuild.get(guild.id) || []).filter((ts) => now - ts <= windowMs);
        joins.push(now);
        recentJoinsByGuild.set(guild.id, joins);

        if (joins.length >= (cfg.raidThresholdJoins || 8)) {
          if (!activeLockdowns.has(guild.id)) {
            await setServerLockdown(guild, true, `Detected ${joins.length} joins in ${cfg.raidWindowSeconds}s`, client);
          }

          if (cfg.raidAction === 'ban') {
            await member.ban({ reason: 'Vexora Anti-Raid join spike' }).catch(() => {});
            return;
          }
          if (cfg.raidAction === 'kick') {
            await member.kick('Vexora Anti-Raid join spike').catch(() => {});
            return;
          }
          if (cfg.raidAction === 'timeout' && member.moderatable) {
            await member.timeout(15 * 60 * 1000, 'Vexora Anti-Raid join spike').catch(() => {});
          }
        }

        // 2. Join Gate checks
        if (!cfg.enabled || member.user.bot) return;

        const accountAgeHours = (now - member.user.createdTimestamp) / (1000 * 60 * 60);
        const reasons = [];

        if (cfg.minAccountAgeHours > 0 && accountAgeHours < cfg.minAccountAgeHours) {
          reasons.push(`Account age (${accountAgeHours.toFixed(1)}h) < ${cfg.minAccountAgeHours}h`);
        }
        if (cfg.blockDefaultAvatar && !member.user.avatar) {
          reasons.push('Default/no avatar');
        }
        if (cfg.blockInviteInUsername && /(discord\.gg\/|discordapp\.com\/invite\/)/i.test(member.user.username)) {
          reasons.push('Invite link in username');
        }
        if (matchesWildcard(member.user.username, cfg.wildcardPatterns)) {
          reasons.push('Matched username wildcard filter');
        }

        if (reasons.length > 0 && cfg.logChannelId) {
          await dispatchAuditLog(
            client,
            guild,
            cfg.logChannelId,
            `🚧 **JOIN GATE FLAG** — <@${member.id}> (\`${member.user.tag}\`): ${reasons.join(' | ')}`
          );
        }
      } catch (err) {
        await logError(client, 'RaidVerify:guildMemberAdd', err, member.guild?.id);
      }
    });

    client.on('interactionCreate', async (interaction) => {
      if (!interaction.isButton()) return;
      if (!interaction.customId.startsWith('vexora_verify:')) return;

      const [, roleId] = interaction.customId.split(':');
      const key = `${interaction.guildId}:${interaction.user.id}`;
      pendingVerifications.delete(key);

      if (roleId && roleId !== 'none') {
        const role = interaction.guild.roles.cache.get(roleId);
        if (role && interaction.member?.roles?.add) {
          await interaction.member.roles.add(role, 'Completed Vexora verification').catch(() => {});
        }
      }

      return interaction.reply({
        content: '✅ Your account has been verified! Welcome to the server.',
        ephemeral: true,
      });
    });
  },
  setServerLockdown,
  sendVerificationPanel,
  getLockdownStatus: (guildId) => activeLockdowns.get(guildId) || null,
};
              
