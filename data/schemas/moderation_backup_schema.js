import mongoose from 'mongoose';

const ModerationCaseSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, index: true },
    caseId: { type: String, required: true },
    action: { type: String, required: true },
    targetId: { type: String, required: true },
    targetTag: { type: String, default: '' },
    moderatorId: { type: String, required: true },
    moderatorTag: { type: String, default: '' },
    reason: { type: String, default: 'No reason provided' },
    duration: { type: String, default: null },
  },
  { timestamps: true }
);
ModerationCaseSchema.index({ guildId: 1, caseId: 1 }, { unique: true });

const MemberWarningSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    warnId: { type: String, required: true },
    reason: { type: String, required: true },
    moderatorId: { type: String, required: true },
    moderatorTag: { type: String, default: '' },
  },
  { timestamps: true }
);

const ServerBackupSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, index: true },
    snapshotId: { type: String, required: true },
    reason: { type: String, default: 'manual' },
    guildMeta: { type: mongoose.Schema.Types.Mixed, default: {} },
    roles: { type: [mongoose.Schema.Types.Mixed], default: [] },
    channels: { type: [mongoose.Schema.Types.Mixed], default: [] },
    emojis: { type: [mongoose.Schema.Types.Mixed], default: [] },
    stickers: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { timestamps: true }
);
ServerBackupSchema.index({ guildId: 1, snapshotId: 1 }, { unique: true });

export const ModerationCase =
  mongoose.models.ModerationCase || mongoose.model('ModerationCase', ModerationCaseSchema);
export const MemberWarning =
  mongoose.models.MemberWarning || mongoose.model('MemberWarning', MemberWarningSchema);
export const ServerBackup =
  mongoose.models.ServerBackup || mongoose.model('ServerBackup', ServerBackupSchema);
