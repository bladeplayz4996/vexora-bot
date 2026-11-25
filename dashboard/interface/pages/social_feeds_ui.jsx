import React from 'react';

export default function SocialFeedsUI({
  config = {},
  channels = [],
  roles = [],
  onChangeConfig = () => {},
}) {
  const socialFeeds = config.socialFeeds || { youtube: [], twitch: [] };
  const youtubeFeeds = socialFeeds.youtube || [];
  const twitchFeeds = socialFeeds.twitch || [];

  const updateFeeds = (patch) =>
    onChangeConfig({ ...config, socialFeeds: { ...socialFeeds, ...patch } });

  const addYouTubeFeed = () => {
    updateFeeds({
      youtube: [
        ...youtubeFeeds,
        {
          id: `yt_${Date.now().toString(36)}`,
          creatorName: 'Creator Channel',
          channelId: '',
          discordChannelId: channels[0]?.id || '',
          roleMentionId: null,
        },
      ],
    });
  };

  const updateYouTubeFeed = (idx, patch) => {
    updateFeeds({
      youtube: youtubeFeeds.map((item, i) => (i === idx ? { ...item, ...patch } : item)),
    });
  };

  const removeYouTubeFeed = (idx) => {
    updateFeeds({ youtube: youtubeFeeds.filter((_, i) => i !== idx) });
  };

  const addTwitchFeed = () => {
    updateFeeds({
      twitch: [
        ...twitchFeeds,
        {
          id: `tw_${Date.now().toString(36)}`,
          creatorName: 'Streamer',
          username: '',
          discordChannelId: channels[0]?.id || '',
          roleMentionId: null,
        },
      ],
    });
  };

  const updateTwitchFeed = (idx, patch) => {
    updateFeeds({
      twitch: twitchFeeds.map((item, i) => (i === idx ? { ...item, ...patch } : item)),
    });
  };

  const removeTwitchFeed = (idx) => {
    updateFeeds({ twitch: twitchFeeds.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">YouTube & Twitch Live Feeds</h2>
        <p className="text-xs text-slate-400">
          Post automated upload and stream alerts into Discord channels with optional role pings.
        </p>
      </div>

      {/* YouTube */}
      <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white">YouTube Channels</span>
          <button
            type="button"
            onClick={addYouTubeFeed}
            className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-500"
          >
            + Add YouTube Feed
          </button>
        </div>

        {youtubeFeeds.map((yt, idx) => (
          <div
            key={yt.id || idx}
            className="grid grid-cols-1 gap-3 rounded-lg border border-slate-800 bg-slate-950 p-3 sm:grid-cols-4"
          >
            <input
              type="text"
              value={yt.creatorName}
              onChange={(e) => updateYouTubeFeed(idx, { creatorName: e.target.value })}
              placeholder="Creator display name"
              className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white"
            />
            <input
              type="text"
              value={yt.channelId}
              onChange={(e) => updateYouTubeFeed(idx, { channelId: e.target.value })}
              placeholder="YouTube Channel ID (UC...)"
              className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white"
            />
            <select
              value={yt.discordChannelId || ''}
              onChange={(e) => updateYouTubeFeed(idx, { discordChannelId: e.target.value })}
              className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white"
            >
              <option value="">Target Discord channel...</option>
              {channels.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  #{ch.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <select
                value={yt.roleMentionId || ''}
                onChange={(e) =>
                  updateYouTubeFeed(idx, { roleMentionId: e.target.value || null })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white"
              >
                <option value="">No ping role</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    @{r.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => removeYouTubeFeed(idx)}
                className="rounded-lg bg-rose-500/15 px-2.5 text-xs text-rose-400 hover:bg-rose-500/25"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Twitch */}
      <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white">Twitch Streamers</span>
          <button
            type="button"
            onClick={addTwitchFeed}
            className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-500"
          >
            + Add Twitch Feed
          </button>
        </div>

        {twitchFeeds.map((tw, idx) => (
          <div
            key={tw.id || idx}
            className="grid grid-cols-1 gap-3 rounded-lg border border-slate-800 bg-slate-950 p-3 sm:grid-cols-4"
          >
            <input
              type="text"
              value={tw.creatorName}
              onChange={(e) => updateTwitchFeed(idx, { creatorName: e.target.value })}
              placeholder="Creator display name"
              className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white"
            />
            <input
              type="text"
              value={tw.username}
              onChange={(e) => updateTwitchFeed(idx, { username: e.target.value })}
              placeholder="Twitch login username"
              className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white"
            />
            <select
              value={tw.discordChannelId || ''}
              onChange={(e) => updateTwitchFeed(idx, { discordChannelId: e.target.value })}
              className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white"
            >
              <option value="">Target Discord channel...</option>
              {channels.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  #{ch.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => removeTwitchFeed(idx)}
              className="rounded-lg bg-rose-500/15 px-2.5 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/25"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
