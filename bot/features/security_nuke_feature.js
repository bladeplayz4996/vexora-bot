import { AuditLogEvent, PermissionsBitField } from 'discord.js';
import { dispatchAuditLog, logError } from '../global_addons/error_logger.js';

/**
 * Security & Anti-Nuke Feature Engine:
 * - Tracks destructive actions per minute/hour (channels, roles, bans, kicks, webhooks, bots, dangerous perms, server/vanity edits)
 * - Quarantines rogue members/bots and enforces Quarantine Hold against bypass or tampering
 * - Creates manual/scheduled snapshots and restores/syncs server structure on nuke detection
 */
const actionBuckets = new Map(); // `${guildId}:${actorId}:${actionType}` -> timestamps[]
const quarantinedMembers = new Map(); // `${guildId}:${userId}` -> { roles: string[], quarantinedAt: number }
const serverSnapshots = new Map(); // guildId -> snapshot[]

const DEFAULT_LIMITS = {
  channelDelete: { max: 3, windowMs: 60_000 },
  channelCreate: { max: 6, windowMs: 60_000 },
  roleDelete: { max: 3, windowMs: 60_000 },
  roleCreate: { max: 6, windowMs: 60_000 },
  memberBan: { max: 4, windowMs: 60_000 },
  memberKick: { max: 5, windowMs: 60_000 },
  webhookCreate: { max: 3, windowMs: 60_000 },
  botAdd: { max: 2, windowMs: 60_000 },
  dangerousPerm: { max: 2, windowMs: 60_000 },
  guildUpdate: { max: 2, windowMs: 60_000 },
};

function recordAndCheckThreshold(guildId, actorId, actionType, limitCfg) {
  const { max, windowMs } = limitCfg || DEFAULT_LIMITS[actionType] || { max: 4, windowMs: 60_000 };
  const key = `${guildId}:${actorId}:${actionType}`;
  const now = Date.now();
  const prev = (actionBuckets.get(key) || []).filter((ts) => now - ts <= windowMs);
  prev.push(now);
  actionBuckets.set(key, prev);

  return {
    count: prev.length,
    exceeded: prev.length > max,
    max,
    windowSeconds: Math.round(windowMs / 1000),
  };
}

async function resolveAuditActor(guild, auditEventType, targetId = null) {
  if (!guild?.members?.me?.permissions?.has(PermissionsBitField.Flags.ViewAuditLog)) {
    return null;
  }

  const logs = await guild.fetchAuditLogs({ type: auditEventType, limit: 6 }).catch(() => null);
  if (!logs?.entries?.size) return null;

  const now = Date.now();
  const entry = logs.entries.find((e) => {
    const recent = now - e.createdTimestamp < 10_000;
    const matchesTarget = !targetId || e.target?.id === targetId;
    return recent && matchesTarget && e.executor;
  });

  return entry?.executor || null;
}

export async function createServerSnapshot(guild, reason = 'manual') {
  if (!guild) return null;

  const snapshot = {
    id: `snap_${Date.now().toString(36)}`,
    guildId: guild.id,
    createdAt: new Date().toISOString(),
    reason,
    guildMeta: {
      name: guild.name,
      verificationLevel: guild.verificationLevel,
      defaultMessageNotifications: guild.defaultMessageNotifications,
      explicitContentFilter: guild.explicitContentFilter,
      vanityURLCode: guild.vanityURLCode || null,
    },
    roles: guild.roles.cache
      .filter((r) => !r.managed && r.id !== guild.id)
      .sort((a, b) => a.position - b.position)
      .map((r) => ({
        id: r.id,
        name: r.name,
        color: r.color,
        hoist: r.hoist,
        position: r.position,
        permissions: r.permissions.bitfield.toString(),
        mentionable: r.mentionable,
      })),
    channels: guild.channels.cache
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map((ch) => ({
        id: ch.id,
        name: ch.name,
        type: ch.type,
        parentId: ch.parentId || null,
        position: ch.position ?? 0,
        topic: ch.topic || null,
        nsfw: Boolean(ch.nsfw),
        rateLimitPerUser: ch.rateLimitPerUser ?? 0,
      })),
    emojis: guild.emojis.cache.map((e) => ({ id: e.id, name: e.name, url: e.imageURL() })),
    stickers: guild.stickers.cache.map((s) => ({ id: s.id, name: s.name, url: s.url })),
  };

  const list = serverSnapshots.get(guild.id) || [];
  list.unshift(snapshot);
  serverSnapshots.set(guild.id, list.slice(0, 20));
  return snapshot;
}

export async function restoreServerSnapshot(guild, snapshotId = null, client = null) {
  const list = serverSnapshots.get(guild.id) || [];
  const snap = snapshotId ? list.find((s) => s.id === snapshotId) : list[0];
  if (!snap) {
    return { ok: false, message: 'No server snapshot available to restore.' };
  }

  let restoredRoles = 0;
  let restoredChannels = 0;

  // Restore missing roles
  for (const rData of snap.roles) {
    const exists = guild.roles.cache.find((r) => r.name === rData.name);
    if (!exists) {
      await guild.roles
        .create({
          name: rData.name,
          color: rData.color,
          hoist: rData.hoist,
          permissions: BigInt(rData.permissions),
          mentionable: rData.mentionable,
          reason: `Vexora snapshot restore (${snap.id})`,
        })
        .then(() => restoredRoles++)
        .catch(() => {});
    }
  }

  // Restore missing text/category channels
  for (const chData of snap.channels) {
    const exists = guild.channels.cache.find((c) => c.name === chData.name && c.type === chData.type);
    if (!exists) {
      await guild.channels
        .create({
          name: chData.name,
          type: chData.type,
          topic: chData.topic || undefined,
          nsfw: chData.nsfw,
          rateLimitPerUser: chData.rateLimitPerUser,
          reason: `Vexora snapshot restore (${snap.id})`,
        })
        .then(() => restoredChannels++)
        .catch(() => {});
    }
  }

  if (client) {
    await dispatchAuditLog(
      client,
      guild,
      null,
      `♻️ **Snapshot Restored (\`${snap.id}\`)** — Recreated **${restoredRoles}** role(s) and **${restoredChannels}** channel(s).`
    );
  }

  return {
    ok: true,
    snapshotId: snap.id,
    restoredRoles,
    restoredChannels,
    message: `Restored snapshot \`${snap.id}\`: **${restoredRoles}** role(s) and **${restoredChannels}** channel(s) recreated.`,
  };
}

export async function quarantineMember(guild, targetId, reason, client, cfg = {}) {
  if (!guild || !targetId) return false;
  if (targetId === guild.ownerId || targetId === client?.user?.id) return false;

  const member = await guild.members.fetch(targetId).catch(() => null);
  if (!member) return false;

  const whitelistedUsers = cfg.whitelistedUsers || [];
  const whitelistedRoles = cfg.whitelistedRoles || [];
  if (
    whitelistedUsers.includes(targetId) ||
    member.roles.cache.some((r) => whitelistedRoles.includes(r.id))
  ) {
    return false;
  }

  const prevRoleIds = member.roles.cache
    .filter((r) => r.id !== guild.id && !r.managed)
    .map((r) => r.id);

  quarantinedMembers.set(`${guild.id}:${targetId}`, {
    roles: prevRoleIds,
    quarantinedAt: Date.now(),
    reason,
  });

  // Strip dangerous/assignable roles and apply quarantine role if configured
  const quarantineRoleId = cfg.quarantineRoleId || null;
  const nextRoles = quarantineRoleId ? [quarantineRoleId] : [];

  await member.roles.set(nextRoles, `Vexora Anti-Nuke Quarantine: ${reason}`).catch(async () => {
    await member.kick(`Vexora Anti-Nuke Quarantine (role strip fallback): ${reason}`).catch(() => {});
  });

  if (cfg.autoRestoreOnNuke) {
    await restoreServerSnapshot(guild, null, client);
  }

  if (cfg.logChannelId && client) {
    await dispatchAuditLog(
      client,
      guild,
      cfg.logChannelId,
      `🛡️ **ANTI-NUKE QUARANTINE**\n• **Target:** <@${targetId}> (\`${targetId}\`)\n• **Reason:** ${reason}\n• **Stripped Roles:** ${prevRoleIds.length}`
    );
  }

  return true;
}

export default {
  name: 'security_nuke',
  async init(client) {
    // Periodic automatic server snapshot every 30 minutes for active guilds
    setInterval(() => {
      for (const guild of client.guilds.cache.values()) {
        createServerSnapshot(guild, 'scheduled').catch(() => {});
      }
    }, 30 * 60_000).unref();

    const handleDestructiveEvent = async (guild, auditType, targetId, actionType) => {
      if (!guild) return;
      const actor = await resolveAuditActor(guild, auditType, targetId);
      if (!actor || actor.bot && actor.id === client.user?.id) return;

      const check = recordAndCheckThreshold(guild.id, actor.id, actionType);
      if (check.exceeded) {
        await quarantineMember(
          guild,
          actor.id,
          `Exceeded ${actionType} threshold (${check.count}/${check.max} per ${check.windowSeconds}s)`,
          client
        );
      }
    };

    client.on('channelDelete', (channel) => {
      if (channel.guild) {
        handleDestructiveEvent(channel.guild, AuditLogEvent.ChannelDelete, channel.id, 'channelDelete').catch(
          (e) => logError(client, 'AntiNuke:channelDelete', e, channel.guild.id)
        );
      }
    });

    client.on('channelCreate', (channel) => {
      if (channel.guild) {
        handleDestructiveEvent(channel.guild, AuditLogEvent.ChannelCreate, channel.id, 'channelCreate').catch(
          (e) => logError(client, 'AntiNuke:channelCreate', e, channel.guild.id)
        );
      }
    });

    client.on('roleDelete', (role) => {
      handleDestructiveEvent(role.guild, AuditLogEvent.RoleDelete, role.id, 'roleDelete').catch((e) =>
        logError(client, 'AntiNuke:roleDelete', e, role.guild.id)
      );
    });

    client.on('roleCreate', (role) => {
      handleDestructiveEvent(role.guild, AuditLogEvent.RoleCreate, role.id, 'roleCreate').catch((e) =>
        logError(client, 'AntiNuke:roleCreate', e, role.guild.id)
      );
    });

    client.on('guildBanAdd', (ban) => {
      handleDestructiveEvent(ban.guild, AuditLogEvent.MemberBanAdd, ban.user.id, 'memberBan').catch((e) =>
        logError(client, 'AntiNuke:guildBanAdd', e, ban.guild.id)
      );
    });

    client.on('guildMemberRemove', (member) => {
      handleDestructiveEvent(member.guild, AuditLogEvent.MemberKick, member.id, 'memberKick').catch((e) =>
        logError(client, 'AntiNuke:guildMemberRemove', e, member.guild.id)
      );
    });

    client.on('webhookUpdate', (channel) => {
      if (channel.guild) {
        handleDestructiveEvent(channel.guild, AuditLogEvent.WebhookCreate, null, 'webhookCreate').catch((e) =>
          logError(client, 'AntiNuke:webhookUpdate', e, channel.guild.id)
        );
      }
    });

    client.on('guildMemberAdd', (member) => {
      if (member.user.bot) {
        handleDestructiveEvent(member.guild, AuditLogEvent.BotAdd, member.id, 'botAdd').catch((e) =>
          logError(client, 'AntiNuke:botAdd', e, member.guild.id)
        );
      }
    });

    // Quarantine Hold: prevent roles from being re-added to a quarantined member
    client.on('guildMemberUpdate', async (oldMember, newMember) => {
      const qKey = `${newMember.guild.id}:${newMember.id}`;
      if (!quarantinedMembers.has(qKey)) return;

      const addedDangerousRoles = newMember.roles.cache.filter(
        (r) => !oldMember.roles.cache.has(r.id) && r.id !== newMember.guild.id
      );

      if (addedDangerousRoles.size > 0) {
        await newMember.roles.remove(addedDangerousRoles, 'Vexora Quarantine Hold enforcement').catch(() => {});
      }
    });
  },
  createServerSnapshot,
  restoreServerSnapshot,
  quarantineMember,
  getQuarantinedList: () => [...quarantinedMembers.entries()],
};
      
