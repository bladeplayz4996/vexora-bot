import React from 'react';
import RolePickerUI from '../shared/role_picker_ui.jsx';

export default function RolesUI({
  activeSubPage = 'auto_persistent_roles',
  config = {},
  roles = [],
  onChangeConfig = () => {},
}) {
  const roleCfg = config.roles || {
    autoRoles: [],
    reactionRoles: [],
    temporaryRoles: [],
    persistentRolesEnabled: true,
    tagRole: { enabled: false, tagText: '', roleId: null },
    factions: [],
  };

  const updateRoles = (patch) =>
    onChangeConfig({ ...config, roles: { ...roleCfg, ...patch } });

  const addFaction = () => {
    updateRoles({
      factions: [
        ...(roleCfg.factions || []),
        {
          id: `fac_${Date.now().toString(36)}`,
          name: 'New Faction',
          roleId: roles[0]?.id || '',
        },
      ],
    });
  };

  const updateFaction = (idx, patch) => {
    const next = (roleCfg.factions || []).map((f, i) => (i === idx ? { ...f, ...patch } : f));
    updateRoles({ factions: next });
  };

  const removeFaction = (idx) => {
    const next = (roleCfg.factions || []).filter((_, i) => i !== idx);
    updateRoles({ factions: next });
  };

  if (activeSubPage === 'reaction_roles') {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Factions & Self-Assignable Roles</h2>
            <p className="text-xs text-slate-400">
              Configure server factions, tag roles, and self-pick role groups.
            </p>
          </div>
          <button
            type="button"
            onClick={addFaction}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
          >
            + Add Faction
          </button>
        </div>

        <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          {(roleCfg.factions || []).length === 0 ? (
            <p className="text-xs text-slate-400">No factions configured yet.</p>
          ) : (
            (roleCfg.factions || []).map((fac, idx) => (
              <div
                key={fac.id || idx}
                className="grid grid-cols-1 gap-3 rounded-lg border border-slate-800 bg-slate-950 p-3 sm:grid-cols-3"
              >
                <input
                  type="text"
                  value={fac.name}
                  onChange={(e) => updateFaction(idx, { name: e.target.value })}
                  placeholder="Faction name"
                  className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white"
                />
                <select
                  value={fac.roleId || ''}
                  onChange={(e) => updateFaction(idx, { roleId: e.target.value || null })}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="">Select role...</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeFaction(idx)}
                  className="rounded-lg bg-rose-500/15 px-2.5 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/25"
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Auto & Persistent Roles</h2>
          <p className="text-xs text-slate-400">
            Grant roles automatically on join and restore member roles when they return.
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs font-medium text-slate-200">
          <input
            type="checkbox"
            checked={roleCfg.persistentRolesEnabled !== false}
            onChange={(e) => updateRoles({ persistentRolesEnabled: e.target.checked })}
          />
          Persistent Roles Enabled
        </label>
      </div>

      <RolePickerUI
        roles={roles}
        label="Auto-Assigned Roles on Join"
        value={{
          enabled: true,
          roleIds: (roleCfg.autoRoles || []).map((entry) => entry.roleId),
          pickMode: 'multi',
          keepPreviousRoles: true,
        }}
        onChange={(next) =>
          updateRoles({
            autoRoles: next.roleIds.map((roleId) => {
              const existing = (roleCfg.autoRoles || []).find((e) => e.roleId === roleId);
              return { roleId, delaySeconds: existing?.delaySeconds ?? 0 };
            }),
          })
        }
      />
    </div>
  );
}
