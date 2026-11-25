import React, { useState, useEffect, useCallback } from 'react';
import TopbarUI from './layout/topbar_ui.jsx';
import SidebarNavUI from './layout/sidebar_nav_ui.jsx';
import GeneralUI from './pages/general_ui.jsx';
import MessagingUI from './pages/messaging_ui.jsx';
import CommandsUI from './pages/commands_ui.jsx';
import EngagementUI from './pages/engagement_ui.jsx';
import RolesUI from './pages/roles_ui.jsx';
import ModerationUI from './pages/moderation_ui.jsx';
import SocialFeedsUI from './pages/social_feeds_ui.jsx';
import UtilitiesUI from './pages/utilities_ui.jsx';
import EconomyEngineUI from './pages/economy_engine_ui.jsx';

const DEFAULT_GUILD_CONFIG = {
  settings: {
    prefix: '!',
    language: 'en-US',
    timezone: 'Asia/Kolkata',
    adminRoleIds: [],
    staffRoleIds: [],
  },
  customProfile: {
    botName: 'Vexora',
    avatarUrl: '',
    bio: '',
    statusText: 'Watching {server.name}',
    activityType: 'watching',
  },
  roleConnections: {
    enabled: false,
    linkedRoles: [],
  },
  messaging: {
    announcements: {},
    autoResponders: [],
    ticketing: { enabled: false, supportRoleIds: [], transcriptChannelId: null },
  },
  commands: {
    customCommands: [],
    overrides: {},
  },
  engagement: {
    leveling: {
      enabled: true,
      xpMin: 15,
      xpMax: 25,
      xpCooldownSeconds: 45,
      levelUpChannelId: null,
      levelUpTemplate: '🎉 {user.mention} reached **Level {level}** with **{xp} XP**!',
    },
    tempVoice: { enabled: false, generatorChannelId: null, nameTemplate: "{user.username}'s Room" },
    starboard: { enabled: false, emoji: '⭐', threshold: 3, channelId: null },
    birthdays: { enabled: false, channelId: null, roleId: null },
  },
  roles: {
    autoRoles: [],
    persistentRolesEnabled: true,
    factions: [],
  },
  securityModeration: {
    antiNuke: { enabled: true, autoRestoreOnNuke: false, logChannelId: null },
    joinGate: {
      enabled: true,
      minAccountAgeHours: 24,
      raidThresholdJoins: 8,
      raidWindowSeconds: 10,
      raidAction: 'kick',
    },
    automod: {
      enabled: true,
      heatThreshold: 100,
      maxMentions: 5,
      blockDiscordInvites: true,
      blockPhishingLinks: true,
      modLogChannelId: null,
    },
  },
  socialFeeds: { youtube: [], twitch: [] },
  utilities: { loveCalcEnabled: true, honeypotChannelId: null, auditLogChannelId: null },
};

const DEFAULT_ECONOMY_CONFIG = {
  enabled: true,
  currencyName: 'Coins',
  currencySymbol: '🪙',
  startingWallet: 250,
  maxBankCapacity: 100000,
  work: { min: 80, max: 220, cooldownSeconds: 1800 },
  crime: { min: 250, max: 650, fineMin: 120, fineMax: 300, successRate: 0.55, cooldownSeconds: 3600 },
  rob: { successRate: 0.4, maxStealPercent: 0.35, fineAmount: 200, cooldownSeconds: 3600 },
};

export default function DashboardApp({ apiBase = '' }) {
  const [user, setUser] = useState(null);
  const [guilds, setGuilds] = useState([]);
  const [selectedGuildId, setSelectedGuildId] = useState('');

  const [activeSection, setActiveSection] = useState('general');
  const [activeSubPage, setActiveSubPage] = useState('overview');

  const [draftConfig, setDraftConfig] = useState(DEFAULT_GUILD_CONFIG);
  const [savedConfig, setSavedConfig] = useState(DEFAULT_GUILD_CONFIG);

  const [economyConfig, setEconomyConfig] = useState(DEFAULT_ECONOMY_CONFIG);
  const [shopItems, setShopItems] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [economyLogs, setEconomyLogs] = useState([]);

  const [cases, setCases] = useState([]);
  const [backups, setBackups] = useState([]);

  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((type, text) => {
    setToast({ type, text });
    setTimeout(() => {
      setToast((prev) => (prev?.text === text ? null : prev));
    }, 3500);
  }, []);

  const hasUnsavedChanges =
    JSON.stringify(draftConfig) !== JSON.stringify(savedConfig);

  // Load session & manageable guilds
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`${apiBase}/api/auth/me`, { credentials: 'include' });
        const data = await res.json();
        if (!active) return;
        if (data?.authenticated && data.user) {
          setUser(data.user);
          const gList = Array.isArray(data.guilds) ? data.guilds : [];
          setGuilds(gList);
          if (gList.length > 0) {
            setSelectedGuildId((prev) => prev || gList[0].id);
          }
        } else {
          // Local preview guild fallback when unauthenticated
          const previewGuilds = [
            {
              id: 'preview_guild_1',
              name: 'Vexora HQ (Preview)',
              icon: null,
              owner: true,
              botInGuild: true,
              channels: [
                { id: 'ch_welcome', name: 'welcome', type: 0 },
                { id: 'ch_logs', name: 'mod-logs', type: 0 },
                { id: 'ch_vc_gen', name: 'Join to Create VC', type: 2 },
              ],
              roles: [
                { id: 'role_admin', name: 'Admin', color: '#ED4245' },
                { id: 'role_mod', name: 'Moderator', color: '#5865F2' },
                { id: 'role_vip', name: 'VIP Member', color: '#57F287' },
              ],
            },
          ];
          setGuilds(previewGuilds);
          setSelectedGuildId('preview_guild_1');
        }
      } catch {
        // Ignore network errors during standalone UI rendering
      }
    })();
    return () => {
      active = false;
    };
  }, [apiBase]);

  // Load guild config, moderation & economy data when selectedGuildId changes
  const loadGuildWorkspace = useCallback(
    async (guildId) => {
      if (!guildId || guildId.startsWith('preview_')) return;

      try {
        const [cfgRes, modRes, ecoRes] = await Promise.all([
          fetch(`${apiBase}/api/guilds/${guildId}/config`, { credentials: 'include' }),
          fetch(`${apiBase}/api/guilds/${guildId}/moderation`, { credentials: 'include' }),
          fetch(`${apiBase}/api/economy/${guildId}`, { credentials: 'include' }),
        ]);

        if (cfgRes.ok) {
          const cfgData = await cfgRes.json();
          if (cfgData?.config) {
            const merged = { ...DEFAULT_GUILD_CONFIG, ...cfgData.config };
            setDraftConfig(merged);
            setSavedConfig(merged);
          }
        }

        if (modRes.ok) {
          const modData = await modRes.json();
          setCases(modData.cases || []);
          setBackups(modData.backups || []);
        }

        if (ecoRes.ok) {
          const ecoData = await ecoRes.json();
          if (ecoData.config) setEconomyConfig({ ...DEFAULT_ECONOMY_CONFIG, ...ecoData.config });
          setShopItems(ecoData.items || []);
          setWallets(ecoData.wallets || []);
          setEconomyLogs(ecoData.logs || []);
        }
      } catch (err) {
        console.error('[Workspace Load Error]', err);
      }
    },
    [apiBase]
  );

  useEffect(() => {
    if (selectedGuildId) {
      loadGuildWorkspace(selectedGuildId);
    }
  }, [selectedGuildId, loadGuildWorkspace]);

  const handleLogin = async () => {
    try {
      const res = await fetch(`${apiBase}/api/auth/login`, { credentials: 'include' });
      const data = await res.json();
      if (data?.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch {
      showToast('error', 'Could not start Discord OAuth login.');
    }
  };

  const handleLogout = async () => {
    await fetch(`${apiBase}/api/auth/logout`, { method: 'POST', credentials: 'include' }).catch(
      () => {}
    );
    setUser(null);
    showToast('info', 'Logged out of Vexora Studio.');
  };

  const handleSaveChanges = async () => {
    if (!selectedGuildId || selectedGuildId.startsWith('preview_')) {
      setSavedConfig(draftConfig);
      showToast('success', 'Saved changes to local preview state.');
      return;
    }

    setIsSaving(true);
    try {
      const [guildPut, ecoPut] = await Promise.all([
        fetch(`${apiBase}/api/guilds/${selectedGuildId}/config`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ config: draftConfig }),
        }),
        fetch(`${apiBase}/api/economy/${selectedGuildId}/config`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ config: economyConfig }),
        }),
      ]);

      if (!guildPut.ok) {
        const errBody = await guildPut.json().catch(() => ({}));
        throw new Error(errBody.error || 'Failed to save guild config');
      }

      const updatedGuild = await guildPut.json();
      const nextSaved = { ...DEFAULT_GUILD_CONFIG, ...(updatedGuild.config || draftConfig) };
      setDraftConfig(nextSaved);
      setSavedConfig(nextSaved);

      if (ecoPut.ok) {
        const updatedEco = await ecoPut.json();
        if (updatedEco.config) {
          setEconomyConfig({ ...DEFAULT_ECONOMY_CONFIG, ...updatedEco.config });
        }
      }

      showToast('success', 'Configuration saved & synced with Vexora.');
    } catch (err) {
      showToast('error', err.message || 'Save failed.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardChanges = () => {
    setDraftConfig(savedConfig);
    showToast('info', 'Discarded unsaved changes.');
  };

  const handleSaveShopItem = async (newItem) => {
    if (!selectedGuildId || selectedGuildId.startsWith('preview_')) {
      const localItem = {
        ...newItem,
        itemId: `local_${Date.now().toString(36)}`,
      };
      setShopItems((prev) => [localItem, ...prev]);
      showToast('success', `Added "${newItem.name}" to preview shop.`);
      return;
    }

    const res = await fetch(`${apiBase}/api/economy/${selectedGuildId}/shop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(newItem),
    });
    const data = await res.json();
    if (data?.ok && data.item) {
      setShopItems((prev) => [data.item, ...prev]);
      showToast('success', `Saved shop item "${data.item.name}".`);
    } else {
      showToast('error', data?.error || 'Could not save shop item.');
    }
  };

  const handleDeleteShopItem = async (itemId) => {
    if (!selectedGuildId || selectedGuildId.startsWith('preview_')) {
      setShopItems((prev) => prev.filter((i) => (i.itemId || i.id) !== itemId));
      return;
    }

    const res = await fetch(`${apiBase}/api/economy/${selectedGuildId}/shop/${itemId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok) {
      setShopItems((prev) => prev.filter((i) => (i.itemId || i.id) !== itemId));
      showToast('success', 'Removed shop item.');
    }
  };

  const handleAdjustBalance = async (payload) => {
    if (!selectedGuildId || selectedGuildId.startsWith('preview_')) {
      showToast('info', 'Connect a live guild to adjust real member wallets.');
      return;
    }

    const res = await fetch(`${apiBase}/api/economy/${selectedGuildId}/balances/adjust`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data?.ok) {
      showToast('success', `Updated ${payload.bucket} for ${payload.userId}.`);
      loadGuildWorkspace(selectedGuildId);
    } else {
      showToast('error', data?.error || 'Balance adjustment failed.');
    }
  };

  const handleTriggerBackup = async (payload) => {
    if (!selectedGuildId || selectedGuildId.startsWith('preview_')) {
      showToast('info', 'Backup snapshots require a live Discord guild connection.');
      return;
    }

    const res = await fetch(`${apiBase}/api/guilds/${selectedGuildId}/backups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data?.ok) {
      showToast(
        'success',
        payload.action === 'restore' ? 'Snapshot restore completed.' : 'Server snapshot created.'
      );
      loadGuildWorkspace(selectedGuildId);
    } else {
      showToast('error', data?.error || 'Backup operation failed.');
    }
  };

  const activeGuild = guilds.find((g) => g.id === selectedGuildId) || null;
  const channels = activeGuild?.channels || [];
  const roles = activeGuild?.roles || [];

  const renderActivePage = () => {
    switch (activeSection) {
      case 'general':
        return (
          <GeneralUI
            activeSubPage={activeSubPage}
            config={draftConfig}
            guildMeta={activeGuild}
            roles={roles}
            onChangeConfig={setDraftConfig}
          />
        );
      case 'messaging':
        return (
          <MessagingUI
            activeSubPage={activeSubPage}
            config={draftConfig}
            channels={channels}
            roles={roles}
            guildMeta={activeGuild}
            onChangeConfig={setDraftConfig}
          />
        );
      case 'commands':
        return (
          <CommandsUI
            activeSubPage={activeSubPage}
            config={draftConfig}
            onChangeConfig={setDraftConfig}
          />
        );
      case 'engagement':
        return (
          <EngagementUI
            activeSubPage={activeSubPage}
            config={draftConfig}
            channels={channels}
            roles={roles}
            onChangeConfig={setDraftConfig}
          />
        );
      case 'roles':
        return (
          <RolesUI
            activeSubPage={activeSubPage}
            config={draftConfig}
            roles={roles}
            onChangeConfig={setDraftConfig}
          />
        );
      case 'moderation':
        return (
          <ModerationUI
            activeSubPage={activeSubPage}
            config={draftConfig}
            channels={channels}
            cases={cases}
            backups={backups}
            onChangeConfig={setDraftConfig}
            onTriggerBackup={handleTriggerBackup}
          />
        );
      case 'social_feeds':
        return (
          <SocialFeedsUI
            config={draftConfig}
            channels={channels}
            roles={roles}
            onChangeConfig={setDraftConfig}
          />
        );
      case 'utilities':
        return (
          <UtilitiesUI
            config={draftConfig}
            channels={channels}
            onChangeConfig={setDraftConfig}
          />
        );
      case 'economy':
        return (
          <EconomyEngineUI
            activeSubPage={activeSubPage}
            economyConfig={economyConfig}
            shopItems={shopItems}
            wallets={wallets}
            logs={economyLogs}
            roles={roles}
            onChangeEconomyConfig={setEconomyConfig}
            onSaveShopItem={handleSaveShopItem}
            onDeleteShopItem={handleDeleteShopItem}
            onAdjustBalance={handleAdjustBalance}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <TopbarUI
        user={user}
        guilds={guilds}
        selectedGuildId={selectedGuildId}
        onSelectGuild={(id) => {
          if (hasUnsavedChanges && !window.confirm('Discard unsaved changes before switching server?')) {
            return;
          }
          setSelectedGuildId(id);
        }}
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
        onSave={handleSaveChanges}
        onDiscard={handleDiscardChanges}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 rounded-xl border px-4 py-2.5 text-xs font-medium shadow-xl ${
            toast.type === 'error'
              ? 'border-rose-500/40 bg-rose-950/90 text-rose-200'
              : toast.type === 'success'
              ? 'border-emerald-500/40 bg-emerald-950/90 text-emerald-200'
              : 'border-indigo-500/40 bg-slate-900/95 text-indigo-200'
          }`}
        >
          {toast.text}
        </div>
      )}

      <div className="flex min-h-[calc(100vh-4rem)]">
        <SidebarNavUI
          activeSection={activeSection}
          activeSubPage={activeSubPage}
          onSelectNav={(sec, sub) => {
            setActiveSection(sec);
            setActiveSubPage(sub);
          }}
        />

        <main className="min-w-0 flex-1 p-6">
          <div className="mx-auto max-w-6xl">{renderActivePage()}</div>
        </main>
      </div>
    </div>
  );
}
