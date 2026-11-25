/**
 * Resolves all Vexora global variables across plain messages, embeds, logs, and templates.
 * Supports dot-notation variables such as {user.mention}, {server.memberCount}, {case.id}, etc.
 */
export function buildVariableMap(ctx = {}) {
  const {
    user,
    member,
    guild,
    channel,
    voiceChannel,
    role,
    client,
    custom = {},
  } = ctx;

  const targetUser = user || member?.user || null;
  const memberCount = guild?.memberCount ?? '';

  const baseMap = {
    // 1. User & Member Variables
    'user.mention': targetUser ? `<@${targetUser.id}>` : '',
    'user.username': targetUser?.username ?? '',
    'user.tag': targetUser?.tag ?? targetUser?.username ?? '',
    'user.id': targetUser?.id ?? '',
    'user.avatar': targetUser?.displayAvatarURL?.({ size: 512, extension: 'png' }) ?? '',
    'user.nick': member?.nickname ?? targetUser?.globalName ?? targetUser?.username ?? '',
    'user1': custom.user1 ?? '',
    'user2': custom.user2 ?? '',
    'percent': custom.percent ?? '',

    // 2. Server & Channel Variables
    'server.name': guild?.name ?? '',
    'server.id': guild?.id ?? '',
    'server.memberCount': String(memberCount),
    'member.count': String(memberCount),
    'server.onlineCount': custom.onlineCount ?? '',
    'server.boosts': String(guild?.premiumSubscriptionCount ?? 0),
    'channel.mention': channel ? `<#${channel.id}>` : '',
    'channel.name': channel?.name ?? '',
    'vc.name': voiceChannel?.name ?? custom.vcName ?? '',

    // 3. Role & Faction Variables
    'role.name': role?.name ?? custom.roleName ?? '',
    'role.mention': role ? `<@&${role.id}>` : custom.roleMention ?? '',
    'role.duration': custom.roleDuration ?? '',
    'faction.name': custom.factionName ?? '',
    'color.role': custom.colorRole ?? '',

    // 4. Bot, Command & Message Variables
    'bot.name': client?.user?.username ?? 'Vexora',
    'bot.ping': client?.ws?.ping != null ? `${Math.round(client.ws.ping)}ms` : '0ms',
    'prefix': custom.prefix ?? process.env.DEFAULT_PREFIX ?? '!',
    'command.name': custom.commandName ?? '',
    'args': custom.args ?? '',
    'trigger': custom.trigger ?? '',
    'keyword': custom.keyword ?? '',
    'response': custom.response ?? '',
    'tag.name': custom.tagName ?? '',
    'thread.name': custom.threadName ?? '',
    'embed.title': custom.embedTitle ?? '',
    'message.content': custom.messageContent ?? '',
    'before.content': custom.beforeContent ?? '',
    'after.content': custom.afterContent ?? '',
    'author.tag': custom.authorTag ?? '',
    'message.link': custom.messageLink ?? '',
    'count': custom.count ?? '',

    // 5. Moderation & Security Variables
    'case.id': custom.caseId ?? '',
    'moderator.mention': custom.moderatorMention ?? '',
    'moderator.tag': custom.moderatorTag ?? '',
    'target.mention': custom.targetMention ?? '',
    'reason': custom.reason ?? 'No reason provided',
    'duration': custom.duration ?? '',
    'warns.count': custom.warnsCount ?? '',
    'violation.type': custom.violationType ?? '',
    'honeypot.channel': custom.honeypotChannel ?? '',
    'slowmode.delay': custom.slowmodeDelay ?? '',

    // 6. Economy & Leveling Variables
    'wallet': custom.wallet ?? '0',
    'bank': custom.bank ?? '0',
    'currency': custom.currency ?? 'Coins',
    'amount': custom.amount ?? '0',
    'fine': custom.fine ?? '0',
    'cooldown': custom.cooldown ?? '',
    'level': custom.level ?? '1',
    'xp': custom.xp ?? '0',
    'rank': custom.rank ?? '0',
    'points': custom.points ?? '0',
    'stars': custom.stars ?? '0',
    'item.name': custom.itemName ?? '',
    'item.price': custom.itemPrice ?? '0',
    'stock': custom.stock ?? 'Unlimited',

    // 7. Events, Tickets, Giveaways & Forms Variables
    'ticket.id': custom.ticketId ?? '',
    'ticket.number': custom.ticketNumber ?? '',
    'ticket.opener': custom.ticketOpener ?? '',
    'prize': custom.prize ?? '',
    'winners': custom.winners ?? '',
    'ends_at': custom.endsAt ?? '',
    'form.answer': custom.formAnswer ?? '',
    'event.title': custom.eventTitle ?? '',
    'event.time': custom.eventTime ?? '',
    'birthday.user': custom.birthdayUser ?? '',
    'game.winner': custom.gameWinner ?? '',
    'stat.value': custom.statValue ?? '',

    // 8. Social Feeds Variables
    'platform': custom.platform ?? '',
    'creator.name': custom.creatorName ?? '',
    'title': custom.title ?? '',
    'url': custom.url ?? '',
    'artist.name': custom.artistName ?? '',
  };

  // Allow direct overrides using exact key names (e.g., { 'user.mention': '...' })
  for (const [key, val] of Object.entries(custom)) {
    if (key.includes('.') || key in baseMap) {
      baseMap[key] = val != null ? String(val) : '';
    }
  }

  return baseMap;
}

export function parseVariables(template, ctx = {}) {
  if (!template || typeof template !== 'string') return template ?? '';
  const map = buildVariableMap(ctx);

  return template.replace(/\{([a-zA-Z0-9_.]+)\}/g, (match, token) => {
    return Object.prototype.hasOwnProperty.call(map, token) ? map[token] : match;
  });
}
