import React from 'react';
import swatchesData from '../../../data/assets/presets_and_swatches.json';

const VARIABLE_CHIPS = [
  '{user.mention}',
  '{user.username}',
  '{user.tag}',
  '{user.id}',
  '{server.name}',
  '{member.count}',
  '{server.boosts}',
  '{wallet}',
  '{bank}',
  '{level}',
  '{xp}',
  '{case.id}',
];

export default function EmbedBuilderUI({
  value = {
    mode: 'embed',
    content: '',
    embed: {
      color: '#5865F2',
      author: { name: '', url: '', iconUrl: '' },
      title: '',
      titleUrl: '',
      description: '',
      fields: [],
      thumbnailUrl: '',
      imageUrl: '',
      footer: { text: '', iconUrl: '' },
      timestamp: false,
    },
  },
  onChange = () => {},
  serverName = 'Server Name',
}) {
  const payload = {
    mode: value?.mode || 'embed',
    content: value?.content || '',
    embed: {
      color: value?.embed?.color || '#5865F2',
      author: {
        name: value?.embed?.author?.name || '',
        url: value?.embed?.author?.url || '',
        iconUrl: value?.embed?.author?.iconUrl || '',
      },
      title: value?.embed?.title || '',
      titleUrl: value?.embed?.titleUrl || '',
      description: value?.embed?.description || '',
      fields: Array.isArray(value?.embed?.fields) ? value.embed.fields : [],
      thumbnailUrl: value?.embed?.thumbnailUrl || '',
      imageUrl: value?.embed?.imageUrl || '',
      footer: {
        text: value?.embed?.footer?.text || '',
        iconUrl: value?.embed?.footer?.iconUrl || '',
      },
      timestamp: Boolean(value?.embed?.timestamp),
    },
  };

  const updateRoot = (patch) => onChange({ ...payload, ...patch });
  const updateEmbed = (patch) =>
    onChange({ ...payload, embed: { ...payload.embed, ...patch } });

  const insertVariable = (token) => {
    if (payload.mode === 'plain') {
      updateRoot({ content: `${payload.content}${payload.content ? ' ' : ''}${token}` });
    } else {
      updateEmbed({
        description: `${payload.embed.description}${payload.embed.description ? ' ' : ''}${token}`,
      });
    }
  };

  const addField = () => {
    updateEmbed({
      fields: [...payload.embed.fields, { name: 'Field Title', value: 'Field value', inline: false }],
    });
  };

  const updateField = (idx, patch) => {
    const nextFields = payload.embed.fields.map((f, i) => (i === idx ? { ...f, ...patch } : f));
    updateEmbed({ fields: nextFields });
  };

  const removeField = (idx) => {
    updateEmbed({ fields: payload.embed.fields.filter((_, i) => i !== idx) });
  };

  const swatchColors = swatchesData?.embedColors || [
    { name: 'Blurple', hex: '#5865F2' },
    { name: 'Emerald', hex: '#57F287' },
    { name: 'Gold', hex: '#FEE75C' },
    { name: 'Crimson', hex: '#ED4245' },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Editor Column */}
      <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4 lg:col-span-7">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Message & Embed Editor
          </span>
          <div className="flex rounded-lg border border-slate-700 bg-slate-950 p-0.5">
            {['plain', 'embed'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => updateRoot({ mode: m })}
                className={`rounded-md px-3 py-1 text-xs font-medium capitalize ${
                  payload.mode === m ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Variable Chips */}
        <div>
          <p className="mb-1.5 text-[11px] font-medium text-slate-400">Click to insert variable:</p>
          <div className="flex flex-wrap gap-1.5">
            {VARIABLE_CHIPS.map((token) => (
              <button
                key={token}
                type="button"
                onClick={() => insertVariable(token)}
                className="rounded border border-slate-700 bg-slate-800/80 px-2 py-0.5 font-mono text-[11px] text-indigo-300 hover:border-indigo-500 hover:bg-slate-800"
              >
                {token}
              </button>
            ))}
          </div>
        </div>

        {/* Plain Content */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-300">Message Content</label>
          <textarea
            rows={2}
            value={payload.content}
            onChange={(e) => updateRoot({ content: e.target.value })}
            placeholder="Optional message text above embed (or main text in plain mode)..."
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
          />
        </div>

        {payload.mode === 'embed' && (
          <>
            {/* Color Swatches + HEX */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Accent Color</label>
              <div className="flex flex-wrap items-center gap-2">
                {swatchColors.map((sw) => (
                  <button
                    key={sw.hex}
                    type="button"
                    title={sw.name}
                    onClick={() => updateEmbed({ color: sw.hex })}
                    style={{ backgroundColor: sw.hex }}
                    className={`h-6 w-6 rounded-full border ${
                      payload.embed.color.toUpperCase() === sw.hex.toUpperCase()
                        ? 'scale-110 border-white ring-2 ring-indigo-400'
                        : 'border-slate-700'
                    }`}
                  />
                ))}
                <input
                  type="text"
                  value={payload.embed.color}
                  onChange={(e) => updateEmbed({ color: e.target.value })}
                  className="w-28 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 font-mono text-xs text-white"
                />
              </div>
            </div>

            {/* Title & Description */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">Embed Title</label>
                <input
                  type="text"
                  value={payload.embed.title}
                  onChange={(e) => updateEmbed({ title: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">Thumbnail URL</label>
                <input
                  type="text"
                  value={payload.embed.thumbnailUrl}
                  onChange={(e) => updateEmbed({ thumbnailUrl: e.target.value })}
                  placeholder="{user.avatar}"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Description</label>
              <textarea
                rows={4}
                value={payload.embed.description}
                onChange={(e) => updateEmbed({ description: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>

            {/* Fields */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-300">Fields</span>
                <button
                  type="button"
                  onClick={addField}
                  className="rounded-md bg-slate-800 px-2.5 py-1 text-xs font-medium text-indigo-300 hover:bg-slate-700"
                >
                  + Add Field
                </button>
              </div>
              {payload.embed.fields.map((field, idx) => (
                <div key={idx} className="grid grid-cols-1 gap-2 rounded-lg border border-slate-800 bg-slate-950 p-2.5 sm:grid-cols-12">
                  <input
                    type="text"
                    value={field.name}
                    onChange={(e) => updateField(idx, { name: e.target.value })}
                    placeholder="Field name"
                    className="rounded border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-white sm:col-span-4"
                  />
                  <input
                    type="text"
                    value={field.value}
                    onChange={(e) => updateField(idx, { value: e.target.value })}
                    placeholder="Field value"
                    className="rounded border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-white sm:col-span-5"
                  />
                  <label className="flex items-center gap-1.5 text-xs text-slate-300 sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={Boolean(field.inline)}
                      onChange={(e) => updateField(idx, { inline: e.target.checked })}
                    />
                    Inline
                  </label>
                  <button
                    type="button"
                    onClick={() => removeField(idx)}
                    className="rounded bg-rose-500/10 px-2 py-1 text-xs text-rose-400 hover:bg-rose-500/20 sm:col-span-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Footer & Timestamp */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">Footer Text</label>
                <input
                  type="text"
                  value={payload.embed.footer.text}
                  onChange={(e) =>
                    updateEmbed({ footer: { ...payload.embed.footer, text: e.target.value } })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-300">
                  <input
                    type="checkbox"
                    checked={payload.embed.timestamp}
                    onChange={(e) => updateEmbed({ timestamp: e.target.checked })}
                  />
                  Include Timestamp
                </label>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Live Preview Column */}
      <div className="rounded-xl border border-slate-800 bg-[#313338] p-4 text-slate-100 lg:col-span-5">
        <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Live Discord Preview
          </span>
          <span className="text-[11px] text-slate-400">{serverName}</span>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
            VX
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">Vexora</span>
              <span className="rounded bg-indigo-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                APP
              </span>
            </div>

            {payload.content && (
              <p className="whitespace-pre-wrap break-words text-sm text-slate-100">
                {payload.content}
              </p>
            )}

            {payload.mode === 'embed' && (
              <div
                style={{ borderLeftColor: payload.embed.color || '#5865F2' }}
                className="rounded border-l-4 bg-[#2b2d31] p-3"
              >
                {payload.embed.title && (
                  <h4 className="text-sm font-semibold text-white">{payload.embed.title}</h4>
                )}
                {payload.embed.description && (
                  <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-200">
                    {payload.embed.description}
                  </p>
                )}
                {payload.embed.fields.length > 0 && (
                  <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {payload.embed.fields.map((f, i) => (
                      <div key={i} className={f.inline ? 'col-span-1' : 'col-span-full'}>
                        <div className="text-xs font-semibold text-slate-200">{f.name}</div>
                        <div className="text-xs text-slate-300">{f.value}</div>
                      </div>
                    ))}
                  </div>
                )}
                {(payload.embed.footer.text || payload.embed.timestamp) && (
                  <div className="mt-2.5 flex items-center gap-2 text-[11px] text-slate-400">
                    {payload.embed.footer.text && <span>{payload.embed.footer.text}</span>}
                    {payload.embed.footer.text && payload.embed.timestamp && <span>•</span>}
                    {payload.embed.timestamp && <span>Just now</span>}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
