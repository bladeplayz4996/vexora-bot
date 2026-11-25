import React from 'react';

export default function UtilitiesUI({
  config = {},
  channels = [],
  onChangeConfig = () => {},
}) {
  const utilities = config.utilities || {
    loveCalcEnabled: true,
    honeypotChannelId: null,
    auditLogChannelId: null,
  };

  const updateUtilities = (patch) =>
    onChangeConfig({ ...config, utilities: { ...utilities, ...patch } });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-white">Utilities, Honeypot & Audit Logs</h2>
        <p className="text-xs text-slate-400">
          Configure fun/utility toggles, bot-bait honeypot channels, and audit log destinations.
        </p>
      </div>

      <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <label className="flex items-center gap-2 text-xs font-semibold text-white">
          <input
            type="checkbox"
            checked={utilities.loveCalcEnabled !== false}
            onChange={(e) => updateUtilities({ loveCalcEnabled: e.target.checked })}
          />
          Enable Compatibility / LoveCalc Utility
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">
              Honeypot Trap Channel
            </label>
            <select
              value={utilities.honeypotChannelId || ''}
              onChange={(e) =>
                updateUtilities({ honeypotChannelId: e.target.value || null })
              }
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
            >
              <option value="">Disabled (No honeypot channel)</option>
              {channels.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  #{ch.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">
              Audit Log Channel
            </label>
            <select
              value={utilities.auditLogChannelId || ''}
              onChange={(e) =>
                updateUtilities({ auditLogChannelId: e.target.value || null })
              }
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
            >
              <option value="">Disabled</option>
              {channels.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  #{ch.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
