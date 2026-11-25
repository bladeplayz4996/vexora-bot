import React, { useState } from 'react';

const NAV_SECTIONS = [
  {
    id: 'general',
    label: 'General',
    items: [
      { id: 'overview', label: 'Server Overview' },
      { id: 'settings', label: 'Prefix & Locale' },
      { id: 'profile', label: 'Custom Bot Profile' },
      { id: 'role_connections', label: 'Role Connections' },
    ],
  },
  {
    id: 'messaging',
    label: 'Messaging',
    items: [
      { id: 'announcements', label: 'Join / Leave / Boost' },
      { id: 'message_builder', label: 'Embed & Action Builder' },
      { id: 'auto_responders', label: 'Auto-Responders & Threads' },
      { id: 'ticketing', label: 'Ticketing & Tags' },
    ],
  },
  {
    id: 'commands',
    label: 'Commands',
    items: [
      { id: 'custom_commands', label: 'Custom Commands' },
      { id: 'command_overrides', label: 'Permissions & Cooldowns' },
    ],
  },
  {
    id: 'engagement',
    label: 'Engagement',
    items: [
      { id: 'leveling', label: 'XP & Role Rewards' },
      { id: 'temp_voice', label: 'Temp Voice & Stats VC' },
      { id: 'starboard_birthdays', label: 'Starboard & Birthdays' },
    ],
  },
  {
    id: 'roles',
    label: 'Roles',
    items: [
      { id: 'auto_persistent_roles', label: 'Auto, Temp & Persistent' },
      { id: 'reaction_roles', label: 'Reaction Panels & Factions' },
    ],
  },
  {
    id: 'moderation',
    label: 'Moderation & Security',
    items: [
      { id: 'anti_nuke_backups', label: 'Anti-Nuke & Backups' },
      { id: 'raid_automod', label: 'Join Gate & Heat AutoMod' },
      { id: 'cases_warnings', label: 'Cases & Warnings' },
    ],
  },
  {
    id: 'social_feeds',
    label: 'Social Feeds',
    items: [
      { id: 'youtube_twitch', label: 'YouTube & Twitch Feeds' },
    ],
  },
  {
    id: 'utilities',
    label: 'Utilities',
    items: [
      { id: 'utility_toggles', label: 'Honeypot, LoveCalc & Logs' },
    ],
  },
  {
    id: 'economy',
    label: 'Economy & Shop',
    items: [
      { id: 'economy_rules', label: 'Currency, Work, Crime & Rob' },
      { id: 'shop_builder', label: 'Shop & Role Pickers' },
      { id: 'user_balances', label: 'Balances & Audit Log' },
    ],
  },
];

export default function SidebarNavUI({
  activeSection = 'general',
  activeSubPage = 'overview',
  onSelectNav = () => {},
}) {
  const [expandedSections, setExpandedSections] = useState(() =>
    NAV_SECTIONS.reduce((acc, sec) => ({ ...acc, [sec.id]: true }), {})
  );

  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  return (
    <aside className="w-64 shrink-0 border-r border-slate-800 bg-slate-950 p-3">
      <nav aria-label="Dashboard Sections" className="space-y-1.5">
        {NAV_SECTIONS.map((section) => {
          const isOpen = expandedSections[section.id] ?? true;
          const isSectionActive = activeSection === section.id;

          return (
            <div key={section.id} className="rounded-lg">
              <button
                type="button"
                onClick={() => {
                  toggleSection(section.id);
                  if (section.items[0]) {
                    onSelectNav(section.id, section.items[0].id);
                  }
                }}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                  isSectionActive
                    ? 'bg-indigo-600/15 text-indigo-300'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <span>{section.label}</span>
                <span className="text-[10px]">{isOpen ? '▾' : '▸'}</span>
              </button>

              {isOpen && (
                <div className="mt-0.5 space-y-0.5 pl-2">
                  {section.items.map((sub) => {
                    const active = isSectionActive && activeSubPage === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => onSelectNav(section.id, sub.id)}
                        className={`flex w-full items-center rounded-md px-2.5 py-1.5 text-left text-xs font-medium transition ${
                          active
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                        }`}
                      >
                        {sub.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
