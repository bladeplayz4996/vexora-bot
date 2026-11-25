import React, { useState } from 'react';

const MODULE_CATEGORIES = [
  {
    id: 'general',
    category: 'Server & Core',
    title: 'General Settings',
    description: 'Server overview, command prefix, locale, custom profile & linked role connections.',
    accent: 'from-indigo-500/20 to-violet-500/10 border-indigo-500/30 text-indigo-300',
    subButtons: [
      { subKey: 'overview', label: 'Server Overview' },
      { subKey: 'settings', label: 'Prefix & Locale' },
      { subKey: 'profile', label: 'Custom Profile' },
      { subKey: 'connections', label: 'Role Connections' },
    ],
  },
  {
    id: 'messaging',
    category: 'Community & Alerts',
    title: 'Messaging & Tickets',
    description: 'Welcome/leave/boost alerts, embed builder, auto-responders, threads, tickets & tags.',
    accent: 'from-sky-500/20 to-indigo-500/10 border-sky-500/30 text-sky-300',
    subButtons: [
      { subKey: 'announcements', label: 'Join / Leave / Boost' },
      { subKey: 'builder', label: 'Embed & Action Builder' },
      { subKey: 'responders', label: 'Auto-Responders & Threads' },
      { subKey: 'tickets', label: 'Ticketing & Tags' },
    ],
  },
  {
    id: 'commands',
    category: 'Command Control',
    title: 'Commands & Overrides',
    description: 'Create custom commands and configure role/channel permissions & cooldowns.',
    accent: 'from-purple-500/20 to-fuchsia-500/10 border-purple-500/30 text-purple-300',
    subButtons: [
      { subKey: 'custom', label: 'Custom Commands' },
      { subKey: 'overrides', label: 'Permissions & Cooldowns' },
    ],
  },
  {
    id: 'engagement',
    category: 'Activity & Progression',
    title: 'Engagement & VC',
    description: 'Leveling, leaderboards, role rewards, temp voice rooms, starboard & birthdays.',
    accent: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-300',
    subButtons: [
      { subKey: 'levels', label: 'XP & Role Rewards' },
      { subKey: 'voice', label: 'Temp Voice & Stats VC' },
      { subKey: 'extras', label: 'Starboard & Birthdays' },
    ],
  },
  {
    id: 'roles',
    category: 'Access & Identity',
    title: 'Roles & Factions',
    description: 'Auto, temporary & persistent roles, reaction/button role panels & team factions.',
    accent: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-300',
    subButtons: [
      { subKey: 'core', label: 'Auto, Temp & Persistent' },
      { subKey: 'panels', label: 'Reaction Panels & Factions' },
    ],
  },
  {
    id: 'moderation',
    category: 'Protection & Enforcement',
    title: 'Moderation & Security',
    description: 'Anti-nuke shield, server snapshots/backups, raid lockdown, heat automod, cases & warns.',
    accent: 'from-rose-500/20 to-orange-500/10 border-rose-500/30 text-rose-300',
    subButtons: [
      { subKey: 'security', label: 'Anti-Nuke & Backups' },
      { subKey: 'automod', label: 'Join Gate & Heat AutoMod' },
      { subKey: 'cases', label: 'Cases & Warnings' },
    ],
  },
  {
    id: 'social_feeds',
    category: 'Live Notifications',
    title: 'Social Feeds',
    description: 'Automatic YouTube upload/stream alerts and Twitch live notifications.',
    accent: 'from-amber-500/20 to-yellow-500/10 border-amber-500/30 text-amber-300',
    subButtons: [
      { subKey: 'feeds', label: 'YouTube & Twitch Feeds' },
    ],
  },
  {
    id: 'utilities',
    category: 'Tools & Audit',
    title: 'Utilities & Logs',
    description: 'Honeypot trap channels, LoveCalc, fun/game helpers & unified server audit logs.',
    accent: 'from-violet-500/20 to-indigo-500/10 border-violet-500/30 text-violet-300',
    subButtons: [
      { subKey: 'tools', label: 'Honeypot, LoveCalc & Logs' },
    ],
  },
  {
    id: 'economy',
    category: 'Virtual Currency & Store',
    title: 'Economy & Shop Engine',
    description: 'Currency symbol/wallet/bank rules, work/crime/rob, shop items, role pickers & balances.',
    accent: 'from-lime-500/20 to-emerald-500/10 border-lime-500/30 text-lime-300',
    subButtons: [
      { subKey: 'rules', label: 'Currency, Work, Crime & Rob' },
      { subKey: 'shop', label: 'Shop & Role Pickers' },
      { subKey: 'balances', label: 'Balances & Audit Log' },
    ],
  },
];

export default function ServerHubUI({
  guildMeta,
  config,
  economyConfig,
  shopItems = [],
  cases = [],
  onOpenModule,
  onToggleSetting,
}) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const categoriesList = ['ALL', ...MODULE_CATEGORIES.map((m) => m.category)];

  const visibleModules =
    selectedCategory === 'ALL'
      ? MODULE_CATEGORIES
      : MODULE_CATEGORIES.filter((m) => m.category === selectedCategory);

  const antiNukeOn = Boolean(config?.securityModeration?.antiNuke?.enabled);
  const automodOn = Boolean(config?.securityModeration?.automod?.enabled);
  const levelingOn = Boolean(config?.engagement?.leveling?.enabled);
  const economyOn = Boolean(economyConfig?.enabled);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#1e263d] bg-gradient-to-br from-[#12182b] via-[#111625] to-[#19142c] p-6 shadow-xl">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Koya Control Hub • Server Studio
            </span>
            <h1 className="mt-2 text-2xl font-bold text-white">
              {guildMeta?.name || 'Discord Server'} — Module Center
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Every module and sub-feature in one place. Click any button to open its panel directly.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl border border-[#242e4a] bg-[#090d16] px-3.5 py-2.5">
              <div className="text-[11px] text-slate-400">Modules</div>
              <div className="text-lg font-bold text-indigo-400">9</div>
            </div>
            <div className="rounded-xl border border-[#242e4a] bg-[#090d16] px-3.5 py-2.5">
              <div className="text-[11px] text-slate-400">Shop Items</div>
              <div className="text-lg font-bold text-emerald-400">{shopItems.length}</div>
            </div>
            <div className="rounded-xl border border-[#242e4a] bg-[#090d16] px-3.5 py-2.5">
              <div className="text-[11px] text-slate-400">Mod Cases</div>
              <div className="text-lg font-bold text-amber-400">{cases.length}</div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <button
            type="button"
            onClick={() => onToggleSetting('antiNuke', !antiNukeOn)}
            className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition ${
              antiNukeOn
                ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200'
                : 'border-[#252f4b] bg-[#0b0f19] text-slate-300 hover:border-indigo-500/40'
            }`}
          >
            <span>Anti-Nuke</span>
            <span>{antiNukeOn ? 'ON' : 'OFF'}</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleSetting('automod', !automodOn)}
            className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition ${
              automodOn
                ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200'
                : 'border-[#252f4b] bg-[#0b0f19] text-slate-300 hover:border-indigo-500/40'
            }`}
          >
            <span>Heat AutoMod</span>
            <span>{automodOn ? 'ON' : 'OFF'}</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleSetting('leveling', !levelingOn)}
            className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition ${
              levelingOn
                ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200'
                : 'border-[#252f4b] bg-[#0b0f19] text-slate-300 hover:border-indigo-500/40'
            }`}
          >
            <span>XP Leveling</span>
            <span>{levelingOn ? 'ON' : 'OFF'}</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleSetting('economy', !economyOn)}
            className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition ${
              economyOn
                ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200'
                : 'border-[#252f4b] bg-[#0b0f19] text-slate-300 hover:border-indigo-500/40'
            }`}
          >
            <span>Economy Engine</span>
            <span>{economyOn ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {categoriesList.map((cat) => {
          const active = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                active
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'border border-[#1e263d] bg-[#111625] text-slate-300 hover:border-indigo-500/40 hover:text-white'
              }`}
            >
              {cat === 'ALL' ? 'All Categories (9)' : cat}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleModules.map((mod) => (
          <div
            key={mod.id}
            className="flex flex-col justify-between rounded-2xl border border-[#1e263d] bg-[#111625] p-5 transition hover:border-indigo-500/40"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`inline-block rounded-md border bg-gradient-to-r px-2.5 py-0.5 text-[11px] font-semibold ${mod.accent}`}
                >
                  {mod.category}
                </span>
                <button
                  type="button"
                  onClick={() => onOpenModule(mod.id, mod.subButtons[0].subKey)}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                >
                  Open Module →
                </button>
              </div>

              <h2 className="mt-3 text-lg font-bold text-white">{mod.title}</h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">{mod.description}</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5 border-t border-[#1c243b] pt-3.5">
              {mod.subButtons.map((btn) => (
                <button
                  key={`${mod.id}_${btn.subKey}`}
                  type="button"
                  onClick={() => onOpenModule(mod.id, btn.subKey)}
                  className="rounded-lg border border-[#263150] bg-[#0b0f19] px-2.5 py-1.5 text-xs font-medium text-slate-200 transition hover:border-indigo-500 hover:bg-indigo-600/20 hover:text-white"
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
