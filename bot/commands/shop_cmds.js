import { SlashCommandBuilder } from 'discord.js';

function getShopFeature(client) {
  return client.features?.get('economy_shop') || null;
}

export default [
  {
    data: new SlashCommandBuilder()
      .setName('shop')
      .setDescription('Browse server shop items, prices, stock, and purchasable role pickers.')
      .addIntegerOption((opt) =>
        opt.setName('page').setDescription('Shop page number').setMinValue(1).setRequired(false)
      ),
    cooldown: 3,
    async execute(interaction, client) {
      const page = interaction.options.getInteger('page') || 1;
      const shop = getShopFeature(client);

      if (!shop?.getShopPayload) {
        return interaction.reply({ content: 'Shop module is not initialized yet.', ephemeral: true });
      }

      const payload = await shop.getShopPayload(interaction.guild.id, page, {
        user: interaction.user,
        guild: interaction.guild,
        client,
      });

      return interaction.reply(payload);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('buy')
      .setDescription('Purchase an item or role picker bundle from the server shop.')
      .addStringOption((opt) =>
        opt
          .setName('item')
          .setDescription('Item name or ID from /shop')
          .setRequired(true)
          .setAutocomplete(true)
      )
      .addIntegerOption((opt) =>
        opt.setName('quantity').setDescription('Quantity to purchase').setMinValue(1).setMaxValue(50).setRequired(false)
      ),
    cooldown: 3,
    async autocomplete(interaction, client) {
      const shop = getShopFeature(client);
      if (!shop?.autocompleteShopItems) return interaction.respond([]);
      const focused = interaction.options.getFocused();
      const choices = await shop.autocompleteShopItems(interaction.guild.id, focused);
      return interaction.respond(choices.slice(0, 25));
    },
    async execute(interaction, client) {
      const itemQuery = interaction.options.getString('item', true).trim();
      const quantity = interaction.options.getInteger('quantity') || 1;
      const shop = getShopFeature(client);

      if (!shop?.purchaseItem) {
        return interaction.reply({ content: 'Shop module is not initialized yet.', ephemeral: true });
      }

      const result = await shop.purchaseItem({
        guild: interaction.guild,
        member: interaction.member,
        user: interaction.user,
        itemQuery,
        quantity,
        client,
      });

      return interaction.reply(result);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('inventory')
      .setDescription('View your purchased shop items and unlocked role passes.')
      .addUserOption((opt) =>
        opt.setName('user').setDescription('Member whose inventory you want to view').setRequired(false)
      ),
    aliases: ['inv'],
    cooldown: 3,
    async execute(interaction, client) {
      const targetUser = interaction.options.getUser('user') || interaction.user;
      const shop = getShopFeature(client);

      if (!shop?.getInventoryPayload) {
        return interaction.reply({ content: 'Inventory module is not initialized yet.', ephemeral: true });
      }

      const payload = await shop.getInventoryPayload(interaction.guild.id, targetUser.id, {
        user: targetUser,
        guild: interaction.guild,
        client,
      });

      return interaction.reply(payload);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('use')
      .setDescription('Activate or redeem an item or role selector from your inventory.')
      .addStringOption((opt) =>
        opt
          .setName('item')
          .setDescription('Inventory item name or ID')
          .setRequired(true)
          .setAutocomplete(true)
      ),
    cooldown: 3,
    async autocomplete(interaction, client) {
      const shop = getShopFeature(client);
      if (!shop?.autocompleteInventoryItems) return interaction.respond([]);
      const focused = interaction.options.getFocused();
      const choices = await shop.autocompleteInventoryItems(interaction.guild.id, interaction.user.id, focused);
      return interaction.respond(choices.slice(0, 25));
    },
    async execute(interaction, client) {
      const itemQuery = interaction.options.getString('item', true).trim();
      const shop = getShopFeature(client);

      if (!shop?.useInventoryItem) {
        return interaction.reply({ content: 'Inventory module is not initialized yet.', ephemeral: true });
      }

      const result = await shop.useInventoryItem({
        guild: interaction.guild,
        member: interaction.member,
        user: interaction.user,
        itemQuery,
        client,
      });

      return interaction.reply(result);
    },
  },
];
    
