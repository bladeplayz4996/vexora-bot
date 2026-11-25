import React from 'react';
import RolePickerUI from '../shared/role_picker_ui.jsx';

export default function GeneralUI({
  activeSubPage = 'overview',
  config = {},
  guildMeta = null,
  roles = [],
  onChangeConfig = () => {},
}) {
  const settings = config.settings || {
    prefix: '!',
    language: 'en-US',
    timezone: 'Asia/Kolkata',
    adminRoleIds: [],
    staffRoleIds: [],
  };

  const customProfile = config.customProfile || {
    botName: 'Vexora',
    avatarUrl: '',
    bio: '',
    statusText: 'Watching {server.name}',
    activityType: 'watching',
  };

  const roleConnections = config.roleConnections || {
    enabled: false,
    linkedRoles: [],
  };

  const updateSettings = (patch) =>
    onChangeConfig({ ...config, settings: { ...settings, ...patch } });

  const updateProfile = (patch) =>
    onChangeConfig({ ...config, customProfile: { ...customProfile, ...patch } });

  const updateRoleConnections = (patch) =>
    onChangeConfig({ ...config, roleConnections: { ...roleConnections, ...patch } });

  const addLinkedRole = () => {
    const next = [
      ...(roleConnections.linkedRoles || []),
      {
        id: `lr_${Date.now().toString(36)}`,
        roleId: roles[0]?.id || '',
        minMessages: 50,
        minLevel: 2,
      },
    ];
    updateRoleConnections({ linkedRoles: next });
  };

  const updateLinkedRole = (idx, patch) => {
    const next = (roleConnections.linkedRoles || []).map((item, i) =>
      i === idx ? { ...item, ...patch } : item
    );
    updateRoleConnections({ linkedRoles: next });
  };

  const removeLinkedRole = (idx) => {
    const next = (roleConnections.linkedRoles || []).filter((_, i) => i !== idx);
    updateRoleConnections({ linkedRoles: next });
  };

  if (activeSubPage === 'settings') {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-white">Prefix, Locale & Staff Roles</h2>
          <p className="text-xs text-slate-400">
            Configure command prefix, regional timezone, and trusted staff/admin roles.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">Prefix</label>
            <input
              type="text"
              maxLength={5}
              value={settings.prefix}
              onChange={(e) => updateSettings({ prefix: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">Language</label>
            <select
              value={settings.language}
              onChange={(e) => updateSettings({ language: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
            >
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
              <option value="hi-IN">Hindi (IN)</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">Timezone</label>
            <input
              type="text"
              value={settings.timezone}
              onChange={(e) => updateSettings({ timezone: e.target.value })}
              placeholder="Asia/Kolkata"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <RolePickerUI
            roles={roles}
            label="Admin Roles"
            value={{
              enabled: true,
              roleIds: settings.adminRoleIds || [],
              pickMode: 'multi',
              keepPreviousRoles: true,
            }}
            onChange={(next) => updateSettings({ adminRoleIds: next.roleIds })}
          />
          <RolePickerUI
            roles={roles}
            label="Staff / Moderator Roles"
            value={{
              enabled: true,
              roleIds: settings.staffRoleIds || [],
              pickMode: 'multi',
              keepPreviousRoles: true,
            }}
            onChange={(next) => updateSettings({ staffRoleIds: next.roleIds })}
          />
        </div>
      </div>
    );
  }

  if (activeSubPage === 'profile') {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-white">Custom Bot Profile</h2>
          <p className="text-xs text-slate-400">
            Customize Vexora&apos;s server display name, presence activity, and bio metadata.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">Bot Display Name</label>
            <input
              type="text"
              value={customProfile.botName}
              onChange={(e) => updateProfile({ botName: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">Activity Type</label>
            <select
              value={customProfile.activityType}
              onChange={(e) => updateProfile({ activityType: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
            >
              <option value="playing">Playing</option>
              <option value="watching">Watching</option>
              <option value="listening">Listening</option>
              <option value="competing">Competing</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-300">Status Text</label>
            <input
              type="text"
              value={customProfile.statusText}
              onChange={(e) => updateProfile({ statusText: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-300">Avatar URL</label>
            <input
              type="text"
              value={customProfile.avatarUrl}
              onChange={(e) => updateProfile({ avatarUrl: e.target.value })}
              placeholder="https://..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
            />
          </div>
        </div>
      </div>
    );
  }

  if (activeSubPage === 'role_connections') {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Role Connections</h2>
            <p className="text-xs text-slate-400">
              Grant milestone roles automatically based on member message count or XP level.
            </p>
          </div>
          <label className="flex items-center gap-2 text-xs font-medium text-slate-200">
            <input
              type="checkbox"
              checked={Boolean(roleConnections.enabled)}
              onChange={(e) => updateRoleConnections({ enabled: e.target.checked })}
            />
            Enabled
          </label>
        </div>

        <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Linked Milestones</span>
            <button
              type="button"
              onClick={addLinkedRole}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
            >
              + Add Linked Role
            </button>
          </div>

          {(roleConnections.linkedRoles || []).map((lr, idx) => (
            <div
              key={lr.id || idx}
              className="grid grid-cols-1 gap-3 rounded-lg border border-slate-800 bg-slate-950 p-3 sm:grid-cols-4"
            >
              <select
                value={lr.roleId}
                onChange={(e) => updateLinkedRole(idx, { roleId: e.target.value })}
                className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white"
              >
                <option value="">Select role...</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={0}
                value={lr.minMessages}
                onChange={(e) => updateLinkedRole(idx, { minMessages: Number(e.target.value) })}
                placeholder="Min messages"
                className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white"
              />
              <input
                type="number"
                min={0}
                value={lr.minLevel}
                onChange={(e) => updateLinkedRole(idx, { minLevel: Number(e.target.value) })}
                placeholder="Min level"
                className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white"
              />
              <button
                type="button"
                onClick={() => removeLinkedRole(idx)}
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

  // Default: overview
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-white">
          {guildMeta?.name || 'Server Overview'}
        </h2>
        <p className="text-xs text-slate-400">
          At-a-glance status for Vexora across messaging, moderation, engagement, and economy.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs text-slate-400">Command Prefix</p>
          <p className="mt-1 font-mono text-lg font-bold text-white">{settings.prefix}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs text-slate-400">Leveling System</p>
          <p className="mt-1 text-lg font-bold text-emerald-400">
            {config.engagement?.leveling?.enabled !== false ? 'Active' : 'Disabled'}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs text-slate-400">Anti-Nuke Shield</p>
          <p className="mt-1 text-lg font-bold text-indigo-400">
            {config.securityModeration?.antiNuke?.enabled !== false ? 'Protected' : 'Off'}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs text-slate-400">Custom Commands</p>
          <p className="mt-1 text-lg font-bold text-white">
            {(config.commands?.customCommands || []).length}
          </p>
        </div>
      </div>
    </div>
  );
}
