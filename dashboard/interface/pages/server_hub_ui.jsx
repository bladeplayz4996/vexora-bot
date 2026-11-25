import React from 'react';

const MODULES = [
  {
    key: 'general',
    title: 'General & Identity',
    desc: 'Server overview, command prefix, locale, custom bot profile, and role connections.',
    badge: 'Core',
    toggleKey: 'botEnabled',
    subPages: [
      { id: 'server-overview', label: 'Server Overview' },
      { id: 'prefix-locale', label: 'Prefix & Locale' },
      { id: 'bot-profile', label: 'Custom Bot Profile' },
      { id: 'role-connections', label: 'Role Connections' },
    ],
  },
  {
    key: 'messaging',
    title: 'Messaging & Tickets',
    desc: 'Welcome/leave/boost alerts, embed builder, auto-responders, threads, and support tickets.',
    badge: 'Community',
    toggleKey: 'messagingEnabled',
    subPages: [
      { id: 'join-leave-boost', label: 'Join / Leave / Boost' },
      { id: 'embed-builder', label: 'Embed & Action Builder' },
      { id: 'auto-responders', label: 'Auto-Responders & Threads' },
      { id: 'ticketing-tags', label: 'Ticketing & Tags' },
    ],
  },
  {
    key: 'commands',
    title: 'Commands & Access',
    desc: 'Custom commands, global cooldowns, role access, and channel restrictions.',
    badge: 'Automation',
    toggleKey: 'commandsEnabled',
    subPages: [
      { id: 'custom-commands', label: 'Custom Commands' },
      { id: 'permissions-cooldowns', label: 'Permissions & Cooldowns' },
    ],
  },
  {
    key: 'engagement',
    title: 'Engagement & Voice',
    desc: 'XP leveling, role rewards, temporary voice channels, server stats VC, and starboard.',
    badge: 'Growth',
    toggleKey: 'engagementEnabled',
    subPages: [
      { id: 'xp-rewards', label: 'XP & Role Rewards' },
      { id: 'temp-voice-stats', label: 'Temp Voice & Stats VC' },
      { id: 'starboard-birthdays', label: 'Starboard & Birthdays' },
    ],
  },
  {
    key: 'roles',
    title: 'Roles & Reaction Panels',
    desc: 'Auto-assign roles on join, timed roles, persistent roles, and button/reaction panels.',
    badge: 'Identity',
    toggleKey: 'rolesEnabled',
    subPages: [
      { id: 'auto-temp-persistent', label: 'Auto, Temp & Persistent' },
      { id: 'reaction-panels', label: 'Reaction Panels & Factions' },
    ],
  },
  {
    key: 'moderation',
    title: 'Moderation & Security',
    desc: 'Anti-nuke protection, server backups, join gate, heat-based AutoMod, and mod cases.',
    badge: 'Security',
    toggleKey: 'moderationEnabled',
    subPages: [
      { id: 'anti-nuke-backups', label: 'Anti-Nuke & Backups' },
      { id: 'join-gate-automod', label: 'Join Gate & Heat AutoMod' },
      { id: 'cases-warnings', label: 'Cases & Warnings' },
    ],
  },
  {
    key: 'social_feeds',
    title: 'Social Live Feeds',
    desc: 'Automated YouTube upload alerts and Twitch live stream notifications with role pings.',
    badge: 'Alerts',
    toggleKey: 'socialFeedsEnabled',
    subPages: [
      { id: 'feeds', label: 'YouTube & Twitch Feeds' },
      { id: 'alerts', label: 'Alert Formatting' },
    ],
  },
  {
    key: 'utilities',
    title: 'Utilities & Audit Logs',
    desc: 'Spam honeypot traps, fun utilities, and full message/member/server audit logging.',
    badge: 'Tools',
    toggleKey: 'utilitiesEnabled',
    subPages: [
      { id: 'honeypot-lovecalc-logs', label: 'Honeypot, LoveCalc & Logs' },
    ],
  },
  {
    key: 'economy',
    title: 'Economy & Shop Engine',
    desc: 'Server currency, work/crime/rob cooldowns, role shop items, and balance audit logs.',
    badge: 'Economy',
    toggleKey: 'economyEnabled',
    subPages: [
      { id: 'currency-work-crime', label: 'Currency, Work, Crime & Rob' },
      { id: 'shop-role-pickers', label: 'Shop & Role Pickers' },
      { id: 'balances-audit', label: 'Balances & Audit Log' },
    ],
  },
];

export default function ServerHubUI({
  config = {},
  onChangeConfig,
  onOpenSection,
  onOpenSubPage,
  onNotify,
  user,
  guilds = [],
  activeGuild,
  onLoginDiscord,
}) {
  const toggleModule = (key, title) => {
    const nextValue = !(config[key] ?? true);
    if (typeof onChangeConfig === 'function') {
      onChangeConfig({
        ...config,
        [key]: nextValue,
      });
    }
    if (typeof onNotify === 'function') {
      onNotify(`${title} ${nextValue ? 'enabled' : 'disabled'}.`, 'info');
    }
  };

  const enabledCount = MODULES.filter((m) => config[m.toggleKey] ?? true).length;

  return (
    <div className="min-w-0 w-full max-w-full overflow-x-hidden px-3 py-4 sm:px-6 sm:py-6 text-slate-100">
      {/* Auth & Connected Server Notice Banner */}
      {!user && (
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-indigo-400/35 bg-indigo-950/35 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
              Discord Account Not Connected
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-200">
              Sign in with Discord to load your connected servers and manage per-guild settings directly.
            </p>
          </div>
          <button
            type="button"
            onClick={onLoginDiscord}
            className="whitespace-nowrap shrink-0 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] px-4 py-2 text-xs font-semibold text-white transition"
          >
            Login with Discord
          </button>
        </div>
      )}

      {/* Hero Header */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-gradient-to-br from-[#121933] via-[#0d1224] to-[#090d18] p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-block rounded-full border border-indigo-400/30 bg-indigo-500/15 px-3 py-0.5 text-[11px] font-semibold text-indigo-200">
                NEXUS CONTROL HUB
              </span>
              <span className="inline-block rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] text-slate-300">
                {enabledCount}/{MODULES.length} Modules Active
              </span>
              <span className="inline-block rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] text-slate-300">
                {activeGuild
                  ? `Server: ${activeGuild.name}`
                  : guilds.length > 0
                  ? `${guilds.length} Servers Available`
                  : 'No Guild Selected'}
              </span>
            </div>

            <h1 className="mt-2.5 text-xl sm:text-2xl font-bold tracking-tight text-white">
              Server Command Center
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-2xl">
              Toggle modules on or off and jump directly into any sub-page across your connected Discord server.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onOpenSubPage?.('server-overview', 'general')}
              className="whitespace-nowrap shrink-0 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-semibold text-white transition"
            >
              Server Overview
            </button>
            <button
              type="button"
              onClick={() => onOpenSubPage?.('anti-nuke-backups', 'moderation')}
              className="whitespace-nowrap shrink-0 rounded-xl border border-white/15 bg-[#131a30] hover:bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 transition"
            >
              Security Shield
            </button>
          </div>
        </div>
      </div>

      {/* 9 Module Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 min-w-0">
        {MODULES.map((mod) => {
          const isEnabled = config[mod.toggleKey] ?? true;
          return (
            <div
              key={mod.key}
              className="min-w-0 flex flex-col justify-between rounded-2xl border border-white/10 bg-[#0e1322] p-4 sm:p-5 shadow-lg"
            >
              <div className="min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="inline-block rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-300">
                      {mod.badge}
                    </span>
                    <h2 className="mt-1.5 text-base font-bold text-white">
                      {mod.title}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleModule(mod.toggleKey, mod.title)}
                    className={`whitespace-nowrap shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold border transition ${
                      isEnabled
                        ? 'border-emerald-400/40 bg-emerald-500/20 text-emerald-200'
                        : 'border-slate-600/50 bg-slate-800/70 text-slate-400'
                    }`}
                  >
                    {isEnabled ? 'Active' : 'Paused'}
                  </button>
                </div>

                <p className="mt-2 text-xs leading-relaxed text-slate-400">
                  {mod.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 space-y-2.5">
                <div className="flex flex-wrap gap-1.5">
                  {mod.subPages.map((sp) => (
                    <button
                      key={sp.id}
                      type="button"
                      onClick={() => onOpenSubPage?.(sp.id, mod.key)}
                      className="whitespace-nowrap shrink-0 rounded-lg border border-white/10 bg-[#141b30] hover:border-indigo-400/40 hover:text-indigo-200 px-2.5 py-1 text-[11px] font-medium text-slate-300 transition"
                    >
                      {sp.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => onOpenSection?.(mod.key)}
                  className="w-full rounded-xl border border-indigo-500/30 bg-indigo-600/15 hover:bg-indigo-600/25 py-2 text-xs font-semibold text-indigo-200 transition"
                >
                  Open {mod.title}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
