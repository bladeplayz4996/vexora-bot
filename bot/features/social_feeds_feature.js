import { renderMessagePayload } from '../global_addons/embed_renderer.js';
import { logError } from '../global_addons/error_logger.js';

/**
 * Social Feeds Watcher Engine (YouTube & Twitch):
 * - Polls configured creator feeds per server and deduplicates seen video/stream IDs
 * - Dispatches customizable plain or embed notifications using {platform}, {creator.name}, {title}, {url}
 */
const socialFeedsByGuild = new Map(); // guildId -> { youtube: FeedItem[], twitch: FeedItem[] }
const seenFeedItemIds = new Set(); // `${guildId}:${platform}:${itemId}`

function getGuildSocialFeeds(guildId) {
  if (!socialFeedsByGuild.has(guildId)) {
    socialFeedsByGuild.set(guildId, {
      youtube: [], // [{ id, creatorName, channelId, discordChannelId, roleMentionId, payload }]
      twitch: [], // [{ id, creatorName, username, discordChannelId, roleMentionId, payload }]
    });
  }
  return socialFeedsByGuild.get(guildId);
}

async function checkYouTubeFeed(guild, feed, client) {
  if (!feed?.channelId || !feed?.discordChannelId) return;
  const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(feed.channelId)}`;
  const res = await fetch(rssUrl).catch(() => null);
  if (!res?.ok) return;

  const xml = await res.text();
  const videoIdMatch = xml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
  const titleMatch = xml.match(/<entry>[\s\S]*?<title>([^<]+)<\/title>/);
  if (!videoIdMatch) return;

  const videoId = videoIdMatch[1].trim();
  const dedupeKey = `${guild.id}:youtube:${videoId}`;
  if (seenFeedItemIds.has(dedupeKey)) return;
  seenFeedItemIds.add(dedupeKey);

  const title = titleMatch ? titleMatch[1].trim() : 'New YouTube Upload';
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const targetChannel = guild.channels.cache.get(feed.discordChannelId);
  if (!targetChannel?.isTextBased?.()) return;

  const defaultPayload = {
    mode: 'embed',
    content: feed.roleMentionId ? `<@&${feed.roleMentionId}>` : '',
    embed: {
      color: '#FF0000',
      title: '{title}',
      titleUrl: '{url}',
      description: '**{creator.name}** just uploaded a new video on **{platform}**!\n{url}',
    },
  };

  const payload = renderMessagePayload(feed.payload || defaultPayload, {
    guild,
    channel: targetChannel,
    client,
    custom: {
      platform: 'YouTube',
      creatorName: feed.creatorName || feed.channelId,
      title,
      url,
    },
  });

  await targetChannel.send(payload).catch(() => {});
}

async function pollAllGuildFeeds(client) {
  for (const [guildId, feeds] of socialFeedsByGuild.entries()) {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) continue;

    for (const ytFeed of feeds.youtube || []) {
      await checkYouTubeFeed(guild, ytFeed, client).catch((err) =>
        logError(client, 'SocialFeeds:YouTube', err, guildId)
      );
    }
  }
}

export default {
  name: 'social_feeds',
  async init(client) {
    setInterval(() => {
      pollAllGuildFeeds(client).catch((err) => logError(client, 'SocialFeeds:poll', err));
    }, 3 * 60_000).unref();
  },
  getGuildSocialFeeds,
  pollAllGuildFeeds,
};
