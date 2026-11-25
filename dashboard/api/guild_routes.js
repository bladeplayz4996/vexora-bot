import { Router } from 'express';
import { GuildConfig } from '../../data/schemas/guild_config_schema.js';
import { ModerationCase, MemberWarning, ServerBackup } from '../../data/schemas/moderation_backup_schema.js';
import { requireAuth, requireGuildAccess } from './auth_routes.js';

const router = Router();
router.use(requireAuth);

// GET /api/guilds -> Returns manageable guilds enriched with live Discord channels & roles
router.get('/', (req, res) => {
  const botClient = req.app.get('discordClient');
  const guilds = (req.session?.manageableGuilds || []).map((g) => {
    const liveGuild = botClient?.guilds?.cache?.get(g.id) || null;
    const channels = liveGuild
      ? liveGuild.channels.cache
          .filter((ch) => ch.isTextBased?.() || ch.isVoiceBased?.())
          .map((ch) => ({ id: ch.id, name: ch.name, type: ch.type }))
      : [];
    const roles = liveGuild
      ? liveGuild.roles.cache
          .filter((r) => r.id !== liveGuild.id)
          .sort((a, b) => b.position - a.position)
          .map((r) => ({ id: r.id, name: r.name, color: r.hexColor, managed: r.managed }))
      : [];

    return {
      ...g,
      botInGuild: Boolean(liveGuild),
      memberCount: liveGuild?.memberCount || null,
      channels,
      roles,
    };
  });

  return res.json({ ok: true, guilds });
});

// GET /api/guilds/:guildId/config -> Fetch or initialize GuildConfig
router.get('/:guildId/config', requireGuildAccess, async (req, res) => {
  const { guildId } = req;
  let config = await GuildConfig.findOne({ guildId }).lean().catch(() => null);
  if (!config) {
    const created = await GuildConfig.create({ guildId });
    config = created.toObject();
  }
  return res.json({ ok: true, guildId, config });
});

// PUT /api/guilds/:guildId/config -> Full/partial update of GuildConfig sections
router.put('/:guildId/config', requireGuildAccess, async (req, res) => {
  const { guildId } = req;
  const updates = req.body?.config || req.body || {};
  delete updates._id;
  delete updates.guildId;

  const updated = await GuildConfig.findOneAndUpdate(
    { guildId },
    { $set: updates },
    { new: true, upsert: true, runValidators: true }
  ).lean();

  // Sync live feature engines if loaded on client
  const botClient = req.app.get('discordClient');
  const liveGuild = botClient?.guilds?.cache?.get(guildId);
  if (liveGuild) {
    const messagingMod = botClient.features?.get('messaging_events');
    if (messagingMod?.getGuildMessaging && updated.messaging) {
      Object.assign(messagingMod.getGuildMessaging(guildId), updated.messaging);
    }
    const engagementMod = botClient.features?.get('roles_engagement');
    if (engagementMod?.getEngagementConfig && updated.engagement) {
      Object.assign(engagementMod.getEngagementConfig(guildId), updated.engagement);
    }
    const feedsMod = botClient.features?.get('social_feeds');
    if (feedsMod?.getGuildSocialFeeds && updated.socialFeeds) {
      Object.assign(feedsMod.getGuildSocialFeeds(guildId), updated.socialFeeds);
    }
  }

  return res.json({ ok: true, guildId, config: updated });
});

// GET /api/guilds/:guildId/moderation -> Cases, warnings & server backup snapshots
router.get('/:guildId/moderation', requireGuildAccess, async (req, res) => {
  const { guildId } = req;
  const [cases, warnings, backups] = await Promise.all([
    ModerationCase.find({ guildId }).sort({ createdAt: -1 }).limit(100).lean().catch(() => []),
    MemberWarning.find({ guildId }).sort({ createdAt: -1 }).limit(100).lean().catch(() => []),
    ServerBackup.find({ guildId }).sort({ createdAt: -1 }).limit(20).lean().catch(() => []),
  ]);

  return res.json({ ok: true, guildId, cases, warnings, backups });
});

// POST /api/guilds/:guildId/backups -> Trigger a snapshot or restore a backup
router.post('/:guildId/backups', requireGuildAccess, async (req, res) => {
  const { guildId } = req;
  const { action = 'create', snapshotId = null } = req.body || {};
  const botClient = req.app.get('discordClient');
  const liveGuild = botClient?.guilds?.cache?.get(guildId);
  const securityFeature = botClient?.features?.get('security_nuke');

  if (!liveGuild || !securityFeature) {
    return res.status(400).json({ ok: false, error: 'Live guild or security feature engine unavailable.' });
  }

  if (action === 'restore') {
    const result = await securityFeature.restoreServerSnapshot(liveGuild, snapshotId, botClient);
    return res.json({ ok: result.ok, result });
  }

  const snap = await securityFeature.createServerSnapshot(liveGuild, 'dashboard_manual');
  if (snap) {
    await ServerBackup.create({
      guildId,
      snapshotId: snap.id,
      reason: snap.reason,
      guildMeta: snap.guildMeta,
      roles: snap.roles,
      channels: snap.channels,
      emojis: snap.emojis,
      stickers: snap.stickers,
    }).catch(() => {});
  }

  return res.json({ ok: true, snapshot: snap });
});

export default router;
