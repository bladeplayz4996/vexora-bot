import React, { useState } from 'react';
import EmbedBuilderUI from '../shared/embed_builder_ui.jsx';

export default function MessagingUI({
  activeSubPage = 'announcements',
  config = {},
  channels = [],
  roles = [],
  guildMeta = null,
  onChangeConfig = () => {},
}) {
  const [selectedEvent, setSelectedEvent] = useState('join');

  const messaging = config.messaging || {};
  const announcements = messaging.announcements || {};
  const currentAnn = announcements[selectedEvent] || {
    enabled: false,
    channelId: null,
    dmEnabled: false,
    imageCardEnabled: false,
    payload: { mode: 'embed', content: '', embed: { color: '#5865F2', title: '', description: '' } },
    dmPayload: { mode: 'plain', content: 'Welcome to {server.name}, {user.mention}!' },
  };

  const updateMessaging = (patch) =>
    onChangeConfig({ ...config, messaging: { ...messaging, ...patch } });

  const updateAnnouncement = (eventKey, patch) => {
    updateMessaging({
      announcements: {
        ...announcements,
        [eventKey]: {
          ...(announcements[eventKey] || {}),
          ...patch,
        },
      },
    });
  };

  const addAutoResponder = () => {
    const list = messaging.autoResponders || [];
    updateMessaging({
      autoResponders: [
        ...list,
        {
          id: `ar_${Date.now().toString(36)}`,
          trigger: 'ping',
          matchMode: 'exact',
          responsePayload: { mode: 'plain', content: 'Pong! Latency is {ping}ms.' },
        },
      ],
    });
  };

  const updateAutoResponder = (idx, patch) => {
    const next = (messaging.autoResponders || []).map((item, i) =>
      i === idx ? { ...item, ...patch } : item
    );
    updateMessaging({ autoResponders: next });
  };

  const removeAutoResponder = (idx) => {
    const next = (messaging.autoResponders || []).filter((_, i) => i !== idx);
    updateMessaging({ autoResponders: next });
  };

  if (activeSubPage === 'auto_responders') {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Auto-Responders</h2>
            <p className="text-xs text-slate-400">
              Trigger automatic replies on exact, prefix, or substring matches.
            </p>
          </div>
          <button
            type="button"
            onClick={addAutoResponder}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
          >
            + Add Auto-Responder
          </button>
        </div>

        <div className="space-y-3">
          {(messaging.autoResponders || []).map((ar, idx) => (
            <div
              key={ar.id || idx}
              className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <input
                  type="text"
                  value={ar.trigger}
                  onChange={(e) => updateAutoResponder(idx, { trigger: e.target.value })}
                  placeholder="Trigger phrase"
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
                />
                <select
                  value={ar.matchMode}
                  onChange={(e) => updateAutoResponder(idx, { matchMode: e.target.value })}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
                >
                  <option value="contains">Contains</option>
                  <option value="exact">Exact Match</option>
                  <option value="startswith">Starts With</option>
                </select>
                <button
                  type="button"
                  onClick={() => removeAutoResponder(idx)}
                  className="rounded-lg bg-rose-500/15 px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/25"
                >
                  Delete Trigger
                </button>
              </div>
              <input
                type="text"
                value={ar.responsePayload?.content || ''}
                onChange={(e) =>
                  updateAutoResponder(idx, {
                    responsePayload: {
                      ...(ar.responsePayload || { mode: 'plain' }),
                      content: e.target.value,
                    },
                  })
                }
                placeholder="Response message..."
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeSubPage === 'ticketing') {
    const ticketing = messaging.ticketing || {
      enabled: false,
      categoryId: null,
      supportRoleIds: [],
      transcriptChannelId: null,
      welcomePayload: {},
    };

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Ticketing System</h2>
            <p className="text-xs text-slate-400">
              Configure support ticket channels, staff roles, and transcript logs.
            </p>
          </div>
          <label className="flex items-center gap-2 text-xs font-medium text-slate-200">
            <input
              type="checkbox"
              checked={Boolean(ticketing.enabled)}
              onChange={(e) =>
                updateMessaging({ ticketing: { ...ticketing, enabled: e.target.checked } })
              }
            />
            Enable Tickets
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">
              Transcript Log Channel
            </label>
            <select
              value={ticketing.transcriptChannelId || ''}
              onChange={(e) =>
                updateMessaging({
                  ticketing: { ...ticketing, transcriptChannelId: e.target.value || null },
                })
              }
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
            >
              <option value="">None</option>
              {channels.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  #{ch.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">
              Support Role
            </label>
            <select
              value={ticketing.supportRoleIds?.[0] || ''}
              onChange={(e) =>
                updateMessaging({
                  ticketing: {
                    ...ticketing,
                    supportRoleIds: e.target.value ? [e.target.value] : [],
                  },
                })
              }
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
            >
              <option value="">None</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">
            {activeSubPage === 'message_builder'
              ? 'Message & Embed Builder'
              : 'Server Event Announcements'}
          </h2>
          <p className="text-xs text-slate-400">
            Design join, leave, ban, and boost alerts with live preview and dynamic variables.
          </p>
        </div>

        <div className="flex rounded-lg border border-slate-700 bg-slate-950 p-0.5">
          {['join', 'leave', 'ban', 'boost'].map((ev) => (
            <button
              key={ev}
              type="button"
              onClick={() => setSelectedEvent(ev)}
              className={`rounded-md px-3 py-1 text-xs font-medium capitalize ${
                selectedEvent === ev
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {ev}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <label className="flex items-center gap-2 text-xs font-semibold text-white">
          <input
            type="checkbox"
            checked={Boolean(currentAnn.enabled)}
            onChange={(e) => updateAnnouncement(selectedEvent, { enabled: e.target.checked })}
          />
          Enable {selectedEvent.toUpperCase()} Alert
        </label>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-300">Channel:</span>
          <select
            value={currentAnn.channelId || ''}
            onChange={(e) =>
              updateAnnouncement(selectedEvent, { channelId: e.target.value || null })
            }
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
          >
            <option value="">Select channel...</option>
            {channels.map((ch) => (
              <option key={ch.id} value={ch.id}>
                #{ch.name}
              </option>
            ))}
          </select>
        </div>

        {selectedEvent === 'join' && (
          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={Boolean(currentAnn.dmEnabled)}
              onChange={(e) => updateAnnouncement('join', { dmEnabled: e.target.checked })}
            />
            Send Welcome DM
          </label>
        )}
      </div>

      <EmbedBuilderUI
        value={currentAnn.payload}
        serverName={guildMeta?.name || 'Server Name'}
        onChange={(nextPayload) =>
          updateAnnouncement(selectedEvent, { payload: nextPayload })
        }
      />
    </div>
  );
}
