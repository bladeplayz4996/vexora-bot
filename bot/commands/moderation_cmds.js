import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { canModerateTarget } from '../global_addons/permission_guard.js';

function getModFeature(client) {
  return client.features?.get('automod_logs') || client.features?.get('moderation') || null;
}

export default [
  {
    data: new SlashCommandBuilder()
      .setName('ban')
      .setDescription('Permanently ban a member from the server.')
      .addUserOption((opt) => opt.setName('user').setDescription('Target member').setRequired(true))
      .addStringOption((opt) => opt.setName('reason').setDescription('Reason for ban').setRequired(false))
      .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    cooldown: 3,
    userPermissions: [PermissionFlagsBits.BanMembers],
    botPermissions: [PermissionFlagsBits.BanMembers],
    async execute(interaction, client) {
      const targetUser = interaction.options.getUser('user', true);
      const reason = interaction.options.getString('reason') || 'No reason provided';
      const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

      if (targetMember) {
        const check = canModerateTarget(interaction.guild, interaction.member, targetMember);
        if (!check.ok) return interaction.reply({ content: check.reason, ephemeral: true });
      }

      const feature = getModFeature(client);
      if (feature?.executeAction) {
        const result = await feature.executeAction({
          action: 'ban',
          guild: interaction.guild,
          moderator: interaction.user,
          targetUser,
          targetMember,
          reason,
        });
        return interaction.reply({
          content: result.message || `Banned **${targetUser.tag}** (${result.caseId || 'Case logged'}).`,
          ephemeral: true,
        });
      }

      await interaction.guild.members.ban(targetUser.id, { reason });
      return interaction.reply({ content: `Banned **${targetUser.tag}** — Reason: ${reason}` });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('unban')
      .setDescription('Unban a user by their Discord user ID.')
      .addStringOption((opt) => opt.setName('user_id').setDescription('Discord User ID').setRequired(true))
      .addStringOption((opt) => opt.setName('reason').setDescription('Reason for unban').setRequired(false))
      .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    cooldown: 3,
    userPermissions: [PermissionFlagsBits.BanMembers],
    botPermissions: [PermissionFlagsBits.BanMembers],
    async execute(interaction, client) {
      const userId = interaction.options.getString('user_id', true).trim();
      const reason = interaction.options.getString('reason') || 'Unbanned via command';
      const feature = getModFeature(client);

      if (feature?.executeAction) {
        const result = await feature.executeAction({
          action: 'unban',
          guild: interaction.guild,
          moderator: interaction.user,
          targetUserId: userId,
          reason,
        });
        return interaction.reply({ content: result.message, ephemeral: true });
      }

      const unbannedUser = await interaction.guild.members.unban(userId, reason);
      return interaction.reply({ content: `Unbanned **${unbannedUser?.tag || userId}**.` });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('softban')
      .setDescription('Ban and immediately unban a member to clear recent messages.')
      .addUserOption((opt) => opt.setName('user').setDescription('Target member').setRequired(true))
      .addStringOption((opt) => opt.setName('reason').setDescription('Reason for softban').setRequired(false))
      .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    cooldown: 4,
    userPermissions: [PermissionFlagsBits.BanMembers],
    botPermissions: [PermissionFlagsBits.BanMembers],
    async execute(interaction, client) {
      const targetUser = interaction.options.getUser('user', true);
      const reason = interaction.options.getString('reason') || 'Softban message cleanup';
      const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

      if (targetMember) {
        const check = canModerateTarget(interaction.guild, interaction.member, targetMember);
        if (!check.ok) return interaction.reply({ content: check.reason, ephemeral: true });
      }

      const feature = getModFeature(client);
      if (feature?.executeAction) {
        const result = await feature.executeAction({
          action: 'softban',
          guild: interaction.guild,
          moderator: interaction.user,
          targetUser,
          targetMember,
          reason,
        });
        return interaction.reply({ content: result.message, ephemeral: true });
      }

      await interaction.guild.members.ban(targetUser.id, { deleteMessageSeconds: 86400, reason });
      await interaction.guild.members.unban(targetUser.id, 'Softban complete');
      return interaction.reply({ content: `Softbanned **${targetUser.tag}** (${reason}).` });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('kick')
      .setDescription('Kick a member from the server.')
      .addUserOption((opt) => opt.setName('user').setDescription('Target member').setRequired(true))
      .addStringOption((opt) => opt.setName('reason').setDescription('Reason for kick').setRequired(false))
      .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    cooldown: 3,
    userPermissions: [PermissionFlagsBits.KickMembers],
    botPermissions: [PermissionFlagsBits.KickMembers],
    async execute(interaction, client) {
      const targetUser = interaction.options.getUser('user', true);
      const reason = interaction.options.getString('reason') || 'No reason provided';
      const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

      if (!targetMember) {
        return interaction.reply({ content: 'That user is not currently in the server.', ephemeral: true });
      }

      const check = canModerateTarget(interaction.guild, interaction.member, targetMember);
      if (!check.ok) return interaction.reply({ content: check.reason, ephemeral: true });

      const feature = getModFeature(client);
      if (feature?.executeAction) {
        const result = await feature.executeAction({
          action: 'kick',
          guild: interaction.guild,
          moderator: interaction.user,
          targetUser,
          targetMember,
          reason,
        });
        return interaction.reply({ content: result.message, ephemeral: true });
      }

      await targetMember.kick(reason);
      return interaction.reply({ content: `Kicked **${targetUser.tag}** — Reason: ${reason}` });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('timeout')
      .setDescription('Temporarily mute/timeout a member.')
      .addUserOption((opt) => opt.setName('user').setDescription('Target member').setRequired(true))
      .addIntegerOption((opt) =>
        opt.setName('duration').setDescription('Duration in minutes (1 to 40320)').setMinValue(1).setMaxValue(40320).setRequired(true)
      )
      .addStringOption((opt) => opt.setName('reason').setDescription('Reason for timeout').setRequired(false))
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    cooldown: 3,
    userPermissions: [PermissionFlagsBits.ModerateMembers],
    botPermissions: [PermissionFlagsBits.ModerateMembers],
    async execute(interaction, client) {
      const targetUser = interaction.options.getUser('user', true);
      const minutes = interaction.options.getInteger('duration', true);
      const reason = interaction.options.getString('reason') || 'No reason provided';
      const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

      if (!targetMember) {
        return interaction.reply({ content: 'Target member not found in this server.', ephemeral: true });
      }

      const check = canModerateTarget(interaction.guild, interaction.member, targetMember);
      if (!check.ok) return interaction.reply({ content: check.reason, ephemeral: true });

      const feature = getModFeature(client);
      if (feature?.executeAction) {
        const result = await feature.executeAction({
          action: 'timeout',
          guild: interaction.guild,
          moderator: interaction.user,
          targetUser,
          targetMember,
          durationMinutes: minutes,
          reason,
        });
        return interaction.reply({ content: result.message, ephemeral: true });
      }

      await targetMember.timeout(minutes * 60 * 1000, reason);
      return interaction.reply({ content: `Timed out **${targetUser.tag}** for **${minutes}m** (${reason}).` });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('unmute')
      .setDescription('Remove timeout/mute from a member.')
      .addUserOption((opt) => opt.setName('user').setDescription('Target member').setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    cooldown: 3,
    userPermissions: [PermissionFlagsBits.ModerateMembers],
    botPermissions: [PermissionFlagsBits.ModerateMembers],
    async execute(interaction, client) {
      const targetUser = interaction.options.getUser('user', true);
      const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
      if (!targetMember) {
        return interaction.reply({ content: 'Target member not found.', ephemeral: true });
      }

      const feature = getModFeature(client);
      if (feature?.executeAction) {
        const result = await feature.executeAction({
          action: 'unmute',
          guild: interaction.guild,
          moderator: interaction.user,
          targetUser,
          targetMember,
        });
        return interaction.reply({ content: result.message, ephemeral: true });
      }

      await targetMember.timeout(null, 'Timeout removed');
      return interaction.reply({ content: `Removed timeout for **${targetUser.tag}**.` });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('warn')
      .setDescription('Issue an official warning to a member.')
      .addUserOption((opt) => opt.setName('user').setDescription('Target member').setRequired(true))
      .addStringOption((opt) => opt.setName('reason').setDescription('Warning reason').setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    cooldown: 3,
    userPermissions: [PermissionFlagsBits.ModerateMembers],
    async execute(interaction, client) {
      const targetUser = interaction.options.getUser('user', true);
      const reason = interaction.options.getString('reason', true);
      const feature = getModFeature(client);

      if (feature?.addWarning) {
        const result = await feature.addWarning({
          guild: interaction.guild,
          moderator: interaction.user,
          targetUser,
          reason,
        });
        return interaction.reply({ content: result.message, ephemeral: true });
      }

      return interaction.reply({ content: `Warned **${targetUser.tag}** — Reason: ${reason}` });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('warnings')
      .setDescription('View warnings for a member.')
      .addUserOption((opt) => opt.setName('user').setDescription('Target member').setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    cooldown: 3,
    userPermissions: [PermissionFlagsBits.ModerateMembers],
    async execute(interaction, client) {
      const targetUser = interaction.options.getUser('user', true);
      const feature = getModFeature(client);

      if (feature?.getWarnings) {
        const summary = await feature.getWarnings(interaction.guild.id, targetUser.id);
        return interaction.reply({ content: summary, ephemeral: true });
      }

      return interaction.reply({ content: `No warning records found for **${targetUser.tag}**.`, ephemeral: true });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('clearwarns')
      .setDescription('Clear all warnings for a member.')
      .addUserOption((opt) => opt.setName('user').setDescription('Target member').setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    cooldown: 4,
    userPermissions: [PermissionFlagsBits.Administrator],
    async execute(interaction, client) {
      const targetUser = interaction.options.getUser('user', true);
      const feature = getModFeature(client);

      if (feature?.clearWarnings) {
        const result = await feature.clearWarnings(interaction.guild.id, targetUser.id, interaction.user);
        return interaction.reply({ content: result.message, ephemeral: true });
      }

      return interaction.reply({ content: `Cleared warnings for **${targetUser.tag}**.`, ephemeral: true });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('case')
      .setDescription('Look up details for a specific moderation case ID.')
      .addStringOption((opt) => opt.setName('case_id').setDescription('Moderation Case ID').setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    cooldown: 3,
    userPermissions: [PermissionFlagsBits.ModerateMembers],
    async execute(interaction, client) {
      const caseId = interaction.options.getString('case_id', true).trim();
      const feature = getModFeature(client);

      if (feature?.getCase) {
        const payload = await feature.getCase(interaction.guild.id, caseId);
        return interaction.reply({ ...payload, ephemeral: true });
      }

      return interaction.reply({ content: `Case \`${caseId}\` not found.`, ephemeral: true });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('purge')
      .setDescription('Bulk delete messages from the current channel.')
      .addIntegerOption((opt) =>
        opt.setName('count').setDescription('Number of messages to delete (1-100)').setMinValue(1).setMaxValue(100).setRequired(true)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    cooldown: 4,
    userPermissions: [PermissionFlagsBits.ManageMessages],
    botPermissions: [PermissionFlagsBits.ManageMessages],
    async execute(interaction) {
      const count = interaction.options.getInteger('count', true);
      const deleted = await interaction.channel.bulkDelete(count, true);
      return interaction.reply({ content: `Deleted **${deleted.size}** message(s).`, ephemeral: true });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('slowmode')
      .setDescription('Set slowmode delay (in seconds) for the current channel.')
      .addIntegerOption((opt) =>
        opt.setName('seconds').setDescription('Delay in seconds (0 to 21600)').setMinValue(0).setMaxValue(21600).setRequired(true)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    cooldown: 3,
    userPermissions: [PermissionFlagsBits.ManageChannels],
    botPermissions: [PermissionFlagsBits.ManageChannels],
    async execute(interaction) {
      const seconds = interaction.options.getInteger('seconds', true);
      await interaction.channel.setRateLimitPerUser(seconds);
      return interaction.reply({
        content: seconds > 0 ? `Channel slowmode set to **${seconds}s**.` : 'Channel slowmode disabled.',
        ephemeral: true,
      });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('lock')
      .setDescription('Lock the current channel so members cannot send messages.')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    cooldown: 3,
    userPermissions: [PermissionFlagsBits.ManageChannels],
    botPermissions: [PermissionFlagsBits.ManageChannels],
    async execute(interaction) {
      await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
        SendMessages: false,
      });
      return interaction.reply({ content: `Locked ${interaction.channel}.` });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('unlock')
      .setDescription('Unlock the current channel so members can send messages again.')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    cooldown: 3,
    userPermissions: [PermissionFlagsBits.ManageChannels],
    botPermissions: [PermissionFlagsBits.ManageChannels],
    async execute(interaction) {
      await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
        SendMessages: null,
      });
      return interaction.reply({ content: `Unlocked ${interaction.channel}.` });
    },
  },
];
      
