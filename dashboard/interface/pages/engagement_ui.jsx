import React from 'react';

export default function EngagementUI({
  activeSubPage = 'leveling',
  config = {},
  channels = [],
  roles = [],
  onChangeConfig = () => {},
}) {
  const engagement = config.engagement || {};
  const leveling = engagement.leveling || {
    enabled: true,
    xpMin: 15,
    xpMax: 25,
    xpCooldownSeconds: 45,
    levelUpChannelId: null,
    levelUpTemplate: '🎉 {user.mention} reached **Level {level}** with **{xp} XP**!',
    roleRewards: {},
  };
  const tempVoice = engagement.tempVoice || {
    enabled: false,
    generatorChannelId: null,
    categoryId: null,
    nameTemplate: "{user.username}'s Room",
  };
  const starboard = engagement.starboard || {
    enabled: false,
    emoji: '⭐',
    threshold: 3,
    channelId: null,
  };
  const birthdays = engagement.birthdays || {
    enabled: false,
    channelId: null,
    roleId: null,
    wishTemplate: '🎂 Happy Birthday {birthday.user}!',
  };

  const updateEngagement = (patch) =>
    onChangeConfig({ ...config, engagement: { ...engagement, ...patch } });

  if (activeSubPage === 'temp_voice') {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Temporary Voice Channels</h2>
            <p className="text-xs text-slate-400">
              Join-to-create voice rooms that auto-clean when empty.
            </p>
          </div>
          <label className="flex items-center gap-2 text-xs font-medium text-slate-200">
            <input
              type="checkbox"
              checked={Boolean(tempVoice.enabled)}
              onChange={(e) =>
                updateEngagement({ tempVoice: { ...tempVoice, enabled: e.target.checked } })
              }
            />
            Enable Join-to-Create
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">
              Generator Voice Channel
            </label>
            <select
              value={tempVoice.generatorChannelId || ''}
              onChange={(e) =>
                updateEngagement({
                  tempVoice: { ...tempVoice, generatorChannelId: e.target.value || null },
                })
              }
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
            >
              <option value="">Select voice channel...</option>
              {channels.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {ch.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">
              Room Name Template
            </label>
            <input
              type="text"
              value={tempVoice.nameTemplate}
              onChange={(e) =>
                updateEngagement({ tempVoice: { ...tempVoice, nameTemplate: e.target.value } })
              }
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
            />
          </div>
        </div>
      </div>
    );
  }

  if (activeSubPage === 'starboard_birthdays') {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-white">Starboard & Birthdays</h2>
          <p className="text-xs text-slate-400">
            Highlight popular messages on the starboard and celebrate member birthdays.
          </p>
        </div>

        <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white">Starboard</span>
            <label className="flex items-center gap-2 text-xs text-slate-200">
              <input
                type="checkbox"
                checked={Boolean(starboard.enabled)}
                onChange={(e) =>
                  updateEngagement({ starboard: { ...starboard, enabled: e.target.checked } })
                }
              />
              Enabled
            </label>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input
              type="text"
              value={starboard.emoji}
              onChange={(e) =>
                updateEngagement({ starboard: { ...starboard, emoji: e.target.value } })
              }
              placeholder="Emoji (e.g. ⭐)"
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
            />
            <input
              type="number"
              min={1}
              value={starboard.threshold}
              onChange={(e) =>
                updateEngagement({
                  starboard: { ...starboard, threshold: Number(e.target.value) },
                })
              }
              placeholder="Reaction threshold"
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
            />
            <select
              value={starboard.channelId || ''}
              onChange={(e) =>
                updateEngagement({
                  starboard: { ...starboard, channelId: e.target.value || null },
                })
              }
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
            >
              <option value="">Select starboard channel...</option>
              {channels.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  #{ch.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white">Birthdays</span>
            <label className="flex items-center gap-2 text-xs text-slate-200">
              <input
                type="checkbox"
                checked={Boolean(birthdays.enabled)}
                onChange={(e) =>
                  updateEngagement({ birthdays: { ...birthdays, enabled: e.target.checked } })
                }
              />
              Enabled
            </label>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <select
              value={birthdays.channelId || ''}
              onChange={(e) =>
                updateEngagement({
                  birthdays: { ...birthdays, channelId: e.target.value || null },
                })
              }
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
            >
              <option value="">Announcement channel...</option>
              {channels.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  #{ch.name}
                </option>
              ))}
            </select>
            <select
              value={birthdays.roleId || ''}
              onChange={(e) =>
                updateEngagement({
                  birthdays: { ...birthdays, roleId: e.target.value || null },
                })
              }
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
            >
              <option value="">Birthday role (optional)...</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">XP & Leveling</h2>
          <p className="text-xs text-slate-400">
            Configure message XP gain, cooldowns, and level-up notification templates.
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs font-medium text-slate-200">
          <input
            type="checkbox"
            checked={leveling.enabled !== false}
            onChange={(e) =>
              updateEngagement({ leveling: { ...leveling, enabled: e.target.checked } })
            }
          />
          Enable Leveling
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4 sm:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-300">Min XP</label>
          <input
            type="number"
            min={1}
            value={leveling.xpMin ?? 15}
            onChange={(e) =>
              updateEngagement({ leveling: { ...leveling, xpMin: Number(e.target.value) } })
            }
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-300">Max XP</label>
          <input
            type="number"
            min={1}
            value={leveling.xpMax ?? 25}
            onChange={(e) =>
              updateEngagement({ leveling: { ...leveling, xpMax: Number(e.target.value) } })
            }
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-300">Cooldown (s)</label>
          <input
            type="number"
            min={5}
            value={leveling.xpCooldownSeconds ?? 45}
            onChange={(e) =>
              updateEngagement({
                leveling: { ...leveling, xpCooldownSeconds: Number(e.target.value) },
              })
            }
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-300">Level-Up Channel</label>
          <select
            value={leveling.levelUpChannelId || ''}
            onChange={(e) =>
              updateEngagement({
                leveling: { ...leveling, levelUpChannelId: e.target.value || null },
              })
            }
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
          >
            <option value="">Current channel</option>
            {channels.map((ch) => (
              <option key={ch.id} value={ch.id}>
                #{ch.name}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-4">
          <label className="mb-1 block text-xs font-medium text-slate-300">
            Level-Up Message Template
          </label>
          <input
            type="text"
            value={leveling.levelUpTemplate || ''}
            onChange={(e) =>
              updateEngagement({
                leveling: { ...leveling, levelUpTemplate: e.target.value },
              })
            }
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
          />
        </div>
      </div>
    </div>
  );
}
