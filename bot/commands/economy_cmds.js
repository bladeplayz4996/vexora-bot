import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

function getEconomyFeature(client) {
  return client.features?.get('economy_shop') || client.features?.get('economy') || null;
}

export default [
  {
    data: new SlashCommandBuilder()
      .setName('balance')
      .setDescription('Check wallet and bank balances.')
      .addUserOption((opt) => opt.setName('user').setDescription('Member to inspect').setRequired(false)),
    aliases: ['bal'],
    cooldown: 3,
    async execute(interaction, client) {
      const target = interaction.options.getUser('user') || interaction.user;
      const eco = getEconomyFeature(client);
      if (!eco?.getBalancePayload) {
        return interaction.reply({ content: 'Economy engine is initializing.', ephemeral: true });
      }
      const payload = await eco.getBalancePayload(interaction.guild.id, target.id, { user: target, guild: interaction.guild });
      return interaction.reply(payload);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('deposit')
      .setDescription('Deposit coins from wallet into your bank.')
      .addStringOption((opt) => opt.setName('amount').setDescription('Amount or "all"').setRequired(true)),
    cooldown: 3,
    async execute(interaction, client) {
      const amountRaw = interaction.options.getString('amount', true);
      const eco = getEconomyFeature(client);
      if (!eco?.deposit) return interaction.reply({ content: 'Economy engine unavailable.', ephemeral: true });
      const res = await eco.deposit(interaction.guild.id, interaction.user.id, amountRaw, {
        user: interaction.user,
        guild: interaction.guild,
      });
      return interaction.reply(res);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('withdraw')
      .setDescription('Withdraw coins from your bank into your wallet.')
      .addStringOption((opt) => opt.setName('amount').setDescription('Amount or "all"').setRequired(true)),
    cooldown: 3,
    async execute(interaction, client) {
      const amountRaw = interaction.options.getString('amount', true);
      const eco = getEconomyFeature(client);
      if (!eco?.withdraw) return interaction.reply({ content: 'Economy engine unavailable.', ephemeral: true });
      const res = await eco.withdraw(interaction.guild.id, interaction.user.id, amountRaw, {
        user: interaction.user,
        guild: interaction.guild,
      });
      return interaction.reply(res);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('work')
      .setDescription('Work a shift to earn coins.'),
    cooldown: 10,
    async execute(interaction, client) {
      const eco = getEconomyFeature(client);
      if (!eco?.runAction) return interaction.reply({ content: 'Economy engine unavailable.', ephemeral: true });
      const res = await eco.runAction('work', interaction.guild.id, interaction.user.id, null, {
        user: interaction.user,
        guild: interaction.guild,
      });
      return interaction.reply(res);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('daily')
      .setDescription('Claim your daily coin reward.'),
    cooldown: 5,
    async execute(interaction, client) {
      const eco = getEconomyFeature(client);
      if (!eco?.runAction) return interaction.reply({ content: 'Economy engine unavailable.', ephemeral: true });
      const res = await eco.runAction('daily', interaction.guild.id, interaction.user.id, null, {
        user: interaction.user,
        guild: interaction.guild,
      });
      return interaction.reply(res);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('crime')
      .setDescription('Attempt a high-risk job for bigger payouts or a fine.'),
    cooldown: 15,
    async execute(interaction, client) {
      const eco = getEconomyFeature(client);
      if (!eco?.runAction) return interaction.reply({ content: 'Economy engine unavailable.', ephemeral: true });
      const res = await eco.runAction('crime', interaction.guild.id, interaction.user.id, null, {
        user: interaction.user,
        guild: interaction.guild,
      });
      return interaction.reply(res);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('hunt')
      .setDescription('Go hunting for rewards and coins.'),
    cooldown: 10,
    async execute(interaction, client) {
      const eco = getEconomyFeature(client);
      if (!eco?.runAction) return interaction.reply({ content: 'Economy engine unavailable.', ephemeral: true });
      const res = await eco.runAction('hunt', interaction.guild.id, interaction.user.id, null, {
        user: interaction.user,
        guild: interaction.guild,
      });
      return interaction.reply(res);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('fish')
      .setDescription('Cast your line to catch fish and earn coins.'),
    cooldown: 10,
    async execute(interaction, client) {
      const eco = getEconomyFeature(client);
      if (!eco?.runAction) return interaction.reply({ content: 'Economy engine unavailable.', ephemeral: true });
      const res = await eco.runAction('fish', interaction.guild.id, interaction.user.id, null, {
        user: interaction.user,
        guild: interaction.guild,
      });
      return interaction.reply(res);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('rob')
      .setDescription('Attempt to rob coins from another member’s wallet.')
      .addUserOption((opt) => opt.setName('user').setDescription('Target member').setRequired(true)),
    cooldown: 15,
    async execute(interaction, client) {
      const targetUser = interaction.options.getUser('user', true);
      if (targetUser.id === interaction.user.id || targetUser.bot) {
        return interaction.reply({ content: 'Pick a valid server member to rob.', ephemeral: true });
      }
      const eco = getEconomyFeature(client);
      if (!eco?.runAction) return interaction.reply({ content: 'Economy engine unavailable.', ephemeral: true });
      const res = await eco.runAction('rob', interaction.guild.id, interaction.user.id, targetUser.id, {
        user: interaction.user,
        guild: interaction.guild,
      });
      return interaction.reply(res);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('give')
      .setDescription('Transfer coins from your wallet to another member.')
      .addUserOption((opt) => opt.setName('user').setDescription('Recipient member').setRequired(true))
      .addIntegerOption((opt) => opt.setName('amount').setDescription('Coin amount').setMinValue(1).setRequired(true)),
    cooldown: 4,
    async execute(interaction, client) {
      const targetUser = interaction.options.getUser('user', true);
      const amount = interaction.options.getInteger('amount', true);
      const eco = getEconomyFeature(client);
      if (!eco?.transfer) return interaction.reply({ content: 'Economy engine unavailable.', ephemeral: true });
      const res = await eco.transfer(interaction.guild.id, interaction.user.id, targetUser.id, amount, {
        user: interaction.user,
        guild: interaction.guild,
      });
      return interaction.reply(res);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('slots')
      .setDescription('Spin the slot machine.')
      .addIntegerOption((opt) => opt.setName('bet').setDescription('Wager amount').setMinValue(1).setRequired(true)),
    cooldown: 5,
    async execute(interaction, client) {
      const bet = interaction.options.getInteger('bet', true);
      const eco = getEconomyFeature(client);
      if (!eco?.gamble) return interaction.reply({ content: 'Economy engine unavailable.', ephemeral: true });
      const res = await eco.gamble('slots', interaction.guild.id, interaction.user.id, bet, {}, {
        user: interaction.user,
        guild: interaction.guild,
      });
      return interaction.reply(res);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('flip')
      .setDescription('Flip a coin to wager coins.')
      .addStringOption((opt) =>
        opt
          .setName('choice')
          .setDescription('Heads or tails')
          .addChoices({ name: 'Heads', value: 'heads' }, { name: 'Tails', value: 'tails' })
          .setRequired(true)
      )
      .addIntegerOption((opt) => opt.setName('bet').setDescription('Wager amount').setMinValue(1).setRequired(true)),
    cooldown: 5,
    async execute(interaction, client) {
      const choice = interaction.options.getString('choice', true);
      const bet = interaction.options.getInteger('bet', true);
      const eco = getEconomyFeature(client);
      if (!eco?.gamble) return interaction.reply({ content: 'Economy engine unavailable.', ephemeral: true });
      const res = await eco.gamble('flip', interaction.guild.id, interaction.user.id, bet, { choice }, {
        user: interaction.user,
        guild: interaction.guild,
      });
      return interaction.reply(res);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('bet')
      .setDescription('Place a coin bet on a high-low roll.')
      .addIntegerOption((opt) => opt.setName('bet').setDescription('Wager amount').setMinValue(1).setRequired(true)),
    cooldown: 5,
    async execute(interaction, client) {
      const bet = interaction.options.getInteger('bet', true);
      const eco = getEconomyFeature(client);
      if (!eco?.gamble) return interaction.reply({ content: 'Economy engine unavailable.', ephemeral: true });
      const res = await eco.gamble('bet', interaction.guild.id, interaction.user.id, bet, {}, {
        user: interaction.user,
        guild: interaction.guild,
      });
      return interaction.reply(res);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('richlist')
      .setDescription('View the wealthiest members in the server.'),
    aliases: ['baltop'],
    cooldown: 5,
    async execute(interaction, client) {
      const eco = getEconomyFeature(client);
      if (!eco?.getRichlist) return interaction.reply({ content: 'Economy engine unavailable.', ephemeral: true });
      const res = await eco.getRichlist(interaction.guild.id, { guild: interaction.guild });
      return interaction.reply(res);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('credit')
      .setDescription('[Admin] Add coins to a member’s wallet or bank.')
      .addUserOption((opt) => opt.setName('user').setDescription('Target member').setRequired(true))
      .addIntegerOption((opt) => opt.setName('amount').setDescription('Coin amount').setMinValue(1).setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    adminOnly: true,
    cooldown: 2,
    async execute(interaction, client) {
      const targetUser = interaction.options.getUser('user', true);
      const amount = interaction.options.getInteger('amount', true);
      const eco = getEconomyFeature(client);
      if (!eco?.adjustBalance) return interaction.reply({ content: 'Economy engine unavailable.', ephemeral: true });
      const res = await eco.adjustBalance('credit', interaction.guild.id, targetUser.id, amount, interaction.user, {
        user: targetUser,
        guild: interaction.guild,
      });
      return interaction.reply({ ...res, ephemeral: true });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('debit')
      .setDescription('[Admin] Remove coins from a member’s balance.')
      .addUserOption((opt) => opt.setName('user').setDescription('Target member').setRequired(true))
      .addIntegerOption((opt) => opt.setName('amount').setDescription('Coin amount').setMinValue(1).setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    adminOnly: true,
    cooldown: 2,
    async execute(interaction, client) {
      const targetUser = interaction.options.getUser('user', true);
      const amount = interaction.options.getInteger('amount', true);
      const eco = getEconomyFeature(client);
      if (!eco?.adjustBalance) return interaction.reply({ content: 'Economy engine unavailable.', ephemeral: true });
      const res = await eco.adjustBalance('debit', interaction.guild.id, targetUser.id, amount, interaction.user, {
        user: targetUser,
        guild: interaction.guild,
      });
      return interaction.reply({ ...res, ephemeral: true });
    },
  },
];
            
