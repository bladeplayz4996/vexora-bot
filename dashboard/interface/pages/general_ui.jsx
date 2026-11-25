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
                
