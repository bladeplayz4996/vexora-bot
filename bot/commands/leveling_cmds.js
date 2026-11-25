import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

function getEngagementFeature(client) {
  return client.features?.get('roles_engagement') || null;
}

export default [
  {
    data: new SlashCommandBuilder()
      .setName('rank')
      .setDescription('Check your or another member’s current Level, XP, and Server Rank.')
      .addUserOption((opt) =>
        opt.setName('user').setDescription('Member to inspect').setRequired(false)
      ),
    aliases: ['level'],
    cooldown: 4,
    async execute(interaction, client) {
      const targetUser = interaction.options.getUser('user') || interaction.user;
      const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
      const engagement = getEngagementFeature(client);

      if (!engagement?.getRankPayload) {
        return interaction.reply({ content: 'Leveling engine is not initialized yet.', ephemeral: true });
      }

      const payload = await engagement.getRankPayload({
        guild: interaction.guild,
        user: targetUser,
        member: targetMember,
        client,
      });

      return interaction.reply(payload);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('levels')
      .setDescription('View the server XP and Level leaderboard.')
      .addIntegerOption((opt) =>
        opt.setName('page').setDescription('Leaderboard page').setMinValue(1).setRequired(false)
      ),
    aliases: ['leaderboard'],
    cooldown: 5,
    async execute(interaction, client) {
      const page = interaction.options.getInteger('page') || 1;
      const engagement = getEngagementFeature(client);

      if (!engagement?.getLeaderboardPayload) {
        return interaction.reply({ content: 'Leaderboard engine is not initialized yet.', ephemeral: true });
      }

      const payload = await engagement.getLeaderboardPayload({
        guild: interaction.guild,
        page,
        client,
      });

      return interaction.reply(payload);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('rankcard')
      .setDescription('Customize your personal rank card accent color, background banner, or badge style.')
      .addStringOption((opt) =>
        opt
          .setName('accent_color')
          .setDescription('HEX color code (e.g. #5865F2)')
          .setRequired(false)
      )
      .addStringOption((opt) =>
        opt
          .setName('banner_url')
          .setDescription('Direct HTTPS image URL for rank card background (or "reset")')
          .setRequired(false)
      )
      .addStringOption((opt) =>
        opt
          .setName('style')
          .setDescription('Card theme layout')
          .addChoices(
            { name: 'Cyber Neon', value: 'neon' },
            { name: 'Minimal Dark', value: 'minimal' },
            { name: 'Tactical Glass', value: 'tactical' }
          )
          .setRequired(false)
      ),
    cooldown: 5,
    async execute(interaction, client) {
      const accentColor = interaction.options.getString('accent_color');
      const bannerUrl = interaction.options.getString('banner_url');
      const style = interaction.options.getString('style');
      const engagement = getEngagementFeature(client);

      if (!engagement?.updateRankCard) {
        return interaction.reply({ content: 'Rank card customization is unavailable right now.', ephemeral: true });
      }

      const result = await engagement.updateRankCard({
        guildId: interaction.guild.id,
        user: interaction.user,
        accentColor,
        bannerUrl,
        style,
      });

      return interaction.reply({ ...result, ephemeral: true });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('addxp')
      .setDescription('[Admin] Manually grant XP to a server member.')
      .addUserOption((opt) => opt.setName('user').setDescription('Target member').setRequired(true))
      .addIntegerOption((opt) =>
        opt.setName('amount').setDescription('XP amount to add').setMinValue(1).setMaxValue(1000000).setRequired(true)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    adminOnly: true,
    cooldown: 2,
    async execute(interaction, client) {
      const targetUser = interaction.options.getUser('user', true);
      const amount = interaction.options.getInteger('amount', true);
      const engagement = getEngagementFeature(client);

      if (!engagement?.modifyMemberXp) {
        return interaction.reply({ content: 'Leveling engine unavailable.', ephemeral: true });
      }

      const result = await engagement.modifyMemberXp({
        mode: 'add',
        guild: interaction.guild,
        targetUser,
        amount,
        moderator: interaction.user,
        client,
      });

      return interaction.reply({ ...result, ephemeral: true });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('removexp')
      .setDescription('[Admin] Deduct XP from a server member.')
      .addUserOption((opt) => opt.setName('user').setDescription('Target member').setRequired(true))
      .addIntegerOption((opt) =>
        opt.setName('amount').setDescription('XP amount to remove').setMinValue(1).setMaxValue(1000000).setRequired(true)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    adminOnly: true,
    cooldown: 2,
    async execute(interaction, client) {
      const targetUser = interaction.options.getUser('user', true);
      const amount = interaction.options.getInteger('amount', true);
      const engagement = getEngagementFeature(client);

      if (!engagement?.modifyMemberXp) {
        return interaction.reply({ content: 'Leveling engine unavailable.', ephemeral: true });
      }

      const result = await engagement.modifyMemberXp({
        mode: 'remove',
        guild: interaction.guild,
        targetUser,
        amount,
        moderator: interaction.user,
        client,
      });

      return interaction.reply({ ...result, ephemeral: true });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('setlevel')
      .setDescription('[Admin] Directly set a member’s level.')
      .addUserOption((opt) => opt.setName('user').setDescription('Target member').setRequired(true))
      .addIntegerOption((opt) =>
        opt.setName('level').setDescription('Target level (0-500)').setMinValue(0).setMaxValue(500).setRequired(true)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    adminOnly: true,
    cooldown: 2,
    async execute(interaction, client) {
      const targetUser = interaction.options.getUser('user', true);
      const level = interaction.options.getInteger('level', true);
      const engagement = getEngagementFeature(client);

      if (!engagement?.modifyMemberXp) {
        return interaction.reply({ content: 'Leveling engine unavailable.', ephemeral: true });
      }

      const result = await engagement.modifyMemberXp({
        mode: 'setlevel',
        guild: interaction.guild,
        targetUser,
        level,
        moderator: interaction.user,
        client,
      });

      return interaction.reply({ ...result, ephemeral: true });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('resetxp')
      .setDescription('[Admin] Reset XP for a specific member or the entire server.')
      .addStringOption((opt) =>
        opt
          .setName('scope')
          .setDescription('Choose "member" or "all"')
          .addChoices(
            { name: 'Single Member', value: 'member' },
            { name: 'Entire Server', value: 'all' }
          )
          .setRequired(true)
      )
      .addUserOption((opt) =>
        opt.setName('user').setDescription('Required when scope is Single Member').setRequired(false)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    adminOnly: true,
    cooldown: 5,
    async execute(interaction, client) {
      const scope = interaction.options.getString('scope', true);
      const targetUser = interaction.options.getUser('user');
      const engagement = getEngagementFeature(client);

      if (scope === 'member' && !targetUser) {
        return interaction.reply({
          content: 'Please select a `user` when resetting XP for a single member.',
          ephemeral: true,
        });
      }

      if (!engagement?.resetXp) {
        return interaction.reply({ content: 'Leveling engine unavailable.', ephemeral: true });
      }

      const result = await engagement.resetXp({
        guild: interaction.guild,
        scope,
        targetUser,
        moderator: interaction.user,
      });

      return interaction.reply({ ...result, ephemeral: true });
    },
  },
];
