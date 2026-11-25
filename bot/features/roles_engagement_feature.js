import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  PermissionsBitField,
  StringSelectMenuBuilder,
} from 'discord.js';
import { parseVariables } from '../global_addons/variable_parser.js';
import { logError } from '../global_addons/error_logger.js';

/**
 * Roles & Server Engagement Feature Engine:
 * - XP & Leveling system with cooldowns, rank cards, level-up alerts & role rewards
 * - Auto roles (with optional delay), Persistent roles, Temporary roles, Reaction/Button/Dropdown role panels & Factions
 * - Temporary Voice channels (Join-to-Create) & Starboard reactions
 */
const xpStore = new Map(); // `${guildId}:${userId}` -> { xp, level, card: { accentColor, bannerUrl, style } }
const xpCooldowns = new Map(); // `${guildId}:${userId}` -> timestamp
const persistentRoleCache = new Map(); // `${guildId}:${userId}` -> string[]
const tempRoleTimers = new Map(); // `${guildId}:${userId}:${roleId}` -> Timeout
const tempVoiceChannels = new Set(); // channelId
const starboardPosted = new Map(); // `${guildId}:${sourceMsgId}` -> starboardMsgId
const guildEngagementConfigs = new Map(); // guildId -> cfg

function getEngagementConfig(guildId) {
  if (!guildEngagementConfigs.has(guildId)) {
    guildEngagementConfigs.set(guildId, {
      leveling: {
        enabled: true,
        xpMin: 15,
        xpMax: 25,
        xpCooldownSeconds: 45,
        levelUpChannelId: null,
        levelUpTemplate: '🎉 Congratulations {user.mention}! You reached **Level {level}**!',
        roleRewards: {}, // levelNumber -> roleId
      },
      roles: {
        autoRoles: [], // [{ roleId, delaySeconds }]
        persistentRolesEnabled: true,
        factions: [], // [{ id, name, roleId }]
      },
      tempVoice: {
        enabled: false,
        generatorChannelId: null,
        categoryId: null,
        nameTemplate: "{user.username}'s Room",
      },
      starboard: {
        enabled: false,
        emoji: '⭐',
        threshold: 3,
        channelId: null,
      },
    });
  }
  return guildEngagementConfigs.get(guildId);
}

export function xpForNextLevel(level) {
  return 5 * level * level + 50 * level + 100;
}

export function computeLevelFromTotalXp(totalXp) {
  let level = 0;
  let remaining = Math.max(0, Number(totalXp) || 0);
  while (remaining >= xpForNextLevel(level)) {
    remaining -= xpForNextLevel(level);
    level += 1;
  }
  return { level, currentLevelXp: remaining, neededForNext: xpForNextLevel(level) };
}

function getMemberRecord(guildId, userId) {
  const key = `${guildId}:${userId}`;
  if (!xpStore.has(key)) {
    xpStore.set(key, {
      guildId,
      userId,
      xp: 0,
      level: 0,
      card: {
        accentColor: '#5865F2',
        bannerUrl: null,
        style: 'neon',
      },
    });
  }
  return xpStore.get(key);
}

function getGuildRank(guildId, userId) {
  const guildEntries = [...xpStore.values()]
    .filter((entry) => entry.guildId === guildId)
    .sort((a, b) => b.xp - a.xp);
  const index = guildEntries.findIndex((entry) => entry.userId === userId);
  return { rank: index === -1 ? guildEntries.length + 1 : index + 1, totalRanked: guildEntries.length };
}

export async function assignTemporaryRole(guild, member, roleId, durationSeconds) {
  const role = guild.roles.cache.get(roleId);
  if (!role || !member) return { ok: false, message: 'Role or member not found.' };

  await member.roles.add(role, `Temporary role (${durationSeconds}s)`);
  const key = `${guild.id}:${member.id}:${roleId}`;

  if (tempRoleTimers.has(key)) {
    clearTimeout(tempRoleTimers.get(key));
  }

  const timer = setTimeout(async () => {
    const freshMember = await guild.members.fetch(member.id).catch(() => null);
    if (freshMember?.roles?.cache?.has(roleId)) {
      await freshMember.roles.remove(roleId, 'Temporary role expired').catch(() => {});
    }
    tempRoleTimers.delete(key);
  }, durationSeconds * 1000);

  timer.unref();
  tempRoleTimers.set(key, timer);
  return { ok: true, message: `Assigned ${role} for **${durationSeconds}s**.` };
}

export async function buildReactionRolePanel(channel, { title, description, roles = [], mode = 'multi', uiType = 'buttons' }) {
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(title || 'Self-Assignable Roles')
    .setDescription(
      description ||
        roles.map((r) => `• <@&${r.roleId}>${r.description ? ` — ${r.description}` : ''}`).join('\n') ||
        'Select your roles below.'
    );

  if (uiType === 'dropdown') {
    const menu = new StringSelectMenuBuilder()
      .setCustomId(`vexora_rr_menu:${mode}`)
      .setPlaceholder('Choose roles...')
      .setMinValues(0)
      .setMaxValues(mode === 'single' ? 1 : Math.min(25, roles.length || 1))
      .addOptions(
        roles.slice(0, 25).map((r) => ({
          label: r.label || r.name || `Role ${r.roleId}`,
          value: r.roleId,
          description: r.description ? r.description.slice(0, 100) : undefined,
        }))
      );

    return channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(menu)] });
  }

  const rows = [];
  for (let i = 0; i < Math.min(25, roles.length); i += 5) {
    const row = new ActionRowBuilder();
    for (const item of roles.slice(i, i + 5)) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`vexora_rr_btn:${mode}:${item.roleId}`)
          .setLabel(item.label || item.name || 'Toggle Role')
          .setStyle(ButtonStyle.Secondary)
      );
    }
    rows.push(row);
  }

  return channel.send({ embeds: [embed], components: rows });
}

export async function getRankPayload({ guild, user }) {
  const record = getMemberRecord(guild.id, user.id);
  const { level, currentLevelXp, neededForNext } = computeLevelFromTotalXp(record.xp);
  const { rank } = getGuildRank(guild.id, user.id);

  const progressRatio = Math.min(1, Math.max(0, currentLevelXp / neededForNext));
  const filledBlocks = Math.round(progressRatio * 14);
  const bar = `${'▰'.repeat(filledBlocks)}${'▱'.repeat(14 - filledBlocks)}`;

  const embed = new EmbedBuilder()
    .setColor(record.card?.accentColor || '#5865F2')
    .setAuthor({ name: `${user.tag} — Rank Card`, iconURL: user.displayAvatarURL({ size: 256 }) })
    .setThumbnail(user.displayAvatarURL({ size: 512 }))
    .addFields(
      { name: 'Rank', value: `#${rank}`, inline: true },
      { name: 'Level', value: `${level}`, inline: true },
      { name: 'Total XP', value: `${record.xp.toLocaleString()}`, inline: true },
      { name: `Progress (${currentLevelXp} / ${neededForNext} XP)`, value: `\`${bar}\`` }
    )
    .setFooter({ text: `Card Style: ${(record.card?.style || 'neon').toUpperCase()}` });

  if (record.card?.bannerUrl) {
    embed.setImage(record.card.bannerUrl);
  }

  return { embeds: [embed] };
}

export async function getLeaderboardPayload({ guild, page = 1 }) {
  const perPage = 10;
  const entries = [...xpStore.values()]
    .filter((entry) => entry.guildId === guild.id)
    .sort((a, b) => b.xp - a.xp);

  const totalPages = Math.max(1, Math.ceil(entries.length / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const slice = entries.slice((safePage - 1) * perPage, safePage * perPage);

  const lines =
    slice.length > 0
      ? slice.map((item, idx) => {
          const rankNum = (safePage - 1) * perPage + idx + 1;
          return `**#${rankNum}** <@${item.userId}> — Level **${item.level}** (\`${item.xp.toLocaleString()} XP\`)`;
        })
      : ['No XP activity recorded yet. Start chatting to earn XP!'];

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`${guild.name} — XP Leaderboard`)
    .setDescription(lines.join('\n'))
    .setFooter({ text: `Page ${safePage} of ${totalPages}` });

  return { embeds: [embed] };
}

export async function updateRankCard({ guildId, user, accentColor, bannerUrl, style }) {
  const record = getMemberRecord(guildId, user.id);

  if (accentColor) {
    if (!/^#?[0-9a-fA-F]{6}$/.test(accentColor.trim())) {
      return { content: 'Invalid HEX color. Use format `#RRGGBB` (e.g., `#5865F2`).' };
    }
    record.card.accentColor = `#${accentColor.trim().replace(/^#/, '').toUpperCase()}`;
  }

  if (bannerUrl) {
    if (bannerUrl.toLowerCase() === 'reset') {
      record.card.bannerUrl = null;
    } else if (/^https?:\/\/.+/i.test(bannerUrl.trim())) {
      record.card.bannerUrl = bannerUrl.trim();
    } else {
      return { content: 'Banner URL must start with `http://` or `https://` (or pass `reset`).' };
    }
  }

  if (style) {
    record.card.style = style;
  }

  return {
    content: `Updated your rank card! Accent: \`${record.card.accentColor}\` | Style: **${record.card.style}**`,
  };
}

export async function modifyMemberXp({ mode, guild, targetUser, amount = 0, level = 0 }) {
  const record = getMemberRecord(guild.id, targetUser.id);

  if (mode === 'add') {
    record.xp += amount;
  } else if (mode === 'remove') {
    record.xp = Math.max(0, record.xp - amount);
  } else if (mode === 'setlevel') {
    let total = 0;
    for (let l = 0; l < level; l++) total += xpForNextLevel(l);
    record.xp = total;
  }

  const computed = computeLevelFromTotalXp(record.xp);
  record.level = computed.level;

  return {
    content: `Updated **${targetUser.tag}** — Level **${record.level}** (\`${record.xp.toLocaleString()} XP\`).`,
  };
}

export async function resetXp({ guild, scope, targetUser }) {
  if (scope === 'member' && targetUser) {
    xpStore.delete(`${guild.id}:${targetUser.id}`);
    return { content: `Reset XP and level progress for **${targetUser.tag}**.` };
  }

  for (const [key, val] of xpStore.entries()) {
    if (val.guildId === guild.id) xpStore.delete(key);
  }
  return { content: `Reset XP and level progress for all members in **${guild.name}**.` };
}

export default {
  name: 'roles_engagement',
  async init(client) {
    // 1. Message XP awarding
    client.on('messageCreate', async (message) => {
      if (message.author.bot || !message.guild) return;
      const cfg = getEngagementConfig(message.guild.id).leveling;
      if (!cfg.enabled) return;

      const cdKey = `${message.guild.id}:${message.author.id}`;
      const now = Date.now();
      const lastAward = xpCooldowns.get(cdKey) || 0;
      if (now - lastAward < (cfg.xpCooldownSeconds || 45) * 1000) return;

      xpCooldowns.set(cdKey, now);
      const gain = Math.floor(Math.random() * (cfg.xpMax - cfg.xpMin + 1)) + cfg.xpMin;
      const record = getMemberRecord(message.guild.id, message.author.id);
      const prevLevel = record.level;
      record.xp += gain;
      const { level } = computeLevelFromTotalXp(record.xp);
      record.level = level;

      if (level > prevLevel) {
        const rewardRoleId = cfg.roleRewards?.[level];
        if (rewardRoleId && message.member?.roles?.add) {
          await message.member.roles.add(rewardRoleId, `Level ${level} reward`).catch(() => {});
        }

        const { rank } = getGuildRank(message.guild.id, message.author.id);
        const alertText = parseVariables(cfg.levelUpTemplate, {
          user: message.author,
          member: message.member,
          guild: message.guild,
          channel: message.channel,
          client,
          custom: { level, xp: record.xp, rank },
        });

        const targetCh = cfg.levelUpChannelId
          ? message.guild.channels.cache.get(cfg.levelUpChannelId)
          : message.channel;
        await targetCh?.send?.(alertText).catch(() => {});
      }
    });

    // 2. Auto Roles & Persistent Roles on Member Join / Leave
    client.on('guildMemberAdd', async (member) => {
      if (member.user.bot) return;
      const cfg = getEngagementConfig(member.guild.id).roles;

      // Restore persistent roles
      const pKey = `${member.guild.id}:${member.id}`;
      if (cfg.persistentRolesEnabled && persistentRoleCache.has(pKey)) {
        const savedRoleIds = persistentRoleCache.get(pKey).filter((id) => member.guild.roles.cache.has(id));
        if (savedRoleIds.length > 0) {
          await member.roles.add(savedRoleIds, 'Vexora Persistent Roles restore').catch(() => {});
        }
      }

      // Apply Auto Roles (immediate or delayed)
      for (const entry of cfg.autoRoles || []) {
        if (!entry?.roleId) continue;
        const applyRole = async () => {
          const fresh = await member.guild.members.fetch(member.id).catch(() => null);
          if (fresh && member.guild.roles.cache.has(entry.roleId)) {
            await fresh.roles.add(entry.roleId, 'Vexora Auto Role').catch(() => {});
          }
        };

        if (entry.delaySeconds > 0) {
          setTimeout(applyRole, entry.delaySeconds * 1000).unref();
        } else {
          await applyRole();
        }
      }
    });

    client.on('guildMemberRemove', (member) => {
      if (member.user?.bot) return;
      const roleIds = member.roles.cache
        .filter((r) => r.id !== member.guild.id && !r.managed)
        .map((r) => r.id);
      if (roleIds.length > 0) {
        persistentRoleCache.set(`${member.guild.id}:${member.id}`, roleIds);
      }
    });

    // 3. Reaction Role Buttons & Dropdowns
    client.on('interactionCreate', async (interaction) => {
      if (interaction.isButton() && interaction.customId.startsWith('vexora_rr_btn:')) {
        const [, mode, roleId] = interaction.customId.split(':');
        const role = interaction.guild.roles.cache.get(roleId);
        if (!role) return interaction.reply({ content: 'Role no longer exists.', ephemeral: true });

        const hasRole = interaction.member.roles.cache.has(roleId);
        if (hasRole) {
          await interaction.member.roles.remove(roleId, 'Reaction role toggle').catch(() => {});
          return interaction.reply({ content: `Removed ${role}.`, ephemeral: true });
        }

        if (mode === 'single') {
          // Remove sibling button roles from the same message
          const siblingIds = interaction.message.components
            .flatMap((row) => row.components)
            .map((c) => c.customId?.split(':')[2])
            .filter((id) => id && id !== roleId && interaction.member.roles.cache.has(id));
          if (siblingIds.length > 0) {
            await interaction.member.roles.remove(siblingIds, 'Single-select reaction role swap').catch(() => {});
          }
        }

        await interaction.member.roles.add(roleId, 'Reaction role toggle').catch(() => {});
        return interaction.reply({ content: `Assigned ${role}.`, ephemeral: true });
      }

      if (interaction.isStringSelectMenu() && interaction.customId.startsWith('vexora_rr_menu:')) {
        const allOptionRoleIds = interaction.component.options.map((o) => o.value);
        const selectedRoleIds = interaction.values;

        const toRemove = allOptionRoleIds.filter(
          (id) => !selectedRoleIds.includes(id) && interaction.member.roles.cache.has(id)
        );
        const toAdd = selectedRoleIds.filter((id) => !interaction.member.roles.cache.has(id));

        if (toRemove.length > 0) await interaction.member.roles.remove(toRemove).catch(() => {});
        if (toAdd.length > 0) await interaction.member.roles.add(toAdd).catch(() => {});

        return interaction.reply({ content: 'Updated your selected roles!', ephemeral: true });
      }
    });

    // 4. Join-to-Create Temporary Voice Channels
    client.on('voiceStateUpdate', async (oldState, newState) => {
      try {
        const guild = newState.guild || oldState.guild;
        const cfg = getEngagementConfig(guild.id).tempVoice;

        // Joined generator channel
        if (cfg.enabled && newState.channelId && newState.channelId === cfg.generatorChannelId && newState.member) {
          const roomName = parseVariables(cfg.nameTemplate || "{user.username}'s Room", {
            user: newState.member.user,
            member: newState.member,
            guild,
            client,
          }).slice(0, 90);

          const created = await guild.channels.create({
            name: roomName,
            type: ChannelType.GuildVoice,
            parent: cfg.categoryId || newState.channel?.parentId || undefined,
            permissionOverwrites: [
              {
                id: newState.member.id,
                allow: [PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.MoveMembers],
              },
            ],
          });

          tempVoiceChannels.add(created.id);
          await newState.setChannel(created).catch(() => {});
        }

        // Cleanup empty temporary voice channel
        if (oldState.channelId && tempVoiceChannels.has(oldState.channelId)) {
          const oldCh = guild.channels.cache.get(oldState.channelId);
          if (oldCh && oldCh.members.size === 0) {
            tempVoiceChannels.delete(oldCh.id);
            await oldCh.delete('Temporary voice channel empty').catch(() => {});
          }
        }
      } catch (err) {
        await logError(client, 'TempVoice:voiceStateUpdate', err, newState.guild?.id);
      }
    });

    // 5. Starboard Reaction Handler
    client.on('messageReactionAdd', async (reaction, user) => {
      if (user.bot) return;
      if (reaction.partial) await reaction.fetch().catch(() => null);
      const message = reaction.message;
      if (!message?.guild) return;

      const cfg = getEngagementConfig(message.guild.id).starboard;
      if (!cfg.enabled || !cfg.channelId) return;

      const emojiMatch = reaction.emoji.name === cfg.emoji || reaction.emoji.id === cfg.emoji;
      if (!emojiMatch || (reaction.count || 0) < (cfg.threshold || 3)) return;

      const sbChannel = message.guild.channels.cache.get(cfg.channelId);
      if (!sbChannel?.isTextBased?.()) return;

      const sbKey = `${message.guild.id}:${message.id}`;
      const embed = new EmbedBuilder()
        .setColor(0xfee75c)
        .setAuthor({
          name: message.author?.tag || 'Member',
          iconURL: message.author?.displayAvatarURL?.({ size: 256 }),
        })
        .setDescription(`${message.content || '*[Media / Embed]*'}\n\n[Jump to Message](${message.url})`)
        .setFooter({ text: `${cfg.emoji} ${reaction.count} • #${message.channel.name}` })
        .setTimestamp(message.createdAt);

      const firstImg = message.attachments?.first()?.url;
      if (firstImg) embed.setImage(firstImg);

      const existingPostId = starboardPosted.get(sbKey);
      if (existingPostId) {
        const existingMsg = await sbChannel.messages.fetch(existingPostId).catch(() => null);
        if (existingMsg) {
          await existingMsg.edit({ embeds: [embed] }).catch(() => {});
          return;
        }
      }

      const posted = await sbChannel.send({ embeds: [embed] }).catch(() => null);
      if (posted) starboardPosted.set(sbKey, posted.id);
    });
  },
  getEngagementConfig,
  getRankPayload,
  getLeaderboardPayload,
  updateRankCard,
  modifyMemberXp,
  resetXp,
  assignTemporaryRole,
  buildReactionRolePanel,
};
