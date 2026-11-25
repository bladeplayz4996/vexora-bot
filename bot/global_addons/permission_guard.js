import { PermissionsBitField } from 'discord.js';

/**
 * Checks if a user/member is allowed to run a command or use a restricted feature,
 * including admin/staff overrides, channel/role rules, and Discord role hierarchy.
 */
export async function checkCommandAccess(context, command = {}, guildConfig = null) {
  const guild = context.guild;
  const user = context.user || context.author;
  const channel = context.channel;

  if (!guild || !user) {
    return { allowed: false, reason: 'This command can only be used inside a server.' };
  }

  let member = context.member;
  if (!member && guild.members?.fetch) {
    member = await guild.members.fetch(user.id).catch(() => null);
  }
  if (!member) {
    return { allowed: false, reason: 'Could not verify your server member permissions.' };
  }

  const isServerOwner = guild.ownerId === user.id;
  const isGlobalAdmin = (process.env.ADMIN_USER_IDS || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
    .includes(user.id);
  const hasDiscordAdmin = member.permissions.has(PermissionsBitField.Flags.Administrator);

  const staffRoleIds = guildConfig?.settings?.staffRoleIds || [];
  const adminRoleIds = guildConfig?.settings?.adminRoleIds || [];
  const hasDashboardStaff =
    staffRoleIds.some((rId) => member.roles.cache.has(rId)) ||
    adminRoleIds.some((rId) => member.roles.cache.has(rId));

  const isPrivileged = isServerOwner || isGlobalAdmin || hasDiscordAdmin || hasDashboardStaff;

  // Per-command / per-guild override check
  const cmdName = command?.data?.name;
  const cmdOverride = cmdName ? guildConfig?.commands?.overrides?.[cmdName] : null;

  if (cmdOverride?.enabled === false && !isPrivileged) {
    return { allowed: false, reason: 'This command is currently disabled in this server.' };
  }

  if (Array.isArray(cmdOverride?.blockedChannels) && cmdOverride.blockedChannels.includes(channel?.id) && !isPrivileged) {
    return { allowed: false, reason: 'This command cannot be used in this channel.' };
  }

  if (Array.isArray(cmdOverride?.allowedChannels) && cmdOverride.allowedChannels.length > 0 && !isPrivileged) {
    if (!cmdOverride.allowedChannels.includes(channel?.id)) {
      return { allowed: false, reason: 'This command is restricted to specific channels in this server.' };
    }
  }

  if (Array.isArray(cmdOverride?.blockedRoles) && cmdOverride.blockedRoles.some((rId) => member.roles.cache.has(rId)) && !isPrivileged) {
    return { allowed: false, reason: 'One of your roles is restricted from using this command.' };
  }

  if (Array.isArray(cmdOverride?.allowedRoles) && cmdOverride.allowedRoles.length > 0 && !isPrivileged) {
    const matchesAllowedRole = cmdOverride.allowedRoles.some((rId) => member.roles.cache.has(rId));
    if (!matchesAllowedRole) {
      return { allowed: false, reason: 'You do not have a permitted role to run this command.' };
    }
  }

  // Dashboard/Admin-only commands check
  if (command?.adminOnly && !isPrivileged) {
    return { allowed: false, reason: 'Only server administrators or authorized staff can use this command.' };
  }

  // Required Discord permissions check
  if (Array.isArray(command?.userPermissions) && command.userPermissions.length > 0 && !isPrivileged) {
    const missing = command.userPermissions.filter((perm) => !member.permissions.has(perm));
    if (missing.length > 0) {
      return {
        allowed: false,
        reason: `You are missing required permission(s): **${missing.join(', ')}**.`,
      };
    }
  }

  if (Array.isArray(command?.botPermissions) && command.botPermissions.length > 0) {
    const botMember = guild.members.me;
    if (!botMember) {
      return { allowed: false, reason: 'Bot member context is unavailable.' };
    }
    const missingBotPerms = command.botPermissions.filter((perm) => !botMember.permissions.has(perm));
    if (missingBotPerms.length > 0) {
      return {
        allowed: false,
        reason: `I need the following permission(s) to do that: **${missingBotPerms.join(', ')}**.`,
      };
    }
  }

  return { allowed: true, isPrivileged };
}

/**
 * Checks whether the bot and acting moderator sit higher than a target member/role.
 */
export function canModerateTarget(guild, actorMember, targetMember) {
  const botMember = guild?.members?.me;
  if (!botMember || !actorMember || !targetMember) {
    return { ok: false, reason: 'Missing member or guild context.' };
  }

  if (targetMember.id === guild.ownerId) {
    return { ok: false, reason: 'You cannot moderate the server owner.' };
  }

  if (targetMember.id === botMember.id) {
    return { ok: false, reason: 'I cannot perform that moderation action on myself.' };
  }

  const actorIsOwner = guild.ownerId === actorMember.id;
  if (!actorIsOwner && targetMember.roles.highest.position >= actorMember.roles.highest.position) {
    return { ok: false, reason: 'Your highest role must be above the target member.' };
  }

  if (!targetMember.moderatable && targetMember.roles.highest.position >= botMember.roles.highest.position) {
    return { ok: false, reason: 'My highest role is lower than or equal to the target member.' };
  }

  return { ok: true };
}
  
