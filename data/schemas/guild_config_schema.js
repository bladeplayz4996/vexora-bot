import mongoose from 'mongoose';

const EmbedFieldSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    value: { type: String, default: '' },
    inline: { type: Boolean, default: false },
  },
  { _id: false }
);

const EmbedSchema = new mongoose.Schema(
  {
    color: { type: String, default: '#5865F2' },
    author: {
      name: { type: String, default: '' },
      url: { type: String, default: '' },
      iconUrl: { type: String, default: '' },
    },
    title: { type: String, default: '' },
    titleUrl: { type: String, default: '' },
    description: { type: String, maxlength: 4000, default: '' },
    fields: { type: [EmbedFieldSchema], default: [] },
    thumbnailUrl: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    footer: {
      text: { type: String, default: '' },
      iconUrl: { type: String, default: '' },
    },
    timestamp: { type: Boolean, default: false },
  },
  { _id: false }
);

const MessagePayloadSchema = new mongoose.Schema(
  {
    mode: { type: String, enum: ['plain', 'embed'], default: 'embed' },
    content: { type: String, maxlength: 2000, default: '' },
    embed: { type: EmbedSchema, default: () => ({}) },
    embeds: { type: [EmbedSchema], default: [] },
  },
  { _id: false }
);

const CommandOverrideSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: true },
    cooldownSeconds: { type: Number, default: 3 },
    allowedChannels: { type: [String], default: [] },
    blockedChannels: { type: [String], default: [] },
    allowedRoles: { type: [String], default: [] },
    blockedRoles: { type: [String], default: [] },
  },
  { _id: false }
);

const GuildConfigSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, unique: true, index: true },

    // General
    settings: {
      prefix: { type: String, default: '!' },
      language: { type: String, default: 'en-US' },
      timezone: { type: String, default: 'Asia/Kolkata' },
      adminRoleIds: { type: [String], default: [] },
      staffRoleIds: { type: [String], default: [] },
    },
    customProfile: {
      botName: { type: String, default: 'Vexora' },
      avatarUrl: { type: String, default: '' },
      bio: { type: String, default: '' },
      statusText: { type: String, default: 'Watching {server.name}' },
      activityType: {
        type: String,
        enum: ['playing', 'watching', 'listening', 'competing'],
        default: 'watching',
      },
    },
    roleConnections: {
      enabled: { type: Boolean, default: false },
      linkedRoles: [
        {
          id: String,
          roleId: String,
          minMessages: { type: Number, default: 0 },
          minLevel: { type: Number, default: 0 },
        },
      ],
    },

    // Messaging
    messaging: {
      announcements: {
        join: {
          enabled: { type: Boolean, default: false },
          channelId: { type: String, default: null },
          dmEnabled: { type: Boolean, default: false },
          imageCardEnabled: { type: Boolean, default: false },
          payload: { type: MessagePayloadSchema, default: () => ({}) },
          dmPayload: {
            type: MessagePayloadSchema,
            default: () => ({
              mode: 'plain',
              content: 'Welcome to {server.name}, {user.mention}!',
            }),
          },
        },
        leave: {
          enabled: { type: Boolean, default: false },
          channelId: { type: String, default: null },
          payload: { type: MessagePayloadSchema, default: () => ({}) },
        },
        ban: {
          enabled: { type: Boolean, default: false },
          channelId: { type: String, default: null },
          payload: { type: MessagePayloadSchema, default: () => ({}) },
        },
        boost: {
          enabled: { type: Boolean, default: false },
          channelId: { type: String, default: null },
          payload: { type: MessagePayloadSchema, default: () => ({}) },
        },
      },
      templates: [
        {
          id: String,
          name: String,
          payload: { type: MessagePayloadSchema, default: () => ({}) },
        },
      ],
      actions: [
        {
          id: String,
          name: String,
          triggerEvent: String,
          channelId: String,
          payload: { type: MessagePayloadSchema, default: () => ({}) },
        },
      ],
      autoResponders: [
        {
          id: String,
          trigger: String,
          matchMode: { type: String, enum: ['contains', 'exact', 'startswith'], default: 'contains' },
          responsePayload: {
            type: MessagePayloadSchema,
            default: () => ({ mode: 'plain', content: '{response}' }),
          },
        },
      ],
      autoThreads: [
        {
          id: String,
          channelId: String,
          nameTemplate: { type: String, default: '{thread.name}' },
          autoArchiveDuration: { type: Number, default: 1440 },
        },
      ],
      stickyMessages: {
        type: Map,
        of: new mongoose.Schema(
          {
            enabled: { type: Boolean, default: false },
            interval: { type: Number, default: 4 },
            payload: { type: MessagePayloadSchema, default: () => ({}) },
          },
          { _id: false }
        ),
        default: () => ({}),
      },
      ticketing: {
        enabled: { type: Boolean, default: false },
        categoryId: { type: String, default: null },
        supportRoleIds: { type: [String], default: [] },
        transcriptChannelId: { type: String, default: null },
        welcomePayload: { type: MessagePayloadSchema, default: () => ({}) },
      },
      tags: {
        type: Map,
        of: MessagePayloadSchema,
        default: () => ({}),
      },
    },

    // Commands
    commands: {
      customCommands: [
        {
          id: String,
          name: String,
          cooldownSeconds: { type: Number, default: 5 },
          allowedChannels: { type: [String], default: [] },
          allowedRoles: { type: [String], default: [] },
          responsePayload: {
            type: MessagePayloadSchema,
            default: () => ({ mode: 'plain', content: '{args}' }),
          },
        },
      ],
      overrides: {
        type: Map,
        of: CommandOverrideSchema,
        default: () => ({}),
      },
    },

    // Server Engagement
    engagement: {
      leveling: {
        enabled: { type: Boolean, default: true },
        xpMin: { type: Number, default: 15 },
        xpMax: { type: Number, default: 25 },
        xpCooldownSeconds: { type: Number, default: 45 },
        levelUpChannelId: { type: String, default: null },
        levelUpTemplate: {
          type: String,
          default: '🎉 {user.mention} reached **Level {level}** with **{xp} XP**!',
        },
        roleRewards: { type: Map, of: String, default: () => ({}) },
      },
      tempVoice: {
        enabled: { type: Boolean, default: false },
        generatorChannelId: { type: String, default: null },
        categoryId: { type: String, default: null },
        nameTemplate: { type: String, default: '{vc.name}' },
      },
      statsChannels: [
        {
          id: String,
          channelId: String,
          statType: { type: String, enum: ['members', 'online', 'boosts', 'custom'], default: 'members' },
          labelTemplate: { type: String, default: 'Members: {member.count}' },
        },
      ],
      starboard: {
        enabled: { type: Boolean, default: false },
        emoji: { type: String, default: '⭐' },
        threshold: { type: Number, default: 3 },
        channelId: { type: String, default: null },
      },
      birthdays: {
        enabled: { type: Boolean, default: false },
        channelId: { type: String, default: null },
        roleId: { type: String, default: null },
        wishTemplate: { type: String, default: '🎂 Happy Birthday {birthday.user}!' },
      },
      voiceTextLinking: {
        enabled: { type: Boolean, default: false },
        links: [
          {
            voiceChannelId: String,
            textChannelId: String,
          },
        ],
      },
    },

    // Roles
    roles: {
      autoRoles: [
        {
          roleId: String,
          delaySeconds: { type: Number, default: 0 },
        },
      ],
      reactionRoles: [
        {
          id: String,
          channelId: String,
          messageId: String,
          selectionMode: { type: String, enum: ['single', 'multi'], default: 'multi' },
          uiType: { type: String, enum: ['buttons', 'dropdown', 'emoji'], default: 'buttons' },
          entries: [
            {
              roleId: String,
              label: String,
              emoji: String,
            },
          ],
        },
      ],
      temporaryRoles: [
        {
          id: String,
          roleId: String,
          durationSeconds: Number,
        },
      ],
      persistentRolesEnabled: { type: Boolean, default: true },
      tagRole: {
        enabled: { type: Boolean, default: false },
        tagText: { type: String, default: '' },
        roleId: { type: String, default: null },
      },
      factions: [
        {
          id: String,
          name: String,
          roleId: String,
        },
      ],
    },

    // Moderation & Security
    securityModeration: {
      antiNuke: {
        enabled: { type: Boolean, default: true },
        autoRestoreOnNuke: { type: Boolean, default: false },
        quarantineRoleId: { type: String, default: null },
        logChannelId: { type: String, default: null },
        whitelistedUsers: { type: [String], default: [] },
        whitelistedRoles: { type: [String], default: [] },
      },
      joinGate: {
        enabled: { type: Boolean, default: true },
        minAccountAgeHours: { type: Number, default: 24 },
        blockDefaultAvatar: { type: Boolean, default: false },
        blockInviteInUsername: { type: Boolean, default: true },
        wildcardPatterns: { type: [String], default: [] },
        raidThresholdJoins: { type: Number, default: 8 },
        raidWindowSeconds: { type: Number, default: 10 },
        raidAction: { type: String, enum: ['timeout', 'kick', 'ban', 'quarantine'], default: 'kick' },
        verifiedRoleId: { type: String, default: null },
        verificationChannelId: { type: String, default: null },
        logChannelId: { type: String, default: null },
      },
      automod: {
        enabled: { type: Boolean, default: true },
        heatThreshold: { type: Number, default: 100 },
        heatDecayPerSecond: { type: Number, default: 8 },
        maxMentions: { type: Number, default: 5 },
        maxNewlines: { type: Number, default: 12 },
        blockDiscordInvites: { type: Boolean, default: true },
        blockPhishingLinks: { type: Boolean, default: true },
        wordBlacklist: { type: [String], default: [] },
        modLogChannelId: { type: String, default: null },
        eventLogChannelId: { type: String, default: null },
      },
    },

    // Social Feeds
    socialFeeds: {
      youtube: [
        {
          id: String,
          creatorName: String,
          channelId: String,
          discordChannelId: String,
          roleMentionId: { type: String, default: null },
          payload: { type: MessagePayloadSchema, default: () => ({}) },
        },
      ],
      twitch: [
        {
          id: String,
          creatorName: String,
          username: String,
          discordChannelId: String,
          roleMentionId: { type: String, default: null },
          payload: { type: MessagePayloadSchema, default: () => ({}) },
        },
      ],
    },

    // Utilities
    utilities: {
      loveCalcEnabled: { type: Boolean, default: true },
      honeypotChannelId: { type: String, default: null },
      auditLogChannelId: { type: String, default: null },
    },
  },
  { timestamps: true }
);

export const GuildConfig =
  mongoose.models.GuildConfig || mongoose.model('GuildConfig', GuildConfigSchema);
export default GuildConfig;
