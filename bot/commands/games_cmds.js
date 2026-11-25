import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';

const TRIVIA_BANK = [
  {
    q: 'Which protocol is primarily used to transfer hypertext over the web?',
    options: ['FTP', 'HTTP', 'SMTP', 'SSH'],
    answer: 1,
  },
  {
    q: 'In binary logic, what is the output of `1 XOR 1`?',
    options: ['0', '1', 'Undefined', 'High-Z'],
    answer: 0,
  },
  {
    q: 'Which data structure operates on a First-In, First-Out (FIFO) principle?',
    options: ['Stack', 'Queue', 'Binary Tree', 'Hash Map'],
    answer: 1,
  },
];

const EIGHT_BALL_REPLIES = [
  'It is certain.',
  'Without a doubt.',
  'Yes — definitely.',
  'Signs point to yes.',
  'Reply hazy, try again.',
  'Ask again later.',
  'Better not tell you now.',
  'Don’t count on it.',
  'My reply is no.',
  'Very doubtful.',
];

function createTicTacToeRows(board, gameId, disabled = false) {
  const rows = [];
  for (let r = 0; r < 3; r++) {
    const row = new ActionRowBuilder();
    for (let c = 0; c < 3; c++) {
      const idx = r * 3 + c;
      const cell = board[idx];
      const label = cell === 'X' ? 'X' : cell === 'O' ? 'O' : '\u200B';
      const style =
        cell === 'X'
          ? ButtonStyle.Danger
          : cell === 'O'
            ? ButtonStyle.Primary
            : ButtonStyle.Secondary;

      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`ttt:${gameId}:${idx}`)
          .setLabel(label)
          .setStyle(style)
          .setDisabled(disabled || Boolean(cell))
      );
    }
    rows.push(row);
  }
  return rows;
}

export default [
  {
    data: new SlashCommandBuilder()
      .setName('tictactoe')
      .setDescription('Play an interactive button-driven Tic-Tac-Toe match with another member.')
      .addUserOption((opt) =>
        opt.setName('opponent').setDescription('Member to challenge').setRequired(true)
      ),
    cooldown: 5,
    async execute(interaction) {
      const opponent = interaction.options.getUser('opponent', true);
      if (opponent.bot || opponent.id === interaction.user.id) {
        return interaction.reply({
          content: 'Challenge another real server member (not yourself or a bot).',
          ephemeral: true,
        });
      }

      const gameId = `${interaction.user.id}_${opponent.id}_${Date.now()}`;
      const board = Array(9).fill(null);

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('Tic-Tac-Toe')
        .setDescription(
          `**X:** <@${interaction.user.id}>\n**O:** <@${opponent.id}>\n\nTurn: **X** (<@${interaction.user.id}>)`
        );

      const msg = await interaction.reply({
        embeds: [embed],
        components: createTicTacToeRows(board, gameId, false),
        fetchReply: true,
      });

      const wins = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6],
      ];

      let turn = 'X';
      const collector = msg.createMessageComponentCollector({ time: 120_000 });

      collector.on('collect', async (btn) => {
        if (!btn.customId.startsWith(`ttt:${gameId}:`)) return;
        const expectedUserId = turn === 'X' ? interaction.user.id : opponent.id;

        if (btn.user.id !== expectedUserId) {
          return btn.reply({ content: 'Wait for your turn in this match.', ephemeral: true });
        }

        const idx = Number(btn.customId.split(':')[2]);
        if (board[idx]) {
          return btn.reply({ content: 'That square is already taken.', ephemeral: true });
        }

        board[idx] = turn;

        const hasWinner = wins.some(([a, b, c]) => board[a] && board[a] === board[b] && board[a] === board[c]);
        const isDraw = !hasWinner && board.every(Boolean);

        if (hasWinner || isDraw) {
          const winnerMention = turn === 'X' ? `<@${interaction.user.id}>` : `<@${opponent.id}>`;
          const endEmbed = EmbedBuilder.from(embed).setDescription(
            `**X:** <@${interaction.user.id}>\n**O:** <@${opponent.id}>\n\n${
              hasWinner ? `Winner: **${turn}** (${winnerMention})!` : 'Result: **Draw**!'
            }`
          );
          await btn.update({ embeds: [endEmbed], components: createTicTacToeRows(board, gameId, true) });
          collector.stop(hasWinner ? 'win' : 'draw');
          return;
        }

        turn = turn === 'X' ? 'O' : 'X';
        const nextUserId = turn === 'X' ? interaction.user.id : opponent.id;
        const nextEmbed = EmbedBuilder.from(embed).setDescription(
          `**X:** <@${interaction.user.id}>\n**O:** <@${opponent.id}>\n\nTurn: **${turn}** (<@${nextUserId}>)`
        );
        await btn.update({ embeds: [nextEmbed], components: createTicTacToeRows(board, gameId, false) });
      });

      collector.on('end', async (_, reason) => {
        if (reason !== 'win' && reason !== 'draw') {
          const timeoutEmbed = EmbedBuilder.from(embed).setDescription(
            `**X:** <@${interaction.user.id}>\n**O:** <@${opponent.id}>\n\nMatch timed out.`
          );
          await msg.edit({ embeds: [timeoutEmbed], components: createTicTacToeRows(board, gameId, true) }).catch(() => {});
        }
      });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('rps')
      .setDescription('Play Rock, Paper, Scissors against Vexora.')
      .addStringOption((opt) =>
        opt
          .setName('choice')
          .setDescription('Your move')
          .addChoices(
            { name: 'Rock', value: 'rock' },
            { name: 'Paper', value: 'paper' },
            { name: 'Scissors', value: 'scissors' }
          )
          .setRequired(true)
      ),
    cooldown: 3,
    async execute(interaction) {
      const userChoice = interaction.options.getString('choice', true);
      const moves = ['rock', 'paper', 'scissors'];
      const botChoice = moves[Math.floor(Math.random() * moves.length)];

      let outcome = 'Draw!';
      if (
        (userChoice === 'rock' && botChoice === 'scissors') ||
        (userChoice === 'paper' && botChoice === 'rock') ||
        (userChoice === 'scissors' && botChoice === 'paper')
      ) {
        outcome = `You win! (<@${interaction.user.id}>)`;
      } else if (userChoice !== botChoice) {
        outcome = 'Vexora wins!';
      }

      return interaction.reply(
        `You chose **${userChoice.toUpperCase()}** vs. Vexora’s **${botChoice.toUpperCase()}** — **${outcome}**`
      );
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('connect4')
      .setDescription('Start a Connect 4 match with a member.')
      .addUserOption((opt) => opt.setName('opponent').setDescription('Opponent member').setRequired(true)),
    cooldown: 5,
    async execute(interaction) {
      const opponent = interaction.options.getUser('opponent', true);
      if (opponent.bot || opponent.id === interaction.user.id) {
        return interaction.reply({ content: 'Choose another member to play Connect 4.', ephemeral: true });
      }

      const rows = 6;
      const cols = 7;
      const grid = Array.from({ length: rows }, () => Array(cols).fill('.'));
      let turn = 'R';

      const renderBoard = () =>
        grid.map((r) => r.map((c) => (c === 'R' ? '🔴' : c === 'Y' ? '🟡' : '⚪')).join('')).join('\n') +
        '\n1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣';

      const row1 = new ActionRowBuilder().addComponents(
        ...[1, 2, 3, 4].map((n) =>
          new ButtonBuilder().setCustomId(`c4:${n - 1}`).setLabel(`${n}`).setStyle(ButtonStyle.Secondary)
        )
      );
      const row2 = new ActionRowBuilder().addComponents(
        ...[5, 6, 7].map((n) =>
          new ButtonBuilder().setCustomId(`c4:${n - 1}`).setLabel(`${n}`).setStyle(ButtonStyle.Secondary)
        )
      );

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('Connect 4')
        .setDescription(
          `🔴 <@${interaction.user.id}> vs 🟡 <@${opponent.id}>\nTurn: 🔴 <@${interaction.user.id}>\n\n${renderBoard()}`
        );

      const msg = await interaction.reply({ embeds: [embed], components: [row1, row2], fetchReply: true });
      const collector = msg.createMessageComponentCollector({ time: 180_000 });

      collector.on('collect', async (btn) => {
        if (!btn.customId.startsWith('c4:')) return;
        const expected = turn === 'R' ? interaction.user.id : opponent.id;
        if (btn.user.id !== expected) {
          return btn.reply({ content: 'Not your turn.', ephemeral: true });
        }

        const col = Number(btn.customId.split(':')[1]);
        let placedRow = -1;
        for (let r = rows - 1; r >= 0; r--) {
          if (grid[r][col] === '.') {
            grid[r][col] = turn;
            placedRow = r;
            break;
          }
        }

        if (placedRow === -1) {
          return btn.reply({ content: 'Column is full.', ephemeral: true });
        }

        turn = turn === 'R' ? 'Y' : 'R';
        const nextMention = turn === 'R' ? `<@${interaction.user.id}>` : `<@${opponent.id}>`;
        const nextSymbol = turn === 'R' ? '🔴' : '🟡';

        const updated = EmbedBuilder.from(embed).setDescription(
          `🔴 <@${interaction.user.id}> vs 🟡 <@${opponent.id}>\nTurn: ${nextSymbol} ${nextMention}\n\n${renderBoard()}`
        );
        await btn.update({ embeds: [updated] });
      });

      collector.on('end', async () => {
        const disabledRow1 = ActionRowBuilder.from(row1);
        disabledRow1.components.forEach((b) => b.setDisabled(true));
        const disabledRow2 = ActionRowBuilder.from(row2);
        disabledRow2.components.forEach((b) => b.setDisabled(true));
        await msg.edit({ components: [disabledRow1, disabledRow2] }).catch(() => {});
      });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('wordguess')
      .setDescription('Play a 5-letter word guessing round.')
      .addStringOption((opt) =>
        opt.setName('guess').setDescription('5-letter word guess').setMinLength(5).setMaxLength(5).setRequired(false)
      ),
    cooldown: 3,
    async execute(interaction) {
      const targetWords = ['NEXUS', 'BLADE', 'VEXOR', 'LOGIC', 'SHARD'];
      const rawSecret = targetWords[Math.floor(Math.random() * targetWords.length)].padEnd(5, 'S').slice(0, 5);
      const guess = (interaction.options.getString('guess') || 'NEXUS').toUpperCase();

      const tiles = [...guess].map((ch, idx) => {
        if (ch === rawSecret[idx]) return `🟩 **${ch}**`;
        if (rawSecret.includes(ch)) return `🟨 **${ch}**`;
        return `⬛ **${ch}**`;
      });

      return interaction.reply(`**WordGuess:** ${tiles.join(' ')}`);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('trivia')
      .setDescription('Answer a quick trivia question with interactive buttons.'),
    cooldown: 5,
    async execute(interaction) {
      const item = TRIVIA_BANK[Math.floor(Math.random() * TRIVIA_BANK.length)];
      const row = new ActionRowBuilder().addComponents(
        ...item.options.map((label, idx) =>
          new ButtonBuilder().setCustomId(`triv:${idx}`).setLabel(label).setStyle(ButtonStyle.Secondary)
        )
      );

      const msg = await interaction.reply({
        content: `**Trivia:** ${item.q}`,
        components: [row],
        fetchReply: true,
      });

      const collector = msg.createMessageComponentCollector({ time: 30_000, max: 1 });
      collector.on('collect', async (btn) => {
        const chosen = Number(btn.customId.split(':')[1]);
        const isCorrect = chosen === item.answer;
        const disabled = ActionRowBuilder.from(row);
        disabled.components.forEach((b) => b.setDisabled(true));
        await btn.update({
          content: `**Trivia:** ${item.q}\n<@${btn.user.id}> chose **${item.options[chosen]}** — ${
            isCorrect ? 'Correct!' : `Incorrect! Answer: **${item.options[item.answer]}**.`
          }`,
          components: [disabled],
        });
      });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('8ball')
      .setDescription('Ask the magic 8-ball a question.')
      .addStringOption((opt) => opt.setName('question').setDescription('Your question').setRequired(true)),
    cooldown: 3,
    async execute(interaction) {
      const question = interaction.options.getString('question', true);
      const reply = EIGHT_BALL_REPLIES[Math.floor(Math.random() * EIGHT_BALL_REPLIES.length)];
      return interaction.reply(`> ${question}\n🎱 **${reply}**`);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('td')
      .setDescription('Truth or Dare prompt generator.')
      .addStringOption((opt) =>
        opt
          .setName('mode')
          .setDescription('Truth or Dare')
          .addChoices({ name: 'Truth', value: 'truth' }, { name: 'Dare', value: 'dare' })
          .setRequired(true)
      ),
    cooldown: 3,
    async execute(interaction) {
      const mode = interaction.options.getString('mode', true);
      const truths = [
        'What is the most recent game or show you stayed up way too late finishing?',
        'What is one technical skill you want to master next?',
      ];
      const dares = [
        'Send your current favorite quote or one-liner in chat.',
        'Change your server nickname to a fun title for the next 10 minutes.',
      ];
      const pool = mode === 'truth' ? truths : dares;
      const prompt = pool[Math.floor(Math.random() * pool.length)];
      return interaction.reply(`**${mode.toUpperCase()}** for <@${interaction.user.id}>: ${prompt}`);
    },
  },
];
      
