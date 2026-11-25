import React from 'react';

const BUILTIN_COMMANDS = [
  'ban',
  'kick',
  'timeout',
  'warn',
  'purge',
  'lock',
  'balance',
  'work',
  'crime',
  'rob',
  'shop',
  'buy',
  'rank',
  'leaderboard',
  'help',
];

export default function CommandsUI({
  activeSubPage = 'custom_commands',
  config = {},
  onChangeConfig = () => {},
}) {
  const cmds = config.commands || { customCommands: [], overrides: {} };
  const customCommands = cmds.customCommands || [];
  const overrides = cmds.overrides || {};

  const updateCommands = (patch) =>
    onChangeConfig({ ...config, commands: { ...cmds, ...patch } });

  const addCustomCommand = () => {
    updateCommands({
      customCommands: [
        ...customCommands,
        {
          id: `cc_${Date.now().toString(36)}`,
          name: 'scrims',
          cooldownSeconds: 5,
          allowedChannels: [],
          allowedRoles: [],
          responsePayload: {
            mode: 'plain',
            content: 'Scrims check-in opens 30 minutes before lobby start!',
          },
        },
      ],
    });
  };

  const updateCustomCmd = (idx, patch) => {
    const next = customCommands.map((item, i) => (i === idx ? { ...item, ...patch } : item));
    updateCommands({ customCommands: next });
  };

  const removeCustomCmd = (idx) => {
    updateCommands({ customCommands: customCommands.filter((_, i) => i !== idx) });
  };

  const updateOverride = (cmdName, patch) => {
    const current = overrides[cmdName] || {
      enabled: true,
      cooldownSeconds: 3,
      allowedChannels: [],
      blockedChannels: [],
      allowedRoles: [],
      blockedRoles: [],
    };
    updateCommands({
      overrides: {
        ...overrides,
        [cmdName]: { ...current, ...patch },
      },
    });
  };

  if (activeSubPage === 'command_overrides') {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-white">Command Overrides & Cooldowns</h2>
          <p className="text-xs text-slate-400">
            Toggle built-in commands or tune per-command cooldowns in seconds.
          </p>
        </div>

        <div className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900/70">
          {BUILTIN_COMMANDS.map((cmdName) => {
            const ov = overrides[cmdName] || { enabled: true, cooldownSeconds: 3 };
            return (
              <div
                key={cmdName}
                className="flex flex-wrap items-center justify-between gap-4 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={ov.enabled !== false}
                    onChange={(e) => updateOverride(cmdName, { enabled: e.target.checked })}
                  />
                  <span className="font-mono text-xs font-semibold text-white">/{cmdName}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Cooldown (s):</span>
                  <input
                    type="number"
                    min={0}
                    max={86400}
                    value={ov.cooldownSeconds ?? 3}
                    onChange={(e) =>
                      updateOverride(cmdName, { cooldownSeconds: Number(e.target.value) })
                    }
                    className="w-24 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs text-white"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Custom Commands</h2>
          <p className="text-xs text-slate-400">
            Create custom slash/prefix responses for server info, rules, or roster schedules.
          </p>
        </div>
        <button
          type="button"
          onClick={addCustomCommand}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
        >
          + Add Custom Command
        </button>
      </div>

      <div className="space-y-3">
        {customCommands.map((cc, idx) => (
          <div
            key={cc.id || idx}
            className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <input
                type="text"
                value={cc.name}
                onChange={(e) => updateCustomCmd(idx, { name: e.target.value })}
                placeholder="Command name"
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono text-xs text-white"
              />
              <input
                type="number"
                min={0}
                value={cc.cooldownSeconds ?? 5}
                onChange={(e) =>
                  updateCustomCmd(idx, { cooldownSeconds: Number(e.target.value) })
                }
                placeholder="Cooldown (s)"
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
              />
              <button
                type="button"
                onClick={() => removeCustomCmd(idx)}
                className="rounded-lg bg-rose-500/15 px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/25"
              >
                Remove Command
              </button>
            </div>
            <textarea
              rows={2}
              value={cc.responsePayload?.content || ''}
              onChange={(e) =>
                updateCustomCmd(idx, {
                  responsePayload: {
                    ...(cc.responsePayload || { mode: 'plain' }),
                    content: e.target.value,
                  },
                })
              }
              placeholder="Response text..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
