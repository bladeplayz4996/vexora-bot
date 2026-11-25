import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  PermissionsBitField,
} from 'discord.js';
import { renderMessagePayload } from '../global_addons/embed_renderer.js';
import { parseVariables } from '../global_addons/variable_parser.js';
import { logError } from '../global_addons/error_logger.js';

/**
 * Messaging, Announcements, Auto-Responders, Auto-Threads, Sticky Messages,
 * Ticketing, Giveaways & Tags Feature Engine.
 */
const guildMessagingConfigs = new Map(); // guildId -> config object
const stickyTracker = new Map(); // channelId -> { lastMessageId: string, countSincePost: number }
const ticketCounters = new Map(); // guildId -> number

function getGuildMessaging(guildId) {
  if (!guildMessagingConfigs.has(guildId)) {
    guildMessagingConfigs.set(guildId, {
      announcements: {
        join: { enabled: false, channelId: null, dmEnabled: false, payload: null, dmPayload: null },
        leave: { enabled: false, channelId: null, payload: null },
        ban: { enabled: false, channelId: null, payload: null },
        boost: { enabled: false, channelId: null, payload: null },
      },
      autoResponders: [], // [{ id, trigger, matchMode: 'contains'|'exact'|'startswith', responsePayload }]
      autoThreads: [], // [{ channelId, nameTemplate: '{user.username} — Thread', autoArchiveDuration: 1440 }]
      stickyMessages: {}, // channelId -> { enabled, interval: 4, payload }
      ticketing: {
        enabled: false,
        categoryId: null,
        supportRoleIds: [],
        transcriptChannelId: null,
        welcomePayload: {
          mode: 'embed',
          embed: {
            color: '#5865F2',
            title: 'Support Ticket #{ticket.number}',
            description: 'Hello {ticket.opener}, our support team will be with you shortly. Click **Close Ticket** when resolved.',
          },
        },
      },
      tags: {}, // tagName -> payload
    });
  }
  return guildMessagingConfigs.get(guildId);
}

export async function dispatchAnnouncement(guild, type, memberOrUser, client) {
  const cfg = getGuildMessaging(guild.id).announcements?.[type];
  if (!cfg?.enabled) return;

  const user = memberOrUser.user || memberOrUser;
  const member = memberOrUser.user ? memberOrUser : null;
  const ctx = { guild, user, member, client };

  if (cfg.channelId && cfg.payload) {
    const channel = guild.channels.cache.get(cfg.channelId);
    if (channel?.isTextBased?.()) {
      const rendered = renderMessagePayload(cfg.payload, ctx);
      await channel.send(rendered).catch(() => {});
    }
  }

  if (type === 'join' && cfg.dmEnabled && cfg.dmPayload && user?.send) {
    const dmRendered = renderMessagePayload(cfg.dmPayload, ctx);
    await user.send(dmRendered).catch(() => {});
  }
}

export async function sendTicketPanel(channel, panelConfig = {}) {
  const embed = new EmbedBuilder()
    .setColor(panelConfig.color || 0x5865f2)
    .setTitle(panelConfig.title || 'Support & Assistance')
    .setDescription(
      panelConfig.description || 'Need help from staff? Click **Open Ticket** below to start a private support thread.'
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('vexora_ticket:open')
      .setLabel(panelConfig.buttonLabel || 'Open Ticket')
      .setStyle(ButtonStyle.Primary)
  );

  return channel.send({ embeds: [embed], components: [row] });
}

export async function startGiveaway(channel, { prize, durationSeconds, winners = 1, hostUser }) {
  const endsAtUnix = Math.floor((Date.now() + durationSeconds * 1000) / 1000);
  const entrants = new Set();

  const buildEmbed = () =>
    new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle(`🎉 GIVEAWAY: ${prize}`)
      .setDescription(
        `Click **Enter Giveaway** below to join!\n• **Winners:** ${winners}\n• **Ends:** <t:${endsAtUnix}:R> (<t:${endsAtUnix}:f>)\n• **Entries:** ${entrants.size}\n• **Hosted by:** <@${hostUser.id}>`
      );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('vexora_giveaway:enter')
      .setLabel('Enter Giveaway')
      .setStyle(ButtonStyle.Success)
  );

  const msg = await channel.send({ embeds: [buildEmbed()], components: [row] });

  const collector = msg.createMessageComponentCollector({ time: durationSeconds * 1000 });
  collector.on('collect', async (btn) => {
    if (btn.customId !== 'vexora_giveaway:enter') return;
    if (entrants.has(btn.user.id)) {
      return btn.reply({ content: 'You have already entered this giveaway!', ephemeral: true });
    }
    entrants.add(btn.user.id);
    await btn.update({ embeds: [buildEmbed()] });
  });

  collector.on('end', async () => {
    const disabledRow = ActionRowBuilder.from(row);
    disabledRow.components.forEach((b) => b.setDisabled(true));

    const pool = [...entrants];
    const picked = [];
    while (pool.length > 0 && picked.length < winners) {
      const idx = Math.floor(Math.random() * pool.length);
      picked.push(`<@${pool.splice(idx, 1)[0]}>`);
    }

    const endEmbed = EmbedBuilder.from(buildEmbed())
      .setColor(0x5865f2)
      .setDescription(
        `Giveaway ended!\n• **Prize:** ${prize}\n• **Winner(s):** ${picked.length > 0 ? picked.join(', ') : 'No valid entries'}`
      );

    await msg.edit({ embeds: [endEmbed], components: [disabledRow] }).catch(() => {});
    if (picked.length > 0) {
      await channel.send(`🎊 Congratulations ${picked.join(', ')}! You won **${prize}**!`).catch(() => {});
    }
  });

  return msg;
}

export default {
  name: 'messaging_events',
  async init(client) {
    client.on('guildMemberAdd', (member) => {
      dispatchAnnouncement(member.guild, 'join', member, client).catch((e) =>
        logError(client, 'Messaging:join', e, member.guild.id)
      );
    });

    client.on('guildMemberRemove', (member) => {
      dispatchAnnouncement(member.guild, 'leave', member, client).catch((e) =>
        logError(client, 'Messaging:leave', e, member.guild.id)
      );
    });

    client.on('guildBanAdd', (ban) => {
      dispatchAnnouncement(ban.guild, 'ban', ban.user, client).catch((e) =>
        logError(client, 'Messaging:ban', e, ban.guild.id)
      );
    });

    client.on('guildMemberUpdate', (oldMember, newMember) => {
      if (!oldMember.premiumSince && newMember.premiumSince) {
        dispatchAnnouncement(newMember.guild, 'boost', newMember, client).catch((e) =>
          logError(client, 'Messaging:boost', e, newMember.guild.id)
        );
      }
    });

    // Auto-responders, Auto-threads, Sticky Messages
    client.on('messageCreate', async (message) => {
      if (message.author.bot || !message.guild) return;

      try {
        const cfg = getGuildMessaging(message.guild.id);
        const contentLower = (message.content || '').trim().toLowerCase();

        // 1. Auto Responders
        for (const rule of cfg.autoResponders) {
          const trig = (rule.trigger || '').toLowerCase();
          if (!trig) continue;
          const matched =
            rule.matchMode === 'exact'
              ? contentLower === trig
              : rule.matchMode === 'startswith'
                ? contentLower.startsWith(trig)
                : contentLower.includes(trig);

          if (matched && rule.responsePayload) {
            const payload = renderMessagePayload(rule.responsePayload, {
              user: message.author,
              member: message.member,
              guild: message.guild,
              channel: message.channel,
              client,
              custom: {
                trigger: rule.trigger,
                keyword: rule.trigger,
              },
            });
            await message.reply(payload).catch(() => {});
            break;
          }
        }

        // 2. Auto Threads
        const threadRule = cfg.autoThreads.find((t) => t.channelId === message.channel.id);
        if (threadRule && message.startThread) {
          const threadName = parseVariables(threadRule.nameTemplate || '{user.username} — Discussion', {
            user: message.author,
            member: message.member,
            guild: message.guild,
            channel: message.channel,
            client,
          }).slice(0, 100);

          await message
            .startThread({
              name: threadName,
              autoArchiveDuration: threadRule.autoArchiveDuration || 1440,
            })
            .catch(() => {});
        }

        // 3. Sticky Messages
        const sticky = cfg.stickyMessages?.[message.channel.id];
        if (sticky?.enabled && sticky.payload) {
          const tracker = stickyTracker.get(message.channel.id) || { lastMessageId: null, countSincePost: 0 };
          tracker.countSincePost += 1;

          if (tracker.countSincePost >= (sticky.interval || 4)) {
            if (tracker.lastMessageId) {
              const oldSticky = await message.channel.messages.fetch(tracker.lastMessageId).catch(() => null);
              if (oldSticky) await oldSticky.delete().catch(() => {});
            }
            const rendered = renderMessagePayload(sticky.payload, {
              guild: message.guild,
              channel: message.channel,
              client,
            });
            const posted = await message.channel.send(rendered).catch(() => null);
            stickyTracker.set(message.channel.id, {
              lastMessageId: posted?.id || null,
              countSincePost: 0,
            });
          } else {
            stickyTracker.set(message.channel.id, tracker);
          }
        }
      } catch (err) {
        await logError(client, 'Messaging:messageCreate', err, message.guild?.id);
      }
    });

    // Ticketing Open / Close Button Handler
    client.on('interactionCreate', async (interaction) => {
      if (!interaction.isButton()) return;
      if (!interaction.customId.startsWith('vexora_ticket:')) return;

      const action = interaction.customId.split(':')[1];
      const cfg = getGuildMessaging(interaction.guildId).ticketing;

      if (action === 'open') {
        const nextNum = (ticketCounters.get(interaction.guildId) || 0) + 1;
        ticketCounters.set(interaction.guildId, nextNum);
        const ticketNumber = String(nextNum).padStart(4, '0');

        const overwrites = [
          { id: interaction.guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
          {
            id: interaction.user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory,
            ],
          },
          ...(cfg.supportRoleIds || []).map((roleId) => ({
            id: roleId,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory,
            ],
          })),
        ];

        const ticketChannel = await interaction.guild.channels.create({
          name: `ticket-${ticketNumber}`,
          type: ChannelType.GuildText,
          parent: cfg.categoryId || undefined,
          permissionOverwrites: overwrites,
        });

        const welcome = renderMessagePayload(cfg.welcomePayload, {
          user: interaction.user,
          member: interaction.member,
          guild: interaction.guild,
          channel: ticketChannel,
          client,
          custom: {
            ticketId: ticketChannel.id,
            ticketNumber,
            ticketOpener: `<@${interaction.user.id}>`,
          },
        });

        const closeRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('vexora_ticket:close')
            .setLabel('Close Ticket')
            .setStyle(ButtonStyle.Danger)
        );

        await ticketChannel.send({ ...welcome, components: [closeRow] });
        return interaction.reply({
          content: `🎫 Ticket created: ${ticketChannel}`,
          ephemeral: true,
        });
      }

      if (action === 'close') {
        await interaction.reply({ content: 'Closing ticket in 5 seconds...' });
        setTimeout(() => {
          interaction.channel.delete('Vexora Ticket closed').catch(() => {});
        }, 5000).unref();
      }
    });
  },
  getGuildMessaging,
  sendTicketPanel,
  startGiveaway,
};
