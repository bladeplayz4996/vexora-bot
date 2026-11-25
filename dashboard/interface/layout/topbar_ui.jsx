import React, { useState } from 'react';

export default function TopbarUI({
  user = null,
  guilds = [],
  selectedGuildId = '',
  onSelectGuild = () => {},
  hasUnsavedChanges = false,
  isSaving = false,
  onSave = () => {},
  onDiscard = () => {},
  onLogin = () => {},
  onLogout = () => {},
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const activeGuild = guilds.find((g) => g.id === selectedGuildId) || null;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950/95 px-5 backdrop-blur">
      {/* Left: Brand & Server Switcher */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white shadow-sm">
            V
          </div>
          <div>
            <span className="text-sm font-semibold tracking-wide text-white">Vexora</span>
            <span className="ml-2 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-indigo-300">
              STUDIO
            </span>
          </div>
        </div>

        <div className="h-5 w-px bg-slate-800" />

        <div className="flex items-center gap-2">
          {activeGuild?.icon ? (
            <img
              src={activeGuild.icon}
              alt={activeGuild.name}
              className="h-7 w-7 rounded-full object-cover ring-1 ring-slate-700"
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-slate-300">
              {activeGuild?.name?.[0]?.toUpperCase() || '#'}
            </div>
          )}

          <select
            aria-label="Select Discord Server"
            value={selectedGuildId}
            onChange={(e) => onSelectGuild(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm font-medium text-slate-100 outline-none transition focus:border-indigo-500"
          >
            <option value="" disabled>
              Select a server...
            </option>
            {guilds.map((guild) => (
              <option key={guild.id} value={guild.id}>
                {guild.name} {guild.botInGuild ? '' : '(Invite Bot)'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: Save / Discard Bar & Profile Menu */}
      <div className="flex items-center gap-3">
        {hasUnsavedChanges && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1">
            <span className="text-xs font-medium text-amber-300">Unsaved changes</span>
            <button
              type="button"
              onClick={onDiscard}
              disabled={isSaving}
              className="rounded px-2 py-1 text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="rounded bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}

        {user ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-left hover:border-slate-700"
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.globalName || user.username}
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-300">
                  {(user.globalName || user.username || 'U')[0].toUpperCase()}
                </div>
              )}
              <span className="text-xs font-medium text-slate-200">
                {user.globalName || user.username}
              </span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-800 bg-slate-900 p-1.5 shadow-xl">
                <div className="border-b border-slate-800 px-3 py-2">
                  <p className="text-xs font-semibold text-white">{user.globalName || user.username}</p>
                  <p className="text-[11px] text-slate-400">@{user.username}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onLogout();
                  }}
                  className="mt-1 w-full rounded-lg px-3 py-1.5 text-left text-xs font-medium text-rose-400 hover:bg-rose-500/10"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={onLogin}
            className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
          >
            Login with Discord
          </button>
        )}
      </div>
    </header>
  );
}
