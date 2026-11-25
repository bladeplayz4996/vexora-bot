import React, { useState, useEffect, useCallback } from 'react';
import ServerHubUI from './pages/server_hub_ui.jsx';
import GeneralUI from './pages/general_ui.jsx';
import MessagingUI from './pages/messaging_ui.jsx';
import CommandsUI from './pages/commands_ui.jsx';
import EngagementUI from './pages/engagement_ui.jsx';
import RolesUI from './pages/roles_ui.jsx';
import ModerationUI from './pages/moderation_ui.jsx';
import SocialFeedsUI from './pages/social_feeds_ui.jsx';
import UtilitiesUI from './pages/utilities_ui.jsx';
import EconomyEngineUI from './pages/economy_engine_ui.jsx';

const NAV_GROUPS = [
  {
    key: 'hub',
    label: 'HUB',
    topLabel: 'Nexus Hub',
    defaultSubPage: 'overview',
    items: [{ id: 'overview', label: 'Server Hub Overview' }],
  },
  {
    key: 'general',
    label: 'GENERAL',
    topLabel: 'General',
    defaultSubPage: 'server-overview',
    items: [
      { id: 'server-overview', label: 'Server Overview' },
      { id: 'prefix-locale', label: 'Prefix & Locale' },
      { id: 'bot-profile', label: 'Custom Bot Profile' },
      { id: 'role-connections', label: 'Role Connections' },
    ],
  },
  {
    key: 'messaging',
    label: 'MESSAGING',
    topLabel: 'Messaging',
    defaultSubPage: 'join-leave-boost',
    items: [
      { id: 'join-leave-boost', label: 'Join / Leave / Boost' },
      { id: 'embed-builder', label: 'Embed & Action Builder' },
      { id: 'auto-responders', label: 'Auto-Responders & Threads' },
      { id: 'ticketing-tags', label: 'Ticketing & Tags' },
    ],
  },
  {
    key: 'commands',
    label: 'COMMANDS',
    topLabel: 'Commands',
    defaultSubPage: 'custom-commands',
    items: [
      { id: 'custom-commands', label: 'Custom Commands' },
      { id: 'permissions-cooldowns', label: 'Permissions & Cooldowns' },
    ],
  },
  {
    key: 'engagement',
    label: 'ENGAGEMENT',
    topLabel: 'Engagement',
    defaultSubPage: 'xp-rewards',
    items: [
      { id: 'xp-rewards', label: 'XP & Role Rewards' },
      { id: 'temp-voice-stats', label: 'Temp Voice & Stats VC' },
      { id: 'starboard-birthdays', label: 'Starboard & Birthdays' },
    ],
  },
  {
    key: 'roles',
    label: 'ROLES',
    topLabel: 'Roles',
    defaultSubPage: 'auto-temp-persistent',
    items: [
      { id: 'auto-temp-persistent', label: 'Auto, Temp & Persistent' },
      { id: 'reaction-panels', label: 'Reaction Panels & Factions' },
    ],
  },
  {
    key: 'moderation',
    label: 'MODERATION & SECURITY',
    topLabel: 'Moderation',
    defaultSubPage: 'anti-nuke-backups',
    items: [
      { id: 'anti-nuke-backups', label: 'Anti-Nuke & Backups' },
      { id: 'join-gate-automod', label: 'Join Gate & Heat AutoMod' },
      { id: 'cases-warnings', label: 'Cases & Warnings' },
    ],
  },
  {
    key: 'social_feeds',
    label: 'SOCIAL FEEDS',
    topLabel: 'Social Feeds',
    defaultSubPage: 'feeds',
    items: [
      { id: 'feeds', label: 'YouTube & Twitch Feeds' },
      { id: 'alerts', label: 'Alert Formatting' },
    ],
  },
  {
    key: 'utilities',
    label: 'UTILITIES',
    topLabel: 'Utilities',
    defaultSubPage: 'honeypot-lovecalc-logs',
    items: [{ id: 'honeypot-lovecalc-logs', label: 'Honeypot, LoveCalc & Logs' }],
  },
  {
    key: 'economy',
    label: 'ECONOMY & SHOP',
    topLabel: 'Economy',
    defaultSubPage: 'currency-work-crime',
    items: [
      { id: 'currency-work-crime', label: 'Currency, Work, Crime & Rob' },
      { id: 'shop-role-pickers', label: 'Shop & Role Pickers' },
      { id: 'balances-audit', label: 'Balances & Audit Log' },
    ],
  },
];

export default function DashboardApp() {
  const [user, setUser] = useState(null);
  const [guilds, setGuilds] = useState([]);
  const [selectedGuildId, setSelectedGuildId] = useState('');
  const [authLoading, setAuthLoading] = useState(true);
  const [configLoading, setConfigLoading] = useState(false);

  const [config, setConfig] = useState({});
  const [activeSection, setActiveSection] = useState('hub');
  const [activeSubPage, setActiveSubPage] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const notify = useCallback((text, type = 'info') => {
    setToast({ text, type });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const loadGuildConfig = useCallback(
    async (guildId) => {
      if (!guildId) return;
      setConfigLoading(true);
      try {
        const res = await fetch(`/api/guilds/${encodeURIComponent(guildId)}/config`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Config fetch failed');
        const data = await res.json();
        setConfig(data?.config && typeof data.config === 'object' ? data.config : data || {});
        setDirty(false);
      } catch {
        setConfig({});
        setDirty(false);
      } finally {
        setConfigLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    let active = true;
    async function initSession() {
      setAuthLoading(true);
      try {
        const meRes = await fetch('/api/auth/me', { credentials: 'include' });
        if (meRes.ok) {
          const meData = await meRes.json();
          if (!active) return;
          const currentUser = meData?.user || null;
          setUser(currentUser);

          if (currentUser) {
            const guildsRes = await fetch('/api/guilds', { credentials: 'include' });
            if (guildsRes.ok) {
              const guildsData = await guildsRes.json();
              const list = Array.isArray(guildsData?.guilds)
                ? guildsData.guilds
                : Array.isArray(guildsData)
                ? guildsData
                : [];
              if (!active) return;
              setGuilds(list);

              const savedGuild =
                window.localStorage.getItem('nexus_selected_guild') ||
                list[0]?.id ||
                '';
              if (savedGuild) {
                setSelectedGuildId(savedGuild);
                await loadGuildConfig(savedGuild);
              }
            }
          }
        }
      } catch {
        // Not authenticated yet or API endpoint not configured yet
      } finally {
        if (active) setAuthLoading(false);
      }
    }
    initSession();
    return () => {
      active = false;
    };
  }, [loadGuildConfig]);

  const handleGuildChange = async (nextGuildId) => {
    if (dirty) {
      const ok = window.confirm('You have unsaved changes. Switch server anyway?');
      if (!ok) return;
    }
    setSelectedGuildId(nextGuildId);
    window.localStorage.setItem('nexus_selected_guild', nextGuildId);
    await loadGuildConfig(nextGuildId);
  };

  const handleLoginDiscord = () => {
    window.location.href = '/auth/discord';
  };

  const handleLogoutDiscord = async () => {
    try {
      await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // ignore network error on logout
    }
    setUser(null);
    setGuilds([]);
    setSelectedGuildId('');
    setDirty(false);
    window.localStorage.removeItem('nexus_selected_guild');
    notify('Signed out of Discord.', 'info');
  };

  const handleUpdateConfig = (nextConfig) => {
    setConfig(nextConfig);
    setDirty(true);
  };

  const handleDiscard = async () => {
    if (selectedGuildId) {
      await loadGuildConfig(selectedGuildId);
    }
    setDirty(false);
    notify('Reverted unsaved changes.', 'info');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const endpoint = selectedGuildId
        ? `/api/guilds/${encodeURIComponent(selectedGuildId)}/config`
        : '/api/config';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error('Save failed');
      setDirty(false);
      notify('Server settings saved.', 'success');
    } catch {
      notify('Could not save settings. Check backend API & Discord session.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectSection = (sectionKey, subPageOverride) => {
    const group = NAV_GROUPS.find((g) => g.key === sectionKey);
    const nextSub = subPageOverride || group?.defaultSubPage || 'overview';
    setActiveSection(sectionKey);
    setActiveSubPage(nextSub);
    setSidebarOpen(false);
  };

  const handleSelectSubPage = (subPageId, parentSectionKey) => {
    setActiveSubPage(subPageId);
    if (parentSectionKey) {
      setActiveSection(parentSectionKey);
    } else {
      const found = NAV_GROUPS.find((g) => g.items.some((item) => item.id === subPageId));
      if (found) setActiveSection(found.key);
    }
    setSidebarOpen(false);
  };

  const activeGuild = guilds.find((g) => String(g.id) === String(selectedGuildId)) || null;

  const sharedProps = {
    config,
    onChangeConfig: handleUpdateConfig,
    activeSubPage,
    onChangeSubPage: (sub) => handleSelectSubPage(sub, activeSection),
    onNotify: notify,
    user,
    guilds,
    selectedGuildId,
    activeGuild,
    onSelectGuild: handleGuildChange,
    onLoginDiscord: handleLoginDiscord,
  };

  const renderActivePage = () => {
    switch (activeSection) {
      case 'hub':
        return (
          <ServerHubUI
            {...sharedProps}
            onOpenSection={handleSelectSection}
            onOpenSubPage={handleSelectSubPage}
          />
        );
      case 'general':
        return <GeneralUI {...sharedProps} />;
      case 'messaging':
        return <MessagingUI {...sharedProps} />;
      case 'commands':
        return <CommandsUI {...sharedProps} />;
      case 'engagement':
        return <EngagementUI {...sharedProps} />;
      case 'roles':
        return <RolesUI {...sharedProps} />;
      case 'moderation':
        return <ModerationUI {...sharedProps} />;
      case 'social_feeds':
        return <SocialFeedsUI {...sharedProps} />;
      case 'utilities':
        return <UtilitiesUI {...sharedProps} />;
      case 'economy':
        return <EconomyEngineUI {...sharedProps} />;
      default:
        return <ServerHubUI {...sharedProps} onOpenSection={handleSelectSection} />;
    }
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#070a13] text-slate-100">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b0f1c]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-2.5 px-3 py-2.5 sm:px-5 lg:px-6">
          {/* Left: Drawer Toggle + Brand + Guild Selector */}
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="lg:hidden whitespace-nowrap shrink-0 rounded-lg border border-white/15 bg-[#12182b] px-2.5 py-1.5 text-xs font-semibold text-white"
            >
              {sidebarOpen ? 'Close' : 'Menu'}
            </button>

            <button
              type="button"
              onClick={() => handleSelectSection('hub', 'overview')}
              className="flex items-center gap-2 min-w-0 text-left"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
                N
              </span>
              <span className="truncate text-sm sm:text-base font-bold text-white">
                Nexus Dashboard
              </span>
            </button>

            {/* Connected Discord Server Picker */}
            <div className="min-w-0">
              {guilds.length > 0 ? (
                <select
                  aria-label="Select connected Discord server"
                  value={selectedGuildId}
                  onChange={(e) => handleGuildChange(e.target.value)}
                  className="max-w-[200px] sm:max-w-[240px] w-full min-w-0 rounded-lg border border-white/15 bg-[#12182b] px-2.5 py-1.5 text-xs font-medium text-white focus:border-indigo-400 focus:outline-none"
                >
                  {guilds.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="inline-flex items-center rounded-lg border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-200 whitespace-nowrap">
                  {authLoading ? 'Checking Discord...' : 'No Connected Server'}
                </span>
              )}
            </div>
          </div>

          {/* Right: Save/Discard + Discord Login/Account */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {dirty && (
              <>
                <span className="hidden md:inline-flex items-center rounded-full border border-amber-400/30 bg-amber-500/15 px-2.5 py-1 text-[11px] font-medium text-amber-300 whitespace-nowrap">
                  Unsaved changes
                </span>
                <button
                  type="button"
                  onClick={handleDiscard}
                  className="whitespace-nowrap shrink-0 rounded-lg border border-white/15 bg-[#12182b] px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/5"
                >
                  Discard
                </button>
              </>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || configLoading}
              className="whitespace-nowrap shrink-0 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 px-3.5 py-1.5 text-xs font-semibold text-white transition"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>

            {user ? (
              <div className="flex items-center gap-2 shrink-0">
                <span className="hidden sm:inline-flex items-center rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-200 whitespace-nowrap">
                  {user.globalName || user.username}
                </span>
                <button
                  type="button"
                  onClick={handleLogoutDiscord}
                  className="whitespace-nowrap shrink-0 rounded-lg border border-white/15 bg-[#12182b] hover:bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-300"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleLoginDiscord}
                className="whitespace-nowrap shrink-0 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] px-3 py-1.5 text-xs font-semibold text-white transition"
              >
                Login with Discord
              </button>
            )}
          </div>
        </div>

        {/* Top Module Navigation Bar */}
        <nav
          aria-label="Modules"
          className="mx-auto flex max-w-[1600px] items-center gap-1.5 overflow-x-auto border-t border-white/5 px-3 py-2 sm:px-5 lg:px-6"
        >
          {NAV_GROUPS.map((group) => {
            const active = activeSection === group.key;
            return (
              <button
                key={group.key}
                type="button"
                onClick={() => handleSelectSection(group.key)}
                className={`whitespace-nowrap shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-[#101627] text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                {group.topLabel}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Main Workspace */}
      <div className="mx-auto flex min-h-[calc(100vh-6.25rem)] w-full max-w-[1600px] min-w-0">
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-black/65 lg:hidden"
          />
        )}

        <aside
          className={`${
            sidebarOpen ? 'fixed inset-y-0 left-0 z-40 block w-72' : 'hidden'
          } lg:block lg:static lg:w-64 xl:w-72 shrink-0 border-r border-white/10 bg-[#0a0e1a] p-3.5 overflow-y-auto`}
        >
          <div className="mb-3 rounded-xl border border-white/10 bg-[#0f1526] p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Active Server
            </div>
            <div className="mt-1 truncate text-xs font-semibold text-white">
              {activeGuild ? activeGuild.name : 'Not Connected (Sign In Required)'}
            </div>
          </div>

          <div className="space-y-4">
            {NAV_GROUPS.map((group) => (
              <div key={group.key}>
                <div className="px-2 pb-1 text-[10px] font-bold tracking-wider text-slate-400">
                  {group.label}
                </div>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const selected =
                      activeSection === group.key && activeSubPage === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectSubPage(item.id, group.key)}
                        className={`w-full text-left rounded-lg px-2.5 py-1.5 text-xs transition ${
                          selected
                            ? 'bg-indigo-600/25 text-indigo-200 font-semibold border border-indigo-400/30'
                            : 'text-slate-300 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main className="flex-1 min-w-0 w-full max-w-full overflow-x-hidden">
          {configLoading ? (
            <div className="p-6 text-xs sm:text-sm text-slate-400">
              Loading server configuration...
            </div>
          ) : (
            renderActivePage()
          )}
        </main>
      </div>

      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-50 max-w-xs sm:max-w-sm rounded-xl border px-4 py-2.5 text-xs font-medium shadow-xl ${
            toast.type === 'error'
              ? 'border-rose-500/40 bg-rose-950/95 text-rose-200'
              : toast.type === 'success'
              ? 'border-emerald-500/40 bg-emerald-950/95 text-emerald-200'
              : 'border-indigo-500/40 bg-[#111625]/95 text-indigo-200'
          }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}
