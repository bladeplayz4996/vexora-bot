import React, { useState } from 'react';
import RolePickerUI from '../shared/role_picker_ui.jsx';
import DataTableUI from '../shared/data_table_ui.jsx';

export default function EconomyEngineUI({
  activeSubPage = 'economy_rules',
  economyConfig = {},
  shopItems = [],
  wallets = [],
  logs = [],
  roles = [],
  onChangeEconomyConfig = () => {},
  onSaveShopItem = () => {},
  onDeleteShopItem = () => {},
  onAdjustBalance = () => {},
}) {
  const [draftItem, setDraftItem] = useState({
    name: '',
    price: 250,
    stock: '',
    description: '',
    rolePicker: {
      enabled: false,
      roleIds: [],
      pickMode: 'single',
      keepPreviousRoles: false,
    },
  });

  const [adjustForm, setAdjustForm] = useState({
    userId: '',
    bucket: 'wallet',
    delta: 100,
    note: 'Dashboard adjustment',
  });

  const cfg = {
    enabled: economyConfig.enabled !== false,
    currencyName: economyConfig.currencyName || 'Coins',
    currencySymbol: economyConfig.currencySymbol || '🪙',
    startingWallet: economyConfig.startingWallet ?? 250,
    maxBankCapacity: economyConfig.maxBankCapacity ?? 100000,
    work: economyConfig.work || { min: 80, max: 220, cooldownSeconds: 1800 },
    crime: economyConfig.crime || {
      min: 250,
      max: 650,
      fineMin: 120,
      fineMax: 300,
      successRate: 0.55,
      cooldownSeconds: 3600,
    },
    rob: economyConfig.rob || {
      successRate: 0.4,
      maxStealPercent: 0.35,
      fineAmount: 200,
      cooldownSeconds: 3600,
    },
  };

  if (activeSubPage === 'shop_builder') {
    const handleCreateItem = (e) => {
      e.preventDefault();
      if (!draftItem.name.trim()) return;
      onSaveShopItem(draftItem);
      setDraftItem({
        name: '',
        price: 250,
        stock: '',
        description: '',
        rolePicker: {
          enabled: false,
          roleIds: [],
          pickMode: 'single',
          keepPreviousRoles: false,
        },
      });
    };

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Shop Builder & Role Pickers</h2>
          <p className="text-xs text-slate-400">
            Create server shop items with optional single- or multi-role picker dropdowns.
          </p>
        </div>

        <form
          onSubmit={handleCreateItem}
          className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-slate-300">Item Name</label>
              <input
                type="text"
                value={draftItem.name}
                onChange={(e) => setDraftItem({ ...draftItem, name: e.target.value })}
                placeholder="VIP Role Pass"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-300">Price</label>
              <input
                type="number"
                min={0}
                value={draftItem.price}
                onChange={(e) =>
                  setDraftItem({ ...draftItem, price: Number(e.target.value) })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-300">Stock (blank = ∞)</label>
              <input
                type="text"
                value={draftItem.stock}
                onChange={(e) => setDraftItem({ ...draftItem, stock: e.target.value })}
                placeholder="Unlimited"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-300">Description</label>
            <input
              type="text"
              value={draftItem.description}
              onChange={(e) => setDraftItem({ ...draftItem, description: e.target.value })}
              placeholder="Unlock selectable roles or perks..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
            />
          </div>

          <RolePickerUI
            roles={roles}
            label="Attach Interactive Role Picker on Purchase"
            value={draftItem.rolePicker}
            onChange={(nextPicker) =>
              setDraftItem({ ...draftItem, rolePicker: nextPicker })
            }
          />

          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
          >
            + Add Shop Item
          </button>
        </form>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shopItems.map((item) => (
            <div
              key={item.itemId || item.id}
              className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/70 p-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-white">{item.name}</h4>
                  <span className="font-mono text-xs font-semibold text-emerald-400">
                    {cfg.currencySymbol} {Number(item.price || 0).toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {item.description || 'Server item'}
                </p>
                {item.rolePicker?.enabled && (
                  <p className="mt-2 text-[11px] text-indigo-300">
                    Role Picker ({item.rolePicker.pickMode}):{' '}
                    {(item.rolePicker.roleIds || []).length} role(s)
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => onDeleteShopItem(item.itemId || item.id)}
                className="mt-4 w-full rounded-lg bg-rose-500/15 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/25"
              >
                Delete Item
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeSubPage === 'user_balances') {
    const handleAdjustSubmit = (e) => {
      e.preventDefault();
      if (!adjustForm.userId.trim()) return;
      onAdjustBalance({
        ...adjustForm,
        userId: adjustForm.userId.trim(),
        delta: Number(adjustForm.delta),
      });
    };

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Member Balances & Audit Log</h2>
          <p className="text-xs text-slate-400">
            Inspect top wallets/banks, manually credit or debit balances, and review transactions.
          </p>
        </div>

        <form
          onSubmit={handleAdjustSubmit}
          className="grid grid-cols-1 gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4 sm:grid-cols-4"
        >
          <input
            type="text"
            value={adjustForm.userId}
            onChange={(e) => setAdjustForm({ ...adjustForm, userId: e.target.value })}
            placeholder="Discord User ID"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
          />
          <select
            value={adjustForm.bucket}
            onChange={(e) => setAdjustForm({ ...adjustForm, bucket: e.target.value })}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
          >
            <option value="wallet">Wallet</option>
            <option value="bank">Bank</option>
          </select>
          <input
            type="number"
            value={adjustForm.delta}
            onChange={(e) => setAdjustForm({ ...adjustForm, delta: Number(e.target.value) })}
            placeholder="+/- Amount"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
          />
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
          >
            Apply Adjustment
          </button>
        </form>

        <DataTableUI
          columns={[
            { key: 'userId', label: 'User ID', accessor: 'userId' },
            {
              key: 'wallet',
              label: 'Wallet',
              accessor: (r) => `${cfg.currencySymbol} ${Number(r.wallet || 0).toLocaleString()}`,
            },
            {
              key: 'bank',
              label: 'Bank',
              accessor: (r) => `${cfg.currencySymbol} ${Number(r.bank || 0).toLocaleString()}`,
            },
          ]}
          rows={wallets}
          searchPlaceholder="Search wallets by user ID..."
          emptyMessage="No member wallet records yet."
        />

        <DataTableUI
          columns={[
            { key: 'txId', label: 'TX ID', accessor: 'txId' },
            { key: 'type', label: 'Type', accessor: 'type' },
            { key: 'userId', label: 'User ID', accessor: 'userId' },
            { key: 'amount', label: 'Amount', accessor: 'amount' },
          ]}
          rows={logs}
          searchPlaceholder="Filter economy audit logs..."
          emptyMessage="No economy transactions recorded yet."
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Currency & Economy Rules</h2>
          <p className="text-xs text-slate-400">
            Tune currency identity, starting wallet, bank capacity, and work/crime/rob payouts.
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs font-medium text-slate-200">
          <input
            type="checkbox"
            checked={cfg.enabled}
            onChange={(e) => onChangeEconomyConfig({ ...cfg, enabled: e.target.checked })}
          />
          Enable Economy
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4 sm:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs text-slate-300">Currency Name</label>
          <input
            type="text"
            value={cfg.currencyName}
            onChange={(e) => onChangeEconomyConfig({ ...cfg, currencyName: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-300">Symbol</label>
          <input
            type="text"
            value={cfg.currencySymbol}
            onChange={(e) => onChangeEconomyConfig({ ...cfg, currencySymbol: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-300">Starting Wallet</label>
          <input
            type="number"
            min={0}
            value={cfg.startingWallet}
            onChange={(e) =>
              onChangeEconomyConfig({ ...cfg, startingWallet: Number(e.target.value) })
            }
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-300">Max Bank Capacity</label>
          <input
            type="number"
            min={0}
            value={cfg.maxBankCapacity}
            onChange={(e) =>
              onChangeEconomyConfig({ ...cfg, maxBankCapacity: Number(e.target.value) })
            }
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <h3 className="text-xs font-semibold text-white">Work Payout</h3>
          <input
            type="number"
            value={cfg.work.min}
            onChange={(e) =>
              onChangeEconomyConfig({
                ...cfg,
                work: { ...cfg.work, min: Number(e.target.value) },
              })
            }
            placeholder="Min payout"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
          />
          <input
            type="number"
            value={cfg.work.max}
            onChange={(e) =>
              onChangeEconomyConfig({
                ...cfg,
                work: { ...cfg.work, max: Number(e.target.value) },
              })
            }
            placeholder="Max payout"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
          />
        </div>

        <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <h3 className="text-xs font-semibold text-white">Crime Payout & Fine</h3>
          <input
            type="number"
            value={cfg.crime.max}
            onChange={(e) =>
              onChangeEconomyConfig({
                ...cfg,
                crime: { ...cfg.crime, max: Number(e.target.value) },
              })
            }
            placeholder="Max payout"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
          />
          <input
            type="number"
            value={cfg.crime.fineMax}
            onChange={(e) =>
              onChangeEconomyConfig({
                ...cfg,
                crime: { ...cfg.crime, fineMax: Number(e.target.value) },
              })
            }
            placeholder="Max fine"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
          />
        </div>

        <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <h3 className="text-xs font-semibold text-white">Rob Rules</h3>
          <input
            type="number"
            step="0.05"
            min={0}
            max={1}
            value={cfg.rob.successRate}
            onChange={(e) =>
              onChangeEconomyConfig({
                ...cfg,
                rob: { ...cfg.rob, successRate: Number(e.target.value) },
              })
            }
            placeholder="Success rate (0 - 1)"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
          />
          <input
            type="number"
            value={cfg.rob.fineAmount}
            onChange={(e) =>
              onChangeEconomyConfig({
                ...cfg,
                rob: { ...cfg.rob, fineAmount: Number(e.target.value) },
              })
            }
            placeholder="Caught fine"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
          />
        </div>
      </div>
    </div>
  );
}
