import React from 'react';

export default function RolePickerUI({
  roles = [],
  value = {
    enabled: false,
    roleIds: [],
    pickMode: 'single',
    keepPreviousRoles: false,
  },
  onChange = () => {},
  label = 'Role Picker Configuration',
}) {
  const picker = {
    enabled: Boolean(value?.enabled),
    roleIds: Array.isArray(value?.roleIds) ? value.roleIds : [],
    pickMode: value?.pickMode === 'multi' ? 'multi' : 'single',
    keepPreviousRoles: Boolean(value?.keepPreviousRoles),
  };

  const toggleRole = (roleId) => {
    const exists = picker.roleIds.includes(roleId);
    const nextIds = exists
      ? picker.roleIds.filter((id) => id !== roleId)
      : [...picker.roleIds, roleId];
    onChange({ ...picker, roleIds: nextIds });
  };

  return (
    <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-xs font-semibold text-white">
          <input
            type="checkbox"
            checked={picker.enabled}
            onChange={(e) => onChange({ ...picker, enabled: e.target.checked })}
          />
          {label}
        </label>

        {picker.enabled && (
          <div className="flex items-center gap-2">
            <select
              value={picker.pickMode}
              onChange={(e) => onChange({ ...picker, pickMode: e.target.value })}
              className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs text-slate-200"
            >
              <option value="single">Single Role Pick</option>
              <option value="multi">Multi Role Pick</option>
            </select>

            <label className="flex items-center gap-1.5 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={picker.keepPreviousRoles}
                onChange={(e) => onChange({ ...picker, keepPreviousRoles: e.target.checked })}
              />
              Keep previous
            </label>
          </div>
        )}
      </div>

      {picker.enabled && (
        <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950 p-2">
          {roles.length === 0 ? (
            <p className="px-2 py-3 text-xs text-slate-400">
              No guild roles loaded yet. Connect the bot or select a server with cached roles.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {roles.map((role) => {
                const selected = picker.roleIds.includes(role.id);
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => toggleRole(role.id)}
                    className={`flex items-center justify-between rounded-md border px-2.5 py-1.5 text-left text-xs transition ${
                      selected
                        ? 'border-indigo-500 bg-indigo-600/20 text-white'
                        : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span
                        style={{ backgroundColor: role.color || '#99AAB5' }}
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                      />
                      <span className="truncate">{role.name}</span>
                    </span>
                    <span className="text-[11px] font-semibold">
                      {selected ? '✓' : '+'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
