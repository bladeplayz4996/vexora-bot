import {
  ActionRowBuilder,
  EmbedBuilder,
  StringSelectMenuBuilder,
} from 'discord.js';
import { checkCooldown } from '../global_addons/cooldown_manager.js';

/**
 * Economy & Shop Feature Engine:
 * - Wallet & Bank storage with starting balances and max bank capacity
 * - Work, Daily, Crime, Hunt, Fish, Rob, Transfer & Gambling (Slots, Flip, Bet)
 * - Server Shop & Inventory with Interactive Role Picker dropdowns (Single or Multi Pick)
 * - Transaction & Economy Audit Log
 */
const guildEconomyConfigs = new Map(); // guildId -> cfg
const walletsByMember = new Map(); // `${guildId}:${userId}` -> { wallet, bank, inventory: [] }
const shopItemsByGuild = new Map(); // guildId -> item[]
const economyLogsByGuild = new Map(); // guildId -> log[]

function getEconomyConfig(guildId) {
  if (!guildEconomyConfigs.has(guildId)) {
    guildEconomyConfigs.set(guildId, {
      enabled: true,
      currencyName: 'Coins',
      currencySymbol: '🪙',
      startingWallet: 250,
      startingBank: 0,
      maxBankCapacity: 100_000,
      work: { min: 80, max: 220, cooldownSeconds: 1800 },
      daily: { amount: 500, cooldownSeconds: 86400 },
      crime: { min: 250, max: 650, fineMin: 120, fineMax: 300, successRate: 0.55, cooldownSeconds: 3600 },
      hunt: { min: 90, max: 260, cooldownSeconds: 1200 },
      fish: { min: 70, max: 210, cooldownSeconds: 900 },
      rob: { successRate: 0.4, maxStealPercent: 0.35, fineAmount: 200, cooldownSeconds: 3600 },
    });
  }
  return guildEconomyConfigs.get(guildId);
}

function getAccount(guildId, userId) {
  const key = `${guildId}:${userId}`;
  if (!walletsByMember.has(key)) {
    const cfg = getEconomyConfig(guildId);
    walletsByMember.set(key, {
      guildId,
      userId,
      wallet: cfg.startingWallet,
      bank: cfg.startingBank,
      inventory: [], // [{ itemId, name, quantity, type, rolePicker }]
    });
  }
  return walletsByMember.get(key);
}

function logTransaction(guildId, entry) {
  const list = economyLogsByGuild.get(guildId) || [];
  list.unshift({
    id: `TX-${Date.now().toString(36).toUpperCase()}`,
    timestamp: new Date().toISOString(),
    ...entry,
  });
  economyLogsByGuild.set(guildId, list.slice(0, 250));
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function getBalancePayload(guildId, userId, { user }) {
  const cfg = getEconomyConfig(guildId);
  const acc = getAccount(guildId, userId);
  const total = acc.wallet + acc.bank;

  const embed = new EmbedBuilder()
    .setColor(0x57f287)
    .setAuthor({ name: `${user.tag} — Balance`, iconURL: user.displayAvatarURL({ size: 256 }) })
    .addFields(
      { name: 'Wallet', value: `${cfg.currencySymbol} **${acc.wallet.toLocaleString()}** ${cfg.currencyName}`, inline: true },
      {
        name: 'Bank',
        value: `${cfg.currencySymbol} **${acc.bank.toLocaleString()}** / ${cfg.maxBankCapacity.toLocaleString()}`,
        inline: true,
      },
      { name: 'Net Worth', value: `${cfg.currencySymbol} **${total.toLocaleString()}** ${cfg.currencyName}`, inline: true }
    );

  return { embeds: [embed] };
}

export async function deposit(guildId, userId, amountRaw) {
  const cfg = getEconomyConfig(guildId);
  const acc = getAccount(guildId, userId);
  const availableSpace = Math.max(0, cfg.maxBankCapacity - acc.bank);

  const requested =
    String(amountRaw).toLowerCase() === 'all' ? acc.wallet : Math.floor(Number(amountRaw));

  if (!Number.isFinite(requested) || requested <= 0) {
    return { content: 'Enter a valid positive amount or `all`.', ephemeral: true };
  }
  if (acc.wallet < requested) {
    return { content: `You only have **${acc.wallet.toLocaleString()}** ${cfg.currencyName} in your wallet.`, ephemeral: true };
  }

  const finalAmount = Math.min(requested, availableSpace);
  if (finalAmount <= 0) {
    return { content: `Your bank is already at max capacity (**${cfg.maxBankCapacity.toLocaleString()}**).`, ephemeral: true };
  }

  acc.wallet -= finalAmount;
  acc.bank += finalAmount;
  logTransaction(guildId, { type: 'deposit', userId, amount: finalAmount });

  return {
    content: `${cfg.currencySymbol} Deposited **${finalAmount.toLocaleString()}** ${cfg.currencyName} into your bank.`,
  };
}

export async function withdraw(guildId, userId, amountRaw) {
  const cfg = getEconomyConfig(guildId);
  const acc = getAccount(guildId, userId);

  const requested =
    String(amountRaw).toLowerCase() === 'all' ? acc.bank : Math.floor(Number(amountRaw));

  if (!Number.isFinite(requested) || requested <= 0) {
    return { content: 'Enter a valid positive amount or `all`.', ephemeral: true };
  }
  if (acc.bank < requested) {
    return { content: `You only have **${acc.bank.toLocaleString()}** ${cfg.currencyName} in your bank.`, ephemeral: true };
  }

  acc.bank -= requested;
  acc.wallet += requested;
  logTransaction(guildId, { type: 'withdraw', userId, amount: requested });

  return {
    content: `${cfg.currencySymbol} Withdrew **${requested.toLocaleString()}** ${cfg.currencyName} to your wallet.`,
  };
}

export async function runAction(actionType, guildId, userId, targetUserId = null) {
  const cfg = getEconomyConfig(guildId);
  if (!cfg.enabled) {
    return { content: 'The economy system is currently disabled on this server.', ephemeral: true };
  }

  const rule = cfg[actionType];
  if (!rule) return { content: 'Unknown economy activity.', ephemeral: true };

  const cd = checkCooldown(guildId, userId, `eco:${actionType}`, rule.cooldownSeconds || 60);
  if (cd.onCooldown) {
    return {
      content: `⏳ You can use \`/${actionType}\` again in **${Math.ceil(cd.remaining)}s**.`,
      ephemeral: true,
    };
  }

  const acc = getAccount(guildId, userId);

  if (actionType === 'daily') {
    acc.wallet += rule.amount;
    logTransaction(guildId, { type: 'daily', userId, amount: rule.amount });
    return {
      content: `${cfg.currencySymbol} You claimed your daily bonus of **${rule.amount.toLocaleString()}** ${cfg.currencyName}!`,
    };
  }

  if (actionType === 'work' || actionType === 'hunt' || actionType === 'fish') {
    const earned = randInt(rule.min, rule.max);
    acc.wallet += earned;
    logTransaction(guildId, { type: actionType, userId, amount: earned });
    const verbs = { work: 'completed a shift and earned', hunt: 'returned from a hunt with', fish: 'reeled in a catch worth' };
    return {
      content: `${cfg.currencySymbol} You ${verbs[actionType]} **${earned.toLocaleString()}** ${cfg.currencyName}!`,
    };
  }

  if (actionType === 'crime') {
    const succeeded = Math.random() < rule.successRate;
    if (succeeded) {
      const earned = randInt(rule.min, rule.max);
      acc.wallet += earned;
      logTransaction(guildId, { type: 'crime_win', userId, amount: earned });
      return {
        content: `💰 Heist succeeded! You scored **${earned.toLocaleString()}** ${cfg.currencyName}.`,
      };
    }
    const fine = Math.min(acc.wallet, randInt(rule.fineMin, rule.fineMax));
    acc.wallet -= fine;
    logTransaction(guildId, { type: 'crime_fail', userId, amount: -fine });
    return {
      content: `🚨 Caught! You paid a fine of **${fine.toLocaleString()}** ${cfg.currencyName}.`,
    };
  }

  if (actionType === 'rob' && targetUserId) {
    const victim = getAccount(guildId, targetUserId);
    if (victim.wallet < 50) {
      return { content: 'That member does not have enough coins in their wallet to rob.', ephemeral: true };
    }

    const succeeded = Math.random() < rule.successRate;
    if (succeeded) {
      const stolen = Math.max(10, Math.floor(victim.wallet * (Math.random() * rule.maxStealPercent)));
      victim.wallet -= stolen;
      acc.wallet += stolen;
      logTransaction(guildId, { type: 'rob_win', userId, targetUserId, amount: stolen });
      return {
        content: `🦹 You robbed **${stolen.toLocaleString()}** ${cfg.currencyName} from <@${targetUserId}>!`,
      };
    }

    const penalty = Math.min(acc.wallet, rule.fineAmount);
    acc.wallet -= penalty;
    victim.wallet += penalty;
    logTransaction(guildId, { type: 'rob_fail', userId, targetUserId, amount: -penalty });
    return {
      content: `🚓 You got caught robbing <@${targetUserId}> and paid them **${penalty.toLocaleString()}** ${cfg.currencyName}!`,
    };
  }

  return { content: 'Action completed.' };
}

export async function transfer(guildId, senderId, recipientId, amount) {
  if (senderId === recipientId) {
    return { content: 'You cannot transfer coins to yourself.', ephemeral: true };
  }
  const cfg = getEconomyConfig(guildId);
  const sender = getAccount(guildId, senderId);
  if (sender.wallet < amount) {
    return { content: `Insufficient wallet balance (**${sender.wallet.toLocaleString()}** available).`, ephemeral: true };
  }

  const recipient = getAccount(guildId, recipientId);
  sender.wallet -= amount;
  recipient.wallet += amount;
  logTransaction(guildId, { type: 'transfer', userId: senderId, targetUserId: recipientId, amount });

  return {
    content: `${cfg.currencySymbol} Sent **${amount.toLocaleString()}** ${cfg.currencyName} to <@${recipientId}>.`,
  };
}

export async function gamble(gameType, guildId, userId, bet, opts = {}) {
  const cfg = getEconomyConfig(guildId);
  const acc = getAccount(guildId, userId);

  if (acc.wallet < bet) {
    return { content: `You need **${bet.toLocaleString()}** ${cfg.currencyName} in your wallet to place that wager.`, ephemeral: true };
  }

  if (gameType === 'slots') {
    const reels = ['🍒', '🍋', '💎', '7️⃣', '🔔'];
    const spin = [0, 1, 2].map(() => reels[Math.floor(Math.random() * reels.length)]);
    const allMatch = spin[0] === spin[1] && spin[1] === spin[2];
    const twoMatch = spin[0] === spin[1] || spin[1] === spin[2] || spin[0] === spin[2];

    if (allMatch) {
      const winnings = bet * 4;
      acc.wallet += winnings;
      return { content: `🎰 **[ ${spin.join(' | ')} ]** — JACKPOT! You won **${winnings.toLocaleString()}** ${cfg.currencyName}!` };
    }
    if (twoMatch) {
      const winnings = bet;
      acc.wallet += winnings;
      return { content: `🎰 **[ ${spin.join(' | ')} ]** — Double match! You won **${winnings.toLocaleString()}** ${cfg.currencyName}!` };
    }
    acc.wallet -= bet;
    return { content: `🎰 **[ ${spin.join(' | ')} ]** — No match. You lost **${bet.toLocaleString()}** ${cfg.currencyName}.` };
  }

  if (gameType === 'flip') {
    const outcome = Math.random() < 0.5 ? 'heads' : 'tails';
    if (outcome === opts.choice) {
      acc.wallet += bet;
      return { content: `🪙 Landed on **${outcome.toUpperCase()}**! You won **${bet.toLocaleString()}** ${cfg.currencyName}!` };
    }
    acc.wallet -= bet;
    return { content: `🪙 Landed on **${outcome.toUpperCase()}**. You lost **${bet.toLocaleString()}** ${cfg.currencyName}.` };
  }

  // High-low /bet
  const roll = randInt(1, 100);
  if (roll >= 55) {
    acc.wallet += bet;
    return { content: `🎲 Rolled **${roll}** (55+ wins)! You won **${bet.toLocaleString()}** ${cfg.currencyName}!` };
  }
  acc.wallet -= bet;
  return { content: `🎲 Rolled **${roll}**. You lost **${bet.toLocaleString()}** ${cfg.currencyName}.` };
}

export async function getRichlist(guildId, { guild }) {
  const cfg = getEconomyConfig(guildId);
  const sorted = [...walletsByMember.values()]
    .filter((a) => a.guildId === guildId)
    .sort((a, b) => b.wallet + b.bank - (a.wallet + a.bank))
    .slice(0, 10);

  const lines =
    sorted.length > 0
      ? sorted.map(
          (a, i) =>
            `**#${i + 1}** <@${a.userId}> — ${cfg.currencySymbol} **${(a.wallet + a.bank).toLocaleString()}**`
        )
      : ['No economy balances recorded yet.'];

  const embed = new EmbedBuilder()
    .setColor(0xfee75c)
    .setTitle(`${guild.name} — Richest Members`)
    .setDescription(lines.join('\n'));

  return { embeds: [embed] };
}

export async function adjustBalance(mode, guildId, targetUserId, amount, moderator) {
  const cfg = getEconomyConfig(guildId);
  const acc = getAccount(guildId, targetUserId);
  if (mode === 'credit') {
    acc.wallet += amount;
  } else {
    acc.wallet = Math.max(0, acc.wallet - amount);
  }
  logTransaction(guildId, { type: `admin_${mode}`, userId: targetUserId, moderatorId: moderator.id, amount });
  return {
    content: `${mode === 'credit' ? 'Credited' : 'Debited'} **${amount.toLocaleString()}** ${cfg.currencyName} ${
      mode === 'credit' ? 'to' : 'from'
    } <@${targetUserId}>.`,
  };
}

export async function getShopPayload(guildId, page = 1) {
  const cfg = getEconomyConfig(guildId);
  const items = shopItemsByGuild.get(guildId) || [];
  const perPage = 8;
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const slice = items.slice((safePage - 1) * perPage, safePage * perPage);

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('Server Shop')
    .setDescription(
      slice.length > 0
        ? slice
            .map(
              (item) =>
                `**${item.name}** (\`${item.id}\`) — ${cfg.currencySymbol} **${item.price.toLocaleString()}**\n> ${
                  item.description || 'Server item'
                } • Stock: **${item.stock == null ? 'Unlimited' : item.stock}**`
            )
            .join('\n\n')
        : 'The server shop has no items yet. Admins can add items or role pickers from the Dashboard!'
    )
    .setFooter({ text: `Page ${safePage} of ${totalPages} • Use /buy item:<name>` });

  return { embeds: [embed] };
}

export async function purchaseItem({ guild, member, user, itemQuery, quantity = 1 }) {
  const cfg = getEconomyConfig(guild.id);
  const items = shopItemsByGuild.get(guild.id) || [];
  const item = items.find(
    (it) => it.id.toLowerCase() === itemQuery.toLowerCase() || it.name.toLowerCase() === itemQuery.toLowerCase()
  );

  if (!item) {
    return { content: `Item \`${itemQuery}\` was not found in the shop.`, ephemeral: true };
  }
  if (item.stock != null && item.stock < quantity) {
    return { content: `Only **${item.stock}** left in stock for **${item.name}**.`, ephemeral: true };
  }

  const totalCost = item.price * quantity;
  const acc = getAccount(guild.id, user.id);
  if (acc.wallet < totalCost) {
    return {
      content: `You need **${totalCost.toLocaleString()}** ${cfg.currencyName} in your wallet (Balance: **${acc.wallet.toLocaleString()}**).`,
      ephemeral: true,
    };
  }

  acc.wallet -= totalCost;
  if (item.stock != null) item.stock -= quantity;

  const existingInv = acc.inventory.find((entry) => entry.itemId === item.id);
  if (existingInv) {
    existingInv.quantity += quantity;
  } else {
    acc.inventory.push({
      itemId: item.id,
      name: item.name,
      quantity,
      rolePicker: item.rolePicker || null,
    });
  }

  logTransaction(guild.id, { type: 'shop_buy', userId: user.id, itemId: item.id, quantity, amount: -totalCost });

  // If item includes a Role Picker, render interactive dropdown immediately
  if (item.rolePicker?.roleIds?.length > 0 && member) {
    const validRoles = item.rolePicker.roleIds
      .map((rId) => guild.roles.cache.get(rId))
      .filter(Boolean);

    if (validRoles.length > 0) {
      const isMulti = item.rolePicker.pickMode === 'multi';
      const menu = new StringSelectMenuBuilder()
        .setCustomId(`vexora_shop_rolepick:${item.id}:${user.id}`)
        .setPlaceholder('Select your unlocked role(s)...')
        .setMinValues(1)
        .setMaxValues(isMulti ? validRoles.length : 1)
        .addOptions(
          validRoles.map((r) => ({
            label: r.name,
            value: r.id,
          }))
        );

      return {
        content: `🛍️ Purchased **${quantity}x ${item.name}** for **${totalCost.toLocaleString()}** ${cfg.currencyName}! Choose your role below:`,
        components: [new ActionRowBuilder().addComponents(menu)],
        ephemeral: true,
      };
    }
  }

  return {
    content: `🛍️ Purchased **${quantity}x ${item.name}** for **${totalCost.toLocaleString()}** ${cfg.currencyName}! Added to your \`/inventory\`.`,
  };
}

export async function getInventoryPayload(guildId, userId, { user }) {
  const acc = getAccount(guildId, userId);
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`${user.tag} — Inventory`)
    .setDescription(
      acc.inventory.length > 0
        ? acc.inventory.map((i) => `• **${i.name}** (\`${i.itemId}\`) × **${i.quantity}**`).join('\n')
        : 'Inventory is empty.'
    );
  return { embeds: [embed] };
}

export async function useInventoryItem({ guild, member, user, itemQuery }) {
  const acc = getAccount(guild.id, user.id);
  const idx = acc.inventory.findIndex(
    (i) => i.itemId.toLowerCase() === itemQuery.toLowerCase() || i.name.toLowerCase() === itemQuery.toLowerCase()
  );

  if (idx === -1 || acc.inventory[idx].quantity <= 0) {
    return { content: `You don't have \`${itemQuery}\` in your inventory.`, ephemeral: true };
  }

  const entry = acc.inventory[idx];
  entry.quantity -= 1;
  if (entry.quantity <= 0) acc.inventory.splice(idx, 1);

  if (entry.rolePicker?.roleIds?.length > 0 && member) {
    const validRoles = entry.rolePicker.roleIds.map((rId) => guild.roles.cache.get(rId)).filter(Boolean);
    if (validRoles.length > 0) {
      const menu = new StringSelectMenuBuilder()
        .setCustomId(`vexora_shop_rolepick:${entry.itemId}:${user.id}`)
        .setPlaceholder('Select your role...')
        .setMinValues(1)
        .setMaxValues(entry.rolePicker.pickMode === 'multi' ? validRoles.length : 1)
        .addOptions(validRoles.map((r) => ({ label: r.name, value: r.id })));

      return {
        content: `Activated **${entry.name}**! Pick your role below:`,
        components: [new ActionRowBuilder().addComponents(menu)],
        ephemeral: true,
      };
    }
  }

  return { content: `✨ Used **${entry.name}**!`, ephemeral: true };
}

export default {
  name: 'economy_shop',
  async init(client) {
    client.on('interactionCreate', async (interaction) => {
      if (!interaction.isStringSelectMenu()) return;
      if (!interaction.customId.startsWith('vexora_shop_rolepick:')) return;

      const [, , ownerUserId] = interaction.customId.split(':');
      if (interaction.user.id !== ownerUserId) {
        return interaction.reply({ content: 'This role picker belongs to another buyer.', ephemeral: true });
      }

      const allRolesInMenu = interaction.component.options.map((o) => o.value);
      const chosenRoles = interaction.values;

      // Remove non-chosen roles from this picker bundle if single/exclusive pick
      const toRemove = allRolesInMenu.filter(
        (id) => !chosenRoles.includes(id) && interaction.member.roles.cache.has(id)
      );
      if (toRemove.length > 0) await interaction.member.roles.remove(toRemove).catch(() => {});
      await interaction.member.roles.add(chosenRoles, 'Vexora Shop Role Picker').catch(() => {});

      return interaction.update({
        content: `✅ Equipped your selected role(s): ${chosenRoles.map((id) => `<@&${id}>`).join(', ')}`,
        components: [],
      });
    });
  },
  getEconomyConfig,
  getBalancePayload,
  deposit,
  withdraw,
  runAction,
  transfer,
  gamble,
  getRichlist,
  adjustBalance,
  getShopPayload,
  purchaseItem,
  getInventoryPayload,
  useInventoryItem,
  autocompleteShopItems: async (guildId, query) => {
    const items = shopItemsByGuild.get(guildId) || [];
    return items
      .filter((i) => i.name.toLowerCase().includes((query || '').toLowerCase()))
      .map((i) => ({ name: `${i.name} (${i.price} coins)`, value: i.id }));
  },
  autocompleteInventoryItems: async (guildId, userId, query) => {
    const acc = getAccount(guildId, userId);
    return acc.inventory
      .filter((i) => i.name.toLowerCase().includes((query || '').toLowerCase()))
      .map((i) => ({ name: `${i.name} (x${i.quantity})`, value: i.itemId }));
  },
  getShopItem