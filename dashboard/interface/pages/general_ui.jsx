import React, { useState, useEffect } from 'react';

const TABS = [
  { id: 'server-overview', label: 'Server Overview' },
  { id: 'prefix-locale', label: 'Prefix & Locale' },
  { id: 'bot-profile', label: 'Custom Bot Profile' },
  { id: 'role-connections', label: 'Role Connections' },
];

export default function GeneralUI({
  config = {},
  onChangeConfig,
  activeSubPage,
  onChangeSubPage,
  activeGuild,
  onNotify,
}) {
  const [tab, setTab] = useState(activeSubPage || 'server-overview');

  useEffect(() => {
    if (activeSubPage && activeSubPage !== tab) {
      setTab(activeSubPage);
    }
  }, [activeSubPage, tab]);

  const selectTab = (id) => {
    setTab(id);
    if (typeof onChangeSubPage === 'function') {
      onChangeSubPage(id);
    }
  };

  const updateField = (key, value) => {
    if (typeof onChangeConfig === 'function') {
      onChangeConfig({
        ...config,
        [key]: value,
      });
    }
  };

  const handleResetGeneral = () => {
    if (typeof onChangeConfig === 'function') {
      onChangeConfig({
        ...config,
        prefix: '!',
        locale: 'en-US',
        embedColor: '#5865F2',
        botNickname: '',
        deleteTriggerMessages: false,
        ephemeralErrors: true,
        roleConnectionsEnabled: false,
      });
    }
    if (typeof onNotify === 'function') {
      onNotify('Reset general identity settings to defaults.', 'info');
    }
  };

  return (
    <div className="min-w-0 w-full max-w-full overflow-x-hidden px-3 py-4 sm:px-6 sm:py-6 text-slate-100">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-white">
              General &amp; Identity
            </h1>
            {activeGuild && (
              <span className="rounded-full border border-indigo-400/30 bg-indigo-500/15 px-2.5 py-0.5 text-[11px] font-medium text-indigo-200 whitespace-nowrap">
                {activeGuild.name}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Configure core server channels, command prefix, locale, custom bot profile, and linked roles.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetGeneral}
          className="whitespace-nowrap shrink-0 self-start sm:self-auto rounded-xl border border-white/15 bg-[#12182b] hover:bg-white/5 px-3.5 py-2 text-xs font-semibold text-slate-200 transition"
        >
          Reset Defaults
        </button>
      </div>

      {/* Sub-Page Tabs */}
      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => selectTab(item.id)}
              className={`whitespace-nowrap shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold border transition ${
                active
                  ? 'border-indigo-400/60 bg-indigo-600/25 text-indigo-200'
                  : 'border-white/10 bg-[#0e1322] text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Server Overview */}
      {tab === 'server-overview' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 min-w-0">
          <div className="min-w-0 rounded-2xl border border-white/10 bg-[#0e1322] p-4 sm:p-5 space-y-3.5 shadow-lg">
            <h2 className="text-sm sm:text-base font-semibold text-white">
              Core Channels &amp; Roles
            </h2>

            <div className="min-w-0">
              <label className="block text-xs text-slate-400 mb-1">
                Admin Log Channel ID
              </label>
              <input
                type="text"
                value={config.adminLogChannelId || ''}
                onChange={(e) => updateField('adminLogChannelId', e.target.value)}
                placeholder="123456789012345678"
                className="w-full min-w-0 rounded-xl border border-white/10 bg-[#12182b] px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-400 focus:outline-none"
              />
            </div>

            <div className="min-w-0">
              <label className="block text-xs text-slate-400 mb-1">
                Staff / Moderator Role ID
              </label>
              <input
                type="text"
                value={config.staffRoleId || ''}
                onChange={(e) => updateField('staffRoleId', e.target.value)}
                placeholder="123456789012345678"
                className="w-full min-w-0 rounded-xl border border-white/10 bg-[#12182b] px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-400 focus:outline-none"
              />
            </div>

            <div className="min-w-0">
              <label className="block text-xs text-slate-400 mb-1">
                Server Summary / Tagline
              </label>
              <textarea
                rows={3}
                maxLength={300}
                value={config.serverOverviewNote || ''}
                onChange={(e) => updateField('serverOverviewNote', e.target.value)}
                placeholder="Optional server notes or operational summary..."
                className="w-full min-w-0 rounded-xl border border-white/10 bg-[#12182b] px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-400 focus:outline-none"
              />
              <div className="mt-1 text-right text-[11px] text-slate-500">
                {(config.serverOverviewNote || '').length}/300
              </div>
            </div>
          </div>

          <div className="min-w-0 rounded-2xl border border-white/10 bg-[#0e1322] p-4 sm:p-5 space-y-3 shadow-lg">
            <h2 className="text-sm sm:text-base font-semibold text-white">
              Command Execution Behavior
            </h2>

            <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#090d18] p-3.5 cursor-pointer">
              <div className="min-w-0">
                <div className="text-xs font-medium text-slate-200">
                  Delete Trigger Messages
                </div>
                <div className="text-[11px] text-slate-400">
                  Clean up prefix command messages after execution.
                </div>
              </div>
              <input
                type="checkbox"
                checked={Boolean(config.deleteTriggerMessages)}
                onChange={(e) => updateField('deleteTriggerMessages', e.target.checked)}
                className="h-4 w-4 accent-indigo-500 shrink-0"
              />
            </label>

            <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#090d18] p-3.5 cursor-pointer">
              <div className="min-w-0">
                <div className="text-xs font-medium text-slate-200">
                  Ephemeral Permission &amp; Error Replies
                </div>
                <div className="text-[11px] text-slate-400">
                  Show error warnings privately only to the command user.
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.ephemeralErrors ?? true}
                onChange={(e) => updateField('ephemeralErrors', e.target.checked)}
                className="h-4 w-4 accent-indigo-500 shrink-0"
              />
            </label>
          </div>
        </div>
      )}

      {/* Tab 2: Prefix & Locale */}
      {tab === 'prefix-locale' && (
        <div className="max-w-3xl rounded-2xl border border-white/10 bg-[#0e1322] p-4 sm:p-5 space-y-4 shadow-lg">
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-white">
              Prefix &amp; Language Locale
            </h2>
            <p className="text-xs text-slate-400">
              Set the prefix used for text commands and default response language.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="min-w-0">
              <label className="block text-xs text-slate-400 mb-1">
                Command Prefix
              </label>
              <input
                type="text"
                maxLength={5}
                value={config.prefix ?? '!'}
                onChange={(e) => updateField('prefix', e.target.value)}
                placeholder="!"
                className="w-full min-w-0 rounded-xl border border-white/10 bg-[#12182b] px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-400 focus:outline-none"
              />
            </div>

            <div className="min-w-0">
              <label className="block text-xs text-slate-400 mb-1">
                Default Locale
              </label>
              <select
                value={config.locale || 'en-US'}
                onChange={(e) => updateField('locale', e.target.value)}
                className="w-full min-w-0 rounded-xl border border-white/10 bg-[#12182b] px-3 py-2 text-xs text-white focus:border-indigo-400 focus:outline-none"
              >
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
                <option value="en-IN">English (India)</option>
                <option value="hi-IN">Hindi (हिन्दी)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Custom Bot Profile */}
      {tab === 'bot-profile' && (
        <div className="max-w-3xl rounded-2xl border border-white/10 bg-[#0e1322] p-4 sm:p-5 space-y-4 shadow-lg">
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-white">
              Custom Bot Profile
            </h2>
            <p className="text-xs text-slate-400">
              Customize how the bot appears in this server and in embeds.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="min-w-0">
              <label className="block text-xs text-slate-400 mb-1">
                Server Nickname
              </label>
              <input
                type="text"
                maxLength={32}
                value={config.botNickname || ''}
                onChange={(e) => updateField('botNickname', e.target.value)}
                placeholder="Nexus Bot"
                className="w-full min-w-0 rounded-xl border border-white/10 bg-[#12182b] px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-400 focus:outline-none"
              />
            </div>

            <div className="min-w-0">
              <label className="block text-xs text-slate-400 mb-1">
                Embed Accent Color (Hex)
              </label>
              <div className="flex items-center gap-2 min-w-0">
                <input
                  type="color"
                  value={/^#[0-9A-Fa-f]{6}$/.test(config.embedColor || '') ? config.embedColor : '#5865F2'}
                  onChange={(e) => updateField('embedColor', e.target.value)}
                  className="h-9 w-11 shrink-0 rounded-lg border border-white/10 bg-[#12182b] p-1 cursor-pointer"
                />
                <input
                  type="text"
                  maxLength={7}
                  value={config.embedColor || '#5865F2'}
                  onChange={(e) => updateField('embedColor', e.target.value)}
                  placeholder="#5865F2"
                  className="w-full min-w-0 rounded-xl border border-white/10 bg-[#12182b] px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="min-w-0">
            <label className="block text-xs text-slate-400 mb-1">
              Default Embed Footer
            </label>
            <input
              type="text"
              maxLength={120}
              value={config.embedFooter || ''}
              onChange={(e) => updateField('embedFooter', e.target.value)}
              placeholder="Powered by Nexus"
              className="w-full min-w-0 rounded-xl border border-white/10 bg-[#12182b] px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-400 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Tab 4: Role Connections */}
      {tab === 'role-connections' && (
        <div className="max-w-3xl rounded-2xl border border-white/10 bg-[#0e1322] p-4 sm:p-5 space-y-4 shadow-lg">
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-white">
              Linked Role Connections
            </h2>
            <p className="text-xs text-slate-400">
              Map server activity or verification requirements to Discord Linked Role metadata.
            </p>
          </div>

          <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#090d18] p-3.5 cursor-pointer">
            <div className="min-w-0">
              <div className="text-xs font-medium text-slate-200">
                Enable Linked Role Metadata Sync
              </div>
              <div className="text-[11px] text-slate-400">
                Allow connected roles to reflect verified server status and milestones.
              </div>
            </div>
            <input
              type="checkbox"
              checked={Boolean(config.roleConnectionsEnabled)}
              onChange={(e) => updateField('roleConnectionsEnabled', e.target.checked)}
              className="h-4 w-4 accent-indigo-500 shrink-0"
            />
          </label>
        </div>
      )}
    </div>
  );
}
