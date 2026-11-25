import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

const ANIMALS = {
  dog: 'https://placedog.net/600/400?random',
  cat: 'https://cataas.com/cat',
  fox: 'https://randomfox.ca/images/1.jpg',
  panda: 'https://some-random-api.com/img/panda',
  bird: 'https://some-random-api.com/img/bird',
};

const JOKES = [
  'Why did the developer go broke? Because they used up all their cache.',
  'Why do programmers prefer dark mode? Because light attracts bugs.',
];

const ROASTS = [
  'Your aim in clutch rounds has more plot twists than a season finale.',
  'Even a loading spinner has better commitment than your AFK timer.',
];

const COMPLIMENTS = [
  'Sharp instincts, clean execution, and solid squad energy.',
  'You always bring calm focus when things get chaotic.',
];

function randomHex() {
  return `#${Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, '0')
    .toUpperCase()}`;
}

function hexToRgb(hex) {
  const num = parseInt(hex.replace('#', ''), 16);
  return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
}

export default [
  ...Object.keys(ANIMALS).map((species) => ({
    data: new SlashCommandBuilder()
      .setName(species)
      .setDescription(`Fetch a random ${species} picture.`),
    cooldown: 4,
    async execute(interaction) {
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(`Random ${species[0].toUpperCase() + species.slice(1)}`)
        .setImage(ANIMALS[species]);
      return interaction.reply({ embeds: [embed] });
    },
  })),

  {
    data: new SlashCommandBuilder().setName('meme').setDescription('Get a light-hearted community meme.'),
    cooldown: 4,
    async execute(interaction) {
      return interaction.reply('😂 **Meme Drop:** *"Just one quick 10-minute match before I sleep..."* — 2 hours later.');
    },
  },

  {
    data: new SlashCommandBuilder().setName('joke').setDescription('Tell a quick joke.'),
    cooldown: 3,
    async execute(interaction) {
      return interaction.reply(`😄 ${JOKES[Math.floor(Math.random() * JOKES.length)]}`);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('roast')
      .setDescription('Playfully roast a member.')
      .addUserOption((opt) => opt.setName('user').setDescription('Target member').setRequired(false)),
    cooldown: 4,
    async execute(interaction) {
      const target = interaction.options.getUser('user') || interaction.user;
      const line = ROASTS[Math.floor(Math.random() * ROASTS.length)];
      return interaction.reply(`🔥 <@${target.id}> — ${line}`);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('compliment')
      .setDescription('Send a genuine compliment to a member.')
      .addUserOption((opt) => opt.setName('user').setDescription('Target member').setRequired(false)),
    cooldown: 4,
    async execute(interaction) {
      const target = interaction.options.getUser('user') || interaction.user;
      const line = COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)];
      return interaction.reply(`✨ <@${target.id}> — ${line}`);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('wanted')
      .setDescription('Generate a fun Wanted poster card for a member.')
      .addUserOption((opt) => opt.setName('user').setDescription('Target member').setRequired(false)),
    cooldown: 5,
    async execute(interaction) {
      const target = interaction.options.getUser('user') || interaction.user;
      const bounty = Math.floor(Math.random() * 900_000 + 100_000).toLocaleString();
      const embed = new EmbedBuilder()
        .setColor(0xfee75c)
        .setTitle('⚠️ WANTED POSTER ⚠️')
        .setDescription(`**Suspect:** <@${target.id}> (\`${target.tag}\`)\n**Bounty:** \`${bounty} Coins\``)
        .setThumbnail(target.displayAvatarURL({ size: 512, extension: 'png' }));
      return interaction.reply({ embeds: [embed] });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('color')
      .setDescription('Generate a random HEX/RGB color code and preview swatch.')
      .addStringOption((opt) =>
        opt.setName('hex').setDescription('Optional specific HEX code (e.g. #5865F2)').setRequired(false)
      ),
    cooldown: 3,
    async execute(interaction) {
      const input = interaction.options.getString('hex')?.trim();
      const hex =
        input && /^#?[0-9a-fA-F]{6}$/.test(input)
          ? `#${input.replace(/^#/, '').toUpperCase()}`
          : randomHex();
      const rgb = hexToRgb(hex);
      const swatchUrl = `https://singlecolorimage.com/get/${hex.slice(1)}/240x120.png`;

      const embed = new EmbedBuilder()
        .setColor(parseInt(hex.slice(1), 16))
        .setTitle(`Color Swatch — ${hex}`)
        .addFields(
          { name: 'HEX', value: `\`${hex}\``, inline: true },
          { name: 'RGB', value: `\`rgb(${rgb})\``, inline: true }
        )
        .setImage(swatchUrl);

      return interaction.reply({ embeds: [embed] });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('colorrole')
      .setDescription('Assign a custom or random color role to yourself.')
      .addStringOption((opt) =>
        opt.setName('hex').setDescription('HEX color (optional, random if omitted)').setRequired(false)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.ChangeNickname),
    botPermissions: [PermissionFlagsBits.ManageRoles],
    cooldown: 10,
    async execute(interaction) {
      const input = interaction.options.getString('hex')?.trim();
      const hex =
        input && /^#?[0-9a-fA-F]{6}$/.test(input)
          ? `#${input.replace(/^#/, '').toUpperCase()}`
          : randomHex();

      const roleName = `Vexora ${hex}`;
      let role = interaction.guild.roles.cache.find((r) => r.name === roleName);

      if (!role) {
        role = await interaction.guild.roles.create({
          name: roleName,
          color: hex,
          reason: `Color role requested by ${interaction.user.tag}`,
        });
      }

      await interaction.member.roles.add(role);
      return interaction.reply({ content: `Assigned color role ${role} (\`${hex}\`).`, ephemeral: true });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('colorgrid')
      .setDescription('Display an emoji-based interactive color palette grid.'),
    cooldown: 5,
    async execute(interaction) {
      const grid = [
        '🟥 🟧 🟨 🟩 🟦 🟪',
        '🟫 ⬛ ⬜ 🩷 🩵 🩶',
      ].join('\n');

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('Vexora Color Palette Grid')
        .setDescription(`${grid}\n\nUse \`/colorrole hex:#RRGGBB\` to equip any shade!`);

      return interaction.reply({ embeds: [embed] });
    },
  },
];
    
