require('dotenv').config({ path: '../.env.local' });
const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// In-memory player storage (replace with database later)
let players = {
  friendlies: [],
  enemies: []
};

// Protection window constants (MM rules)
const PRO_START_OFFSET_MS = (3 * 60 + 40) * 60 * 1000; // 3hr 40min
const PRO_END_OFFSET_MS = (4 * 60 + 20) * 60 * 1000;   // 4hr 20min

// Get current GMT time
const getGMTTime = () => {
  const now = new Date();
  return now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
};

// Calculate pro windows
const calculateProWindows = (shotTime) => ({
  start: shotTime + PRO_START_OFFSET_MS,
  end: shotTime + PRO_END_OFFSET_MS
});

// Format time remaining
const formatTimeRemaining = (targetTime, now) => {
  const diff = targetTime - now;
  if (diff <= 0) return "00:00:00";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// Get player status
const getPlayerStatus = (player, serverTime) => {
  if (player.status === 'DEAD') return { status: 'DEAD', icon: '💀', info: 'DEAD' };
  if (!player.lastShotTime) return { status: 'OPEN', icon: '🟢', info: 'OPEN' };

  const windows = calculateProWindows(player.lastShotTime);
  if (serverTime < windows.start) {
    return { status: 'PROTECTED', icon: '🛡️', info: `Safe for ${formatTimeRemaining(windows.start, serverTime)}` };
  } else if (serverTime >= windows.start && serverTime < windows.end) {
    return { status: 'DROPPING', icon: '⚠️', info: `DROPPING: ${formatTimeRemaining(windows.end, serverTime)}` };
  }
  return { status: 'OPEN', icon: '🟢', info: 'OPEN' };
};

// Slash commands
const commands = [
  new SlashCommandBuilder()
    .setName('pro')
    .setDescription('Check a player\'s whack protection status')
    .addStringOption(option =>
      option.setName('player')
        .setDescription('Player name to check')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('board')
    .setDescription('Display the current war board'),
  new SlashCommandBuilder()
    .setName('shot')
    .setDescription('Record a shot time for a player')
    .addStringOption(option =>
      option.setName('player')
        .setDescription('Player name')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('faction')
        .setDescription('Friendly or Enemy')
        .setRequired(true)
        .addChoices(
          { name: 'Friendly', value: 'FRIENDLY' },
          { name: 'Enemy', value: 'ENEMY' }
        )),
  new SlashCommandBuilder()
    .setName('addplayer')
    .setDescription('Add a new player to track')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Player name')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('faction')
        .setDescription('Friendly or Enemy')
        .setRequired(true)
        .addChoices(
          { name: 'Friendly', value: 'FRIENDLY' },
          { name: 'Enemy', value: 'ENEMY' }
        )),
];

// Register slash commands
const registerCommands = async () => {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
  try {
    console.log('Registering slash commands...');
    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_APPLICATION_ID),
      { body: commands.map(cmd => cmd.toJSON()) }
    );
    console.log('Slash commands registered!');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
};

// Handle interactions
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const serverTime = getGMTTime();

  if (interaction.commandName === 'pro') {
    const playerName = interaction.options.getString('player').toLowerCase();
    const allPlayers = [...players.friendlies, ...players.enemies];
    const player = allPlayers.find(p => p.name.toLowerCase() === playerName);

    if (!player) {
      await interaction.reply(`Player "${playerName}" not found.`);
      return;
    }

    const status = getPlayerStatus(player, serverTime);
    const embed = new EmbedBuilder()
      .setTitle(`${status.icon} ${player.name}`)
      .setDescription(`**Status:** ${status.info}`)
      .setColor(status.status === 'OPEN' ? 0x10b981 : status.status === 'PROTECTED' ? 0x06b6d4 : 0xf59e0b)
      .setFooter({ text: 'War Daddy Protection System' })
      .setTimestamp();

    if (player.lastShotTime) {
      const windows = calculateProWindows(player.lastShotTime);
      embed.addFields(
        { name: 'Last Shot', value: new Date(player.lastShotTime).toISOString().slice(0, 19).replace('T', ' ') + ' GMT', inline: true },
        { name: 'Pro Start', value: new Date(windows.start).toISOString().slice(11, 19) + ' GMT', inline: true },
        { name: 'Pro End', value: new Date(windows.end).toISOString().slice(11, 19) + ' GMT', inline: true }
      );
    }

    await interaction.reply({ embeds: [embed] });
  }

  if (interaction.commandName === 'board') {
    const formatPlayer = (p) => {
      const status = getPlayerStatus(p, serverTime);
      return `${status.icon} **${p.name}** — ${status.info}`;
    };

    const embed = new EmbedBuilder()
      .setTitle('🛑 WAR DADDY BOARD')
      .setDescription(`Server Time: ${new Date(serverTime).toISOString().slice(0, 19).replace('T', ' ')} GMT`)
      .setColor(0x3447003)
      .addFields(
        { name: '🔵 FRIENDLIES', value: players.friendlies.length ? players.friendlies.map(formatPlayer).join('\n') : 'No players', inline: false },
        { name: '🔴 ENEMIES', value: players.enemies.length ? players.enemies.map(formatPlayer).join('\n') : 'No players', inline: false }
      )
      .setFooter({ text: 'War Daddy Protection System' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }

  if (interaction.commandName === 'shot') {
    const playerName = interaction.options.getString('player').toLowerCase();
    const faction = interaction.options.getString('faction');
    const list = faction === 'FRIENDLY' ? players.friendlies : players.enemies;
    const player = list.find(p => p.name.toLowerCase() === playerName);

    if (!player) {
      await interaction.reply(`Player "${playerName}" not found in ${faction.toLowerCase()} list.`);
      return;
    }

    player.lastShotTime = serverTime;
    player.status = 'PROTECTED';
    const windows = calculateProWindows(serverTime);

    const embed = new EmbedBuilder()
      .setTitle(`🎯 Shot Recorded: ${player.name}`)
      .setDescription(`Updated by ${interaction.user.tag}`)
      .setColor(0x06b6d4)
      .addFields(
        { name: 'Shot Time', value: new Date(serverTime).toISOString().slice(11, 19) + ' GMT', inline: true },
        { name: 'Pro Start', value: new Date(windows.start).toISOString().slice(11, 19) + ' GMT', inline: true },
        { name: 'Pro End', value: new Date(windows.end).toISOString().slice(11, 19) + ' GMT', inline: true }
      )
      .setFooter({ text: 'War Daddy Protection System' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }

  if (interaction.commandName === 'addplayer') {
    const name = interaction.options.getString('name');
    const faction = interaction.options.getString('faction');
    const list = faction === 'FRIENDLY' ? players.friendlies : players.enemies;

    const newPlayer = {
      id: Date.now().toString(),
      name,
      faction,
      status: 'OPEN',
      lastShotTime: null
    };

    list.push(newPlayer);

    await interaction.reply(`✅ Added **${name}** to ${faction.toLowerCase()} list.`);
  }
});

// Notification checker (runs every minute)
const checkNotifications = async () => {
  const channelId = process.env.DISCORD_NOTIFICATION_CHANNEL_ID;
  if (!channelId) return;

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel) return;

  const serverTime = getGMTTime();
  const allPlayers = [
    ...players.friendlies.map(p => ({ ...p, isFriendly: true })),
    ...players.enemies.map(p => ({ ...p, isFriendly: false }))
  ];

  for (const player of allPlayers) {
    if (!player.lastShotTime || player.status === 'DEAD') continue;

    const windows = calculateProWindows(player.lastShotTime);
    const timeToEnd = windows.end - serverTime;

    // 30 minute warning
    if (timeToEnd > 29 * 60 * 1000 && timeToEnd <= 30 * 60 * 1000) {
      const mention = player.isFriendly
        ? (player.discordId ? `<@${player.discordId}>` : `@${player.name}`)
        : '@everyone';

      const msg = player.isFriendly
        ? `⚠️ ${mention} Your Whack Pro ends in **30 minutes**!`
        : `⚠️ ${mention} Enemy **${player.name}** whack pro ends in **30 minutes**!`;

      await channel.send(msg);
    }

    // 15 minute warning
    if (timeToEnd > 14 * 60 * 1000 && timeToEnd <= 15 * 60 * 1000) {
      const mention = player.isFriendly
        ? (player.discordId ? `<@${player.discordId}>` : `@${player.name}`)
        : '@everyone';

      const msg = player.isFriendly
        ? `🔔 ${mention} Your Whack Pro ends in **15 minutes**!`
        : `🔔 ${mention} Enemy **${player.name}** whack pro ends in **15 minutes**!`;

      await channel.send(msg);
    }

    // OPEN notification
    if (timeToEnd > -60 * 1000 && timeToEnd <= 0) {
      const mention = player.isFriendly
        ? (player.discordId ? `<@${player.discordId}>` : `@${player.name}`)
        : '@everyone';

      const msg = player.isFriendly
        ? `🚨 ${mention} You are now **OPEN**!`
        : `🚨 ${mention} Enemy **${player.name}** is now **OPEN**!`;

      await channel.send(msg);
      player.status = 'OPEN';
    }
  }
};

// Bot ready
client.once('ready', async () => {
  console.log(`War Daddy is online as ${client.user.tag}!`);
  await registerCommands();

  // Check notifications every minute
  setInterval(checkNotifications, 60 * 1000);
});

// Login
client.login(process.env.DISCORD_BOT_TOKEN);
