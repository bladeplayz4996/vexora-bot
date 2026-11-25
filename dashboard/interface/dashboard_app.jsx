import React, { useState, useEffect } from 'react';
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
    defaultSubPage: 'overview',
    items: [{ id: 'overview', label: 'Nexus Hub' }],
  },
  {
    key: 'general',
    label: 'GENERAL',
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
    defaultSubPage: 'custom-commands',
    items: [
      { id: 'custom-commands', label: 'Custom Commands' },
      { id: 'permissions-cooldowns', label: 'Permissions & Cooldowns' },
    ],
  },
  {
    key: 'engagement',
    label: 'ENGAGEMENT',
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
    defaultSubPage: 'auto-temp-persistent',
    items: [
      { id: 'auto-temp-persistent', label: 'Auto, Temp & Persistent' },
      { id: 'reaction-panels', label: 'Reaction Panels & Factions' },
    ],
  },
  {
    key: 'moderation',
    label: 'MODERATION & SECURITY',
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
    defaultSubPage: 'feeds',
    items: [{ id: 'feeds', label: 'YouTube & Twitch Feeds' }],
  },
  {
    key: 'utilities',
    label: 'UTILITIES',
    defaultSubPage: 'honeypot-lovecalc-logs',
    items: [{ id: 'honeypot-lovecalc-logs', label: 'Honeypot, LoveCalc & Logs' }],
  },
  {
    key: 'economy',
    label: 'ECONOMY & SHOP',
    defaultSubPage: 'currency-work-crime',
    items: [
      { id: 'currency-work-crime', label: 'Currency, Work, Crime & Rob' },
      { id: 'shop-role-pickers', label: 'Shop & Role Pickers' },
      { id: 'balances-audit', label: 'Balances & Audit Log' },
    ],
  },
];

export default function DashboardApp() {
  const [config, setConfig] = useState({});
  const [activeSection, setActiveSection] = useState('hub');
  const [activeSubPage, setActiveSubPage] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const notify = (text, type = 'info') => {
    setToast({ text, type });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleUpdateConfig = (nextConfig) => {
    setConfig(nextConfig);
    setDirty(true);
  };

  const handleDiscard = () => {
    setDirty(false);
    notify('Discarded unsaved changes.', 'info');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error('Failed to save');
      setDirty(false);
      notify('Configuration saved.', 'success');
    } catch {
      notify('Could not save config right now.', 'error');
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
      const foundGroup = NAV_GROUPS.find((g) =>
        g.items.some((item) => item.id === subPageId)
      );
      if (foundGroup) setActiveSection(foundGroup.key);
    }
    setSidebarOpen(false);
  };

  const sharedProps = {
    config,
    onChangeConfig: handleUpdateConfig,
    activeSubPage,
    onChangeSubPage: (sub) => handleSelectSubPage(sub, activeSection),
    onNotify: notify,
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
      {/* Top Bar */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b0f1c]/95 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 sm:px-5">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="lg:hidden whitespace-nowrap shrink-0 rounded-lg border border-white/15 bg-[#12182b] px-2.5 py-1.5 text-xs font-semibold text-white"
            >
              {sidebarOpen ? 'Close' : 'Menu'}
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
                N
              </span>
              <span className="truncate text-sm font-bold text-white">
                Nexus Dashboard
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {dirty && (
              <>
                <span className="hidden sm:inline whitespace-nowrap rounded-full bg-amber-500/15 border border-amber-400/30 px-2.5 py-1 text-[11px] font-medium text-amber-300">
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
              disabled={saving}
              className="whitespace-nowrap shrink-0 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 px-3 py-1.5 text-xs font-semibold text-white"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Quick Top Module Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto border-t border-white/5 px-3 py-2 sm:px-5">
          {NAV_GROUPS.map((group) => {
            const isActive = activeSection === group.key;
            return (
              <button
                key={group.key}
                type="button"
                onClick={() => handleSelectSection(group.key)}
                className={`whitespace-nowrap shrink-0 rounded-lg px-3 py-1 text-xs font-medium transition ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'bg-[#101627] text-slate-300 hover:bg-white/5'
                }`}
              >
                {group.items[0]?.label || group.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Body Layout: Drawer on Mobile, Fixed Sidebar on Desktop */}
      <div className="relative flex min-h-[calc(100vh-6rem)] w-full max-w-full min-w-0">
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          />
        )}

        <aside
          className={`${
            sidebarOpen ? 'fixed inset-y-0 left-0 z-40 block w-64' : 'hidden'
          } lg:block lg:static lg:w-64 shrink-0 border-r border-white/10 bg-[#0a0e1a] p-3 overflow-y-auto`}
        >
          <div className="space-y-4">
            {NAV_GROUPS.map((group) => (
              <div key={group.key}>
                <div className="px-2 pb-1 text-[10px] font-bold tracking-wider text-slate-400">
                  {group.label}
                </div>
                <div className="space-y-0.5">
                  {group.items.map((sub) => {
                    const selected =
                      activeSection === group.key && activeSubPage === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => handleSelectSubPage(sub.id, group.key)}
                        className={`w-full text-left rounded-lg px-2.5 py-1.5 text-xs transition ${
                          selected
                            ? 'bg-indigo-600/25 text-indigo-200 font-semibold border border-indigo-400/30'
                            : 'text-slate-300 hover:bg-white/5'
                        }`}
                      >
                        {sub.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main className="flex-1 min-w-0 w-full max-w-full overflow-x-hidden">
          {renderActivePage()}
        </main>
      </div>

      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-50 max-w-xs rounded-xl border px-4 py-2.5 text-xs font-medium shadow-xl ${
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
