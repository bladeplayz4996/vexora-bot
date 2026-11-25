import React from 'react';
import DataTableUI from '../shared/data_table_ui.jsx';

export default function ModerationUI({
  activeSubPage = 'anti_nuke_backups',
  config = {},
  channels = [],
  cases = [],
  backups = [],
  onChangeConfig = () => {},
  onTriggerBackup = () => {},
}) {
  const secMod = config.securityModeration || {};
  const antiNuke = secMod.antiNuke || {
    enabled: true,
    autoRestoreOnNuke: false,
    quarantineRoleId: null,
    logChannelId: null,
    whitelistedUsers: [],
    whitelistedRoles: [],
  };
  const joinGate = secMod.joinGate || {
    enabled: true,
    minAccountAgeHours: 24,
    blockDefaultAvatar: false,
    blockInviteInUsername: true,
    raidThresholdJoins: 8,
    raidWindowSeconds: 10,
    raidAction: 'kick',
  };
  const automod = secMod.automod || {
    enabled: true,
    heatThreshold: 100,
    heatDecayPerSecond: 8,
    maxMentions: 5,
    maxNewlines: 12,
    blockDiscordInvites: true,
    blockPhishingLinks: true,
    wordBlacklist: [],
    modLogChannelId: null,
    eventLogChannelId: null,
  };

  const updateSecMod = (patch) =>
    onChangeConfig({ ...config, securityModeration: { ...secMod, ...patch } });

  if (activeSubPage === 'cases_warnings') {
    const columns = [
      { key: 'caseId', label: 'Case ID', accessor: 'caseId' },
      { key: 'action', label: 'Action', accessor: 'action' },
      { key: 'targetId', label: 'Target ID', accessor: 'targetId' },
      { key: 'moderatorId', label: 'Moderator ID', accessor: 'moderatorId' },
      { key: 'reason', label: 'Reason', accessor: 'reason' },
    ];

    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-white">Moderation Cases</h2>
          <p className="text-xs text-slate-400">
            Audit bans, kicks, timeouts, warnings, and moderator actions.
          </p>
        </div>
        <DataTableUI
          columns={columns}
          rows={cases}
          searchPlaceholder="Search by case ID, action, user ID, or reason..."
          emptyMessage="No moderation cases recorded for this server yet."
        />
      </div>
    );
  }

  if (activeSubPage === 'raid_automod') {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-white">Join Gate & Heat AutoMod</h2>
          <p className="text-xs text-slate-400">
            Stop raid bursts, account age spikes, invite spam, and high-heat message floods.
          </p>
        </div>

        <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white">Join Gate & Anti-Raid</span>
            <label className="flex items-center gap-2 text-xs text-slate-200">
              <input
                type="checkbox"
                checked={joinGate.enabled !== false}
                onChange={(e) =>
                  updateSecMod({ joinGate: { ...joinGate, enabled: e.target.checked } })
                }
              />
              Enabled
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs text-slate-300">Min Account Age (hrs)</label>
              <input
                type="number"
                min={0}
                value={joinGate.minAccountAgeHours ?? 24}
                onChange={(e) =>
                  updateSecMod({
                    joinGate: { ...joinGate, minAccountAgeHours: Number(e.target.value) },
                  })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-300">Raid Joins Burst</label>
              <input
                type="number"
                min={2}
                value={joinGate.raidThresholdJoins ?? 8}
                onChange={(e) =>
                  updateSecMod({
                    joinGate: { ...joinGate, raidThresholdJoins: Number(e.target.value) },
                  })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-300">Window (sec)</label>
              <input
                type="number"
                min={3}
                value={joinGate.raidWindowSeconds ?? 10}
                onChange={(e) =>
                  updateSecMod({
                    joinGate: { ...joinGate, raidWindowSeconds: Number(e.target.value) },
                  })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-300">Raid Action</label>
              <select
                value={joinGate.raidAction || 'kick'}
                onChange={(e) =>
                  updateSecMod({ joinGate: { ...joinGate, raidAction: e.target.value } })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
              >
                <option value="kick">Kick</option>
                <option value="ban">Ban</option>
                <option value="timeout">Timeout</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white">Heat AutoMod & Filters</span>
            <label className="flex items-center gap-2 text-xs text-slate-200">
              <input
                type="checkbox"
                checked={automod.enabled !== false}
                onChange={(e) =>
                  updateSecMod({ automod: { ...automod, enabled: e.target.checked } })
                }
              />
              Enabled
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-slate-300">Heat Threshold</label>
              <input
                type="number"
                min={20}
                value={automod.heatThreshold ?? 100}
                onChange={(e) =>
                  updateSecMod({ automod: { ...automod, heatThreshold: Number(e.target.value) } })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-300">Max Mentions</label>
              <input
                type="number"
                min={1}
                value={automod.maxMentions ?? 5}
                onChange={(e) =>
                  updateSecMod({ automod: { ...automod, maxMentions: Number(e.target.value) } })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-300">Mod Log Channel</label>
              <select
                value={automod.modLogChannelId || ''}
                onChange={(e) =>
                  updateSecMod({
                    automod: { ...automod, modLogChannelId: e.target.value || null },
                  })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
              >
                <option value="">Select channel...</option>
                {channels.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    #{ch.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 text-xs text-slate-300">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={Boolean(automod.blockDiscordInvites)}
                onChange={(e) =>
                  updateSecMod({
                    automod: { ...automod, blockDiscordInvites: e.target.checked },
                  })
                }
              />
              Block Discord Invites
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={Boolean(automod.blockPhishingLinks)}
                onChange={(e) =>
                  updateSecMod({
                    automod: { ...automod, blockPhishingLinks: e.target.checked },
                  })
                }
              />
              Block Suspicious / Phishing Links
            </label>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Anti-Nuke & Server Backups</h2>
          <p className="text-xs text-slate-400">
            Protect channels, roles, and members from mass destruction and restore snapshots.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onTriggerBackup({ action: 'create' })}
          className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
        >
          + Create Snapshot Now
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-xs font-semibold text-white">
          <input
            type="checkbox"
            checked={antiNuke.enabled !== false}
            onChange={(e) =>
              updateSecMod({ antiNuke: { ...antiNuke, enabled: e.target.checked } })
            }
          />
          Enable Anti-Nuke Protection
        </label>

        <label className="flex items-center gap-2 text-xs font-semibold text-white">
          <input
            type="checkbox"
            checked={Boolean(antiNuke.autoRestoreOnNuke)}
            onChange={(e) =>
              updateSecMod({
                antiNuke: { ...antiNuke, autoRestoreOnNuke: e.target.checked },
              })
            }
          />
          Auto-Restore Snapshot on Nuke Trigger
        </label>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs text-slate-300">Security Alert Log Channel</label>
          <select
            value={antiNuke.logChannelId || ''}
            onChange={(e) =>
              updateSecMod({
                antiNuke: { ...antiNuke, logChannelId: e.target.value || null },
              })
            }
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
          >
            <option value="">Select channel...</option>
            {channels.map((ch) => (
              <option key={ch.id} value={ch.id}>
                #{ch.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Saved Backups ({backups.length})
        </h3>
        {backups.length === 0 ? (
          <p className="text-xs text-slate-400">No backup snapshots stored yet.</p>
        ) : (
          <div className="divide-y divide-slate-800">
            {backups.map((b) => (
              <div
                key={b.snapshotId}
                className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-xs"
              >
                <div>
                  <span className="font-mono font-semibold text-white">{b.snapshotId}</span>
                  <span className="ml-2 text-slate-400">
                    ({(b.roles || []).length} roles, {(b.channels || []).length} channels)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onTriggerBackup({ action: 'restore', snapshotId: b.snapshotId })}
                  className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300 hover:bg-amber-500/20"
                >
                  Restore Snapshot
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
