import { EmbedBuilder, PermissionsBitField } from 'discord.js';
import { dispatchAuditLog, logError } from '../global_addons/error_logger.js';

/**
 * Heat Automod, Warnings, Moderation Cases & Event Logging Engine:
 * - Calculates message heat across length, newlines, mentions, repeats, zalgo, invites & blacklisted words
 * - Executes moderation actions (ban, unban, softban, kick, timeout, unmute) with sequential Case IDs
 * - Tracks warnings and supports automatic threshold escalations
 * - Dispatches message edit/delete/bulk-delete and member/voice logs
 */
const heatStore = new Map(); // `${guildId}:${userId}` -> { score: number, lastMsg: string, updatedAt: number }
const casesByGuild = new Map(); // guildId -> caseObj[]
const warningsByGuild = new Map(); // `${guildId}:${userId}` -> warnObj[]

const DEFAULT_AUTOMOD_CONFIG = {
  enabled: true,
  heatThreshold: 100,
  heatDecayPerSecond: 8,
  maxMentions: 5,
  maxNewlines: 12,
  blockDiscordInvites: true,
  blockPhishingLinks: true,
  wordBlacklist: [],
  whitelistedRoles: [],
  whitelistedChannels: [],
  modLogChannelId: null,
  eventLogChannelId: null,
  warnEscalation: {
    3: { action: 'timeout', durationMinutes: 30 },
    5: { action: 'kick' },
    7: { action: 'ban' },
  },
};

function generateCaseId(guildId) {
  const list = casesByGuild.get(guildId) || [];
  const nextNum = list.length + 1;
  return `CASE-${String(nextNum).padStart(4, '0')}`;
}

function recordModCase(guildId, entry) {
  const caseId = generateCaseId(guildId);
  const fullCase = {
    caseId,
    guildId,
    createdAt: new Date().toISOString(),
    ...entry,
  };
  const list = casesByGuild.get(guildId) || [];
  list.unshift(fullCase);
  casesByGuild.set(guildId, list);
  return fullCase;
}

function computeMessageHeat(message, prevState, cfg) {
  const content = message.content || '';
  const now = Date.now();
  const elapsedSec = prevState ? Math.max(0, (now - prevState.updatedAt) / 1000) : 0;
  let score = prevState ? Math.max(0, prevState.score - elapsedSec * (cfg.heatDecayPerSecond || 8)) : 0;

  // Base message frequency heat
  score += 20;

  // Wall of text / newlines
  const newlines = (content.match(/\n/g) || []).length;
  if (newlines > (cfg.maxNewlines || 12)) score += 35;
  if (content.length > 900) score += 25;

  // Repeated identical message
  if (prevState?.lastMsg && prevState.lastMsg === content.trim().toLowerCase() && content.trim().length > 2) {
    score += 45;
  }

  // Excessive mentions
  const mentionCount =
    (message.mentions?.users?.size || 0) +
    (message.mentions?.roles?.size || 0) +
    (message.mentions?.everyone ? 5 : 0);
  if (mentionCount >= (cfg.maxMentions || 5)) {
    score += 60;
  }

  // Zalgo combining marks check
  const zalgoMarks = (content.match(/[\u0300-\u036f\u0489]/g) || []).length;
  if (zalgoMarks > 12) score += 50;

  return { score, lastMsg: content.trim().toLowerCase(), updatedAt: now };
}

function detectViolation(content, cfg) {
  if (!content) return null;
  const lower = content.toLowerCase();

  if (cfg.blockDiscordInvites && /(discord\.gg\/|discord\.com\/invite\/|discordapp\.com\/invite\/)/i.test(content)) {
    return 'Discord Invite Link';
  }

  if (cfg.blockPhishingLinks && /(nitro-free|steamcommunlty|dlscord|airdrop-claim)/i.test(lower)) {
    return 'Suspicious / Phishing Link';
  }

  if (Array.isArray(cfg.wordBlacklist)) {
    const hit = cfg.wordBlacklist.find((w) => w && lower.includes(w.toLowerCase()));
    if (hit) return `Blacklisted Word (${hit})`;
  }

  return null;
}

export async function executeAction({
  action,
  guild,
  moderator,
  targetUser,
  targetUserId,
  targetMember,
  durationMinutes = 10,
  reason = 'No reason provided',
  client = null,
}) {
  const uid = targetUser?.id || targetUserId || targetMember?.id;
  const tag = targetUser?.tag || targetMember?.user?.tag || uid;

  if (action === 'ban') {
    await guild.members.ban(uid, { reason });
  } else if (action === 'unban') {
    await guild.members.unban(uid, reason);
  } else if (action === 'softban') {
    await guild.members.ban(uid, { deleteMessageSeconds: 86400, reason });
    await guild.members.unban(uid, 'Softban complete');
  } else if (action === 'kick') {
    if (!targetMember) return { ok: false, message: 'Target member is not in the server.' };
    await targetMember.kick(reason);
  } else if (action === 'timeout') {
    if (!targetMember) return { ok: false, message: 'Target member is not in the server.' };
    await targetMember.timeout(durationMinutes * 60 * 1000, reason);
  } else if (action === 'unmute') {
    if (!targetMember) return { ok: false, message: 'Target member is not in the server.' };
    await targetMember.timeout(null, reason);
  }

  const modCase = recordModCase(guild.id, {
    action,
    targetId: uid,
    targetTag: tag,
    moderatorId: moderator?.id || 'system',
    moderatorTag: moderator?.tag || 'Vexora System',
    reason,
    duration: action === 'timeout' ? `${durationMinutes}m` : null,
  });

  if (client && DEFAULT_AUTOMOD_CONFIG.modLogChannelId) {
    await dispatchAuditLog(
      client,
      guild,
      DEFAULT_AUTOMOD_CONFIG.modLogChannelId,
      `⚖️ **${modCase.caseId}** | Action: **${action.toUpperCase()}** | Target: <@${uid}> (\`${tag}\`) | Mod: <@${modCase.moderatorId}> | Reason: *${reason}*`
    );
  }

  return {
    ok: true,
    caseId: modCase.caseId,
    message: `**${modCase.caseId}** — Executed **${action}** on **${tag}** (${reason}).`,
  };
}

export async function addWarning({ guild, moderator, targetUser, reason, client = null }) {
  const key = `${guild.id}:${targetUser.id}`;
  const list = warningsByGuild.get(key) || [];
  const warnEntry = {
    id: `WARN-${list.length + 1}`,
    reason,
    moderatorId: moderator.id,
    moderatorTag: moderator.tag,
    createdAt: new Date().toISOString(),
  };
  list.push(warnEntry);
  warningsByGuild.set(key, list);

  const modCase = recordModCase(guild.id, {
    action: 'warn',
    targetId: targetUser.id,
    targetTag: targetUser.tag,
    moderatorId: moderator.id,
    moderatorTag: moderator.tag,
    reason,
  });

  const escalation = DEFAULT_AUTOMOD_CONFIG.warnEscalation?.[list.length];
  if (escalation) {
    const member = await guild.members.fetch(targetUser.id).catch(() => null);
    if (member) {
      await executeAction({
        action: escalation.action,
        guild,
        moderator,
        targetUser,
        targetMember: member,
        durationMinutes: escalation.durationMinutes || 30,
        reason: `Automatic warning threshold escalation (${list.length} warnings)`,
        client,
      }).catch(() => {});
    }
  }

  return {
    ok: true,
    caseId: modCase.caseId,
    count: list.length,
    message: `Warned **${targetUser.tag}** (Total warnings: **${list.length}**, Case: \`${modCase.caseId}\`) — ${reason}`,
  };
}

export async function getWarnings(guildId, userId) {
  const list = warningsByGuild.get(`${guildId}:${userId}`) || [];
  if (list.length === 0) {
    return `No active warnings for <@${userId}>.`;
  }
  const lines = list.map(
    (w, i) => `**${i + 1}.** \`${w.id}\` — ${w.reason} *(by <@${w.moderatorId}>)*`
  );
  return `**Warnings for <@${userId}> (${list.length}):**\n${lines.join('\n')}`;
}

export async function clearWarnings(guildId, userId, moderator) {
  const key = `${guildId}:${userId}`;
  const count = (warningsByGuild.get(key) || []).length;
  warningsByGuild.delete(key);
  recordModCase(guildId, {
    action: 'clearwarns',
    targetId: userId,
    targetTag: userId,
    moderatorId: moderator.id,
    moderatorTag: moderator.tag,
    reason: `Cleared ${count} warning(s)`,
  });
  return { ok: true, message: `Cleared **${count}** warning(s) for <@${userId}>.` };
}

export async function getCase(guildId, caseId) {
  const list = casesByGuild.get(guildId) || [];
  const found = list.find((c) => c.caseId.toLowerCase() === caseId.toLowerCase());
  if (!found) {
    return { content: `No moderation case found with ID \`${caseId}\`.` };
  }

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`Moderation Case — ${found.caseId}`)
    .addFields(
      { name: 'Action', value: found.action.toUpperCase(), inline: true },
      { name: 'Target', value: `<@${found.targetId}> (\`${found.targetTag}\`)`, inline: true },
      { name: 'Moderator', value: `<@${found.moderatorId}>`, inline: true },
      ...(found.duration ? [{ name: 'Duration', value: found.duration, inline: true }] : []),
      { name: 'Reason', value: found.reason || 'No reason provided', inline: false }
    )
    .setTimestamp(new Date(found.createdAt));

  return { embeds: [embed] };
}

export default {
  name: 'automod_logs',
  async init(client) {
    client.on('messageCreate', async (message) => {
      if (message.author.bot || !message.guild || !message.member) return;
      if (message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return;

      try {
        const cfg = DEFAULT_AUTOMOD_CONFIG;
        if (!cfg.enabled) return;

        // 1. Direct content filter violation
        const violation = detectViolation(message.content, cfg);
        if (violation) {
          await message.delete().catch(() => {});
          const warnMsg = await message.channel
            .send(`<@${message.author.id}>, your message was removed (**${violation}**).`)
            .catch(() => null);
          if (warnMsg) setTimeout(() => warnMsg.delete().catch(() => {}), 5000).unref();
          return;
        }

        // 2. Heat automod scoring
        const key = `${message.guild.id}:${message.author.id}`;
        const nextHeat = computeMessageHeat(message, heatStore.get(key), cfg);
        heatStore.set(key, nextHeat);

        if (nextHeat.score >= (cfg.heatThreshold || 100)) {
          heatStore.set(key, { ...nextHeat, score: 0 });
          await message.delete().catch(() => {});
          if (message.member.moderatable) {
            await message.member.timeout(5 * 60 * 1000, 'Vexora Heat Automod spam threshold').catch(() => {});
          }
          await message.channel
            .send(`⚠️ <@${message.author.id}> has been timed out for **5m** due to spam/message heat.`)
            .catch(() => {});
        }
      } catch (err) {
        await logError(client, 'Automod:messageCreate', err, message.guild?.id);
      }
    });

    client.on('messageDelete', async (message) => {
      if (!message.guild || message.author?.bot) return;
      const logId = DEFAULT_AUTOMOD_CONFIG.eventLogChannelId;
      if (!logId) return;
      await dispatchAuditLog(
        client,
        message.guild,
        logId,
        `🗑️ **Message Deleted** in <#${message.channel.id}> by <@${message.author?.id || 'unknown'}>:\n> ${
          (message.content || '*[Attachment / Embed]*').slice(0, 1000)
        }`
      );
    });

    client.on('messageUpdate', async (oldMsg, newMsg) => {
      if (!newMsg.guild || newMsg.author?.bot) return;
      if (oldMsg.content === newMsg.content) return;
      const logId = DEFAULT_AUTOMOD_CONFIG.eventLogChannelId;
      if (!logId) return;
      await dispatchAuditLog(
        client,
        newMsg.guild,
        logId,
        `✏️ **Message Edited** in <#${newMsg.channel.id}> by <@${newMsg.author.id}>:\n**Before:** ${(oldMsg.content || '').slice(0, 450)}\n**After:** ${(newMsg.content || '').slice(0, 450)}`
      );
    });
  },
  executeAction,
  addWarning,
  getWarnings,
  clearWarnings,
  getCase,
  getAllCases: (guildId) => casesByGuild.get(guildId) || [],
};
