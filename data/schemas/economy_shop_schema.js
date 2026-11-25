import mongoose from 'mongoose';

const EconomyConfigSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, unique: true, index: true },
    enabled: { type: Boolean, default: true },
    currencyName: { type: String, default: 'Coins' },
    currencySymbol: { type: String, default: '🪙' },
    startingWallet: { type: Number, default: 250 },
    startingBank: { type: Number, default: 0 },
    maxBankCapacity: { type: Number, default: 100000 },
    work: {
      min: { type: Number, default: 80 },
      max: { type: Number, default: 220 },
      cooldownSeconds: { type: Number, default: 1800 },
    },
    daily: {
      amount: { type: Number, default: 500 },
      cooldownSeconds: { type: Number, default: 86400 },
    },
    crime: {
      min: { type: Number, default: 250 },
      max: { type: Number, default: 650 },
      fineMin: { type: Number, default: 120 },
      fineMax: { type: Number, default: 300 },
      successRate: { type: Number, default: 0.55 },
      cooldownSeconds: { type: Number, default: 3600 },
    },
    hunt: {
      min: { type: Number, default: 90 },
      max: { type: Number, default: 260 },
      cooldownSeconds: { type: Number, default: 1200 },
    },
    fish: {
      min: { type: Number, default: 70 },
      max: { type: Number, default: 210 },
      cooldownSeconds: { type: Number, default: 900 },
    },
    rob: {
      successRate: { type: Number, default: 0.4 },
      maxStealPercent: { type: Number, default: 0.35 },
      fineAmount: { type: Number, default: 200 },
      cooldownSeconds: { type: Number, default: 3600 },
    },
  },
  { timestamps: true }
);

const ShopItemSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, index: true },
    itemId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, default: null },
    description: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    rolePicker: {
      enabled: { type: Boolean, default: false },
      roleIds: { type: [String], default: [] },
      pickMode: { type: String, enum: ['single', 'multi'], default: 'single' },
      keepPreviousRoles: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);
ShopItemSchema.index({ guildId: 1, itemId: 1 }, { unique: true });

const MemberWalletSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    wallet: { type: Number, default: 250 },
    bank: { type: Number, default: 0 },
    inventory: [
      {
        itemId: String,
        name: String,
        quantity: { type: Number, default: 1 },
        rolePicker: {
          enabled: { type: Boolean, default: false },
          roleIds: { type: [String], default: [] },
          pickMode: { type: String, enum: ['single', 'multi'], default: 'single' },
        },
      },
    ],
  },
  { timestamps: true }
);
MemberWalletSchema.index({ guildId: 1, userId: 1 }, { unique: true });

const EconomyLogSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, index: true },
    txId: { type: String, required: true },
    type: { type: String, required: true },
    userId: { type: String, required: true },
    targetUserId: { type: String, default: null },
    moderatorId: { type: String, default: null },
    itemId: { type: String, default: null },
    amount: { type: Number, default: 0 },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

export const EconomyConfig =
  mongoose.models.EconomyConfig || mongoose.model('EconomyConfig', EconomyConfigSchema);
export const ShopItem =
  mongoose.models.ShopItem || mongoose.model('ShopItem', ShopItemSchema);
export const MemberWallet =
  mongoose.models.MemberWallet || mongoose.model('MemberWallet', MemberWalletSchema);
export const EconomyLog =
  mongoose.models.EconomyLog || mongoose.model('EconomyLog', EconomyLogSchema);
