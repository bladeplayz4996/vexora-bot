import { Router } from 'express';
import {
  EconomyConfig,
  ShopItem,
  MemberWallet,
  EconomyLog,
} from '../../data/schemas/economy_shop_schema.js';
import { requireAuth, requireGuildAccess } from './auth_routes.js';

const router = Router();
router.use(requireAuth);

// GET /api/economy/:guildId -> Economy config, shop items, top balances & recent logs
router.get('/:guildId', requireGuildAccess, async (req, res) => {
  const { guildId } = req;
  let config = await EconomyConfig.findOne({ guildId }).lean().catch(() => null);
  if (!config) {
    config = (await EconomyConfig.create({ guildId })).toObject();
  }

  const [items, wallets, logs] = await Promise.all([
    ShopItem.find({ guildId }).sort({ createdAt: -1 }).lean().catch(() => []),
    MemberWallet.find({ guildId }).sort({ wallet: -1, bank: -1 }).limit(50).lean().catch(() => []),
    EconomyLog.find({ guildId }).sort({ createdAt: -1 }).limit(100).lean().catch(() => []),
  ]);

  return res.json({ ok: true, guildId, config, items, wallets, logs });
});

// PUT /api/economy/:guildId/config -> Update currency, bank capacity & work/crime/rob/gamble rules
router.put('/:guildId/config', requireGuildAccess, async (req, res) => {
  const { guildId } = req;
  const updates = req.body?.config || req.body || {};
  delete updates._id;
  delete updates.guildId;

  const updated = await EconomyConfig.findOneAndUpdate(
    { guildId },
    { $set: updates },
    { new: true, upsert: true, runValidators: true }
  ).lean();

  const botClient = req.app.get('discordClient');
  const ecoFeature = botClient?.features?.get('economy_shop');
  if (ecoFeature?.getEconomyConfig) {
    Object.assign(ecoFeature.getEconomyConfig(guildId), updated);
  }

  return res.json({ ok: true, guildId, config: updated });
});

// POST /api/economy/:guildId/shop -> Create or update a shop item (including single/multi rolePicker)
router.post('/:guildId/shop', requireGuildAccess, async (req, res) => {
  const { guildId } = req;
  const payload = req.body || {};
  const itemId =
    payload.itemId ||
    `item_${String(payload.name || 'item')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .slice(0, 24)}_${Date.now().toString(36)}`;

  const doc = {
    guildId,
    itemId,
    name: String(payload.name || 'Untitled Item').trim(),
    price: Math.max(0, Number(payload.price ?? 100)),
    stock: payload.stock === '' || payload.stock === null || payload.stock === undefined ? null : Math.max(0, Number(payload.stock)),
    description: String(payload.description || ''),
    imageUrl: String(payload.imageUrl || ''),
    rolePicker: {
      enabled: Boolean(payload.rolePicker?.enabled),
      roleIds: Array.isArray(payload.rolePicker?.roleIds) ? payload.rolePicker.roleIds : [],
      pickMode: payload.rolePicker?.pickMode === 'multi' ? 'multi' : 'single',
      keepPreviousRoles: Boolean(payload.rolePicker?.keepPreviousRoles),
    },
  };

  const saved = await ShopItem.findOneAndUpdate(
    { guildId, itemId },
    { $set: doc },
    { new: true, upsert: true, runValidators: true }
  ).lean();

  const botClient = req.app.get('discordClient');
  const ecoFeature = botClient?.features?.get('economy_shop');
  if (ecoFeature?.getShopItems && ecoFeature?.setShopItems) {
    const allItems = await ShopItem.find({ guildId }).lean();
    ecoFeature.setShopItems(
      guildId,
      allItems.map((i) => ({ ...i, id: i.itemId }))
    );
  }

  return res.json({ ok: true, item: saved });
});

// DELETE /api/economy/:guildId/shop/:itemId -> Remove a shop item
router.delete('/:guildId/shop/:itemId', requireGuildAccess, async (req, res) => {
  const { guildId } = req;
  const { itemId } = req.params;

  await ShopItem.deleteOne({ guildId, itemId });

  const botClient = req.app.get('discordClient');
  const ecoFeature = botClient?.features?.get('economy_shop');
  if (ecoFeature?.setShopItems) {
    const remaining = await ShopItem.find({ guildId }).lean();
    ecoFeature.setShopItems(
      guildId,
      remaining.map((i) => ({ ...i, id: i.itemId }))
    );
  }

  return res.json({ ok: true, deletedItemId: itemId });
});

// POST /api/economy/:guildId/balances/adjust -> Credit/debit user wallet or bank from dashboard
router.post('/:guildId/balances/adjust', requireGuildAccess, async (req, res) => {
  const { guildId } = req;
  const { userId, bucket = 'wallet', delta = 0, note = 'Dashboard adjustment' } = req.body || {};
  const numericDelta = Number(delta);

  if (!userId || !Number.isFinite(numericDelta) || numericDelta === 0) {
    return res.status(400).json({ ok: false, error: 'Provide a valid userId and non-zero delta.' });
  }

  const targetField = bucket === 'bank' ? 'bank' : 'wallet';
  const walletDoc = await MemberWallet.findOneAndUpdate(
    { guildId, userId },
    { $inc: { [targetField]: numericDelta } },
    { new: true, upsert: true }
  ).lean();

  if (walletDoc[targetField] < 0) {
    walletDoc[targetField] = 0;
    await MemberWallet.updateOne({ guildId, userId }, { $set: { [targetField]: 0 } });
  }

  await EconomyLog.create({
    guildId,
    txId: `TX-${Date.now().toString(36).toUpperCase()}`,
    type: `dashboard_${targetField}_adjust`,
    userId,
    moderatorId: req.session?.user?.id || 'dashboard',
    amount: numericDelta,
    note,
  });

  return res.json({ ok: true, wallet: walletDoc });
});

export default router;
