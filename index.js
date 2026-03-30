// Discord Bot (Slash + Prefix Commands) - SAFE VERSION
// IMPORTANT: Never hardcode your bot token. Use environment variables.

const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder, REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const PREFIX = '.';

// ===== WHITELIST =====
// Fallback list of authorized user IDs. Override at runtime via the
// WHITELIST_USERS environment variable (comma-separated IDs).
const DEFAULT_WHITELIST = ['1456824205545967713'];

const WHITELIST = process.env.WHITELIST_USERS
  ? process.env.WHITELIST_USERS.split(',').map(id => id.trim()).filter(Boolean)
  : DEFAULT_WHITELIST;

function isWhitelisted(userId) {
  return WHITELIST.includes(userId);
}

// CONFIG
const ROBLOX_GROUP_URL = 'https://www.roblox.com/communities/489845165/fraidfg#!/about';
const MUTED_ROLE_ID = '1485860847929524225';

// ===== SLASH COMMANDS SETUP =====
const commands = [
  new SlashCommandBuilder().setName('hb').setDescription('Show help'),
  new SlashCommandBuilder().setName('ban').setDescription('Ban a user')
    .addUserOption(opt => opt.setName('user').setDescription('User').setRequired(true)),
  new SlashCommandBuilder().setName('mute').setDescription('Mute a user')
    .addUserOption(opt => opt.setName('user').setDescription('User').setRequired(true)),
  new SlashCommandBuilder().setName('to').setDescription('Timeout a user')
    .addUserOption(opt => opt.setName('user').setDescription('User').setRequired(true))
    .addIntegerOption(opt => opt.setName('minutes').setDescription('Minutes').setRequired(true)),
  new SlashCommandBuilder().setName('group').setDescription('Manage/check group')
    .addSubcommand(sub => sub.setName('add').setDescription('Add a user to the group').addUserOption(u=>u.setName('user').setDescription('User').setRequired(true)))
    .addSubcommand(sub => sub.setName('remove').setDescription('Remove a user from the group').addUserOption(u=>u.setName('user').setDescription('User').setRequired(true)))
    .addSubcommand(sub => sub.setName('check').setDescription('Check if a user is in the group').addUserOption(u=>u.setName('user').setDescription('User').setRequired(true)))
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    console.log('Slash commands registered');
  } catch (err) {
    console.error(err);
  }
});

// ===== SLASH COMMAND HANDLER =====
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (!isWhitelisted(interaction.user.id)) {
    return interaction.reply({ content: 'You are not authorized to use this bot.', ephemeral: true });
  }

  const embed = new EmbedBuilder()
    .setColor('#2b2d31')
    .setFooter({ text: `Requested by ${interaction.user.tag}` })
    .setTimestamp();

  if (interaction.commandName === 'hb') {
    embed.setTitle('Commands').setDescription('/ban /mute /to /group');
    return interaction.reply({ embeds: [embed] });
  }

  if (interaction.commandName === 'ban') {
    const user = interaction.options.getMember('user');
    await user.ban();
    embed.setTitle('Banned').setDescription(user.user.tag);
    return interaction.reply({ embeds: [embed] });
  }

  if (interaction.commandName === 'mute') {
    const user = interaction.options.getMember('user');
    await user.roles.add(MUTED_ROLE_ID);
    embed.setTitle('Muted').setDescription(user.user.tag);
    return interaction.reply({ embeds: [embed] });
  }

  if (interaction.commandName === 'to') {
    const user = interaction.options.getMember('user');
    const minutes = interaction.options.getInteger('minutes');
    await user.timeout(minutes * 60000);
    embed.setTitle('Timed Out').setDescription(`${user.user.tag} for ${minutes}m`);
    return interaction.reply({ embeds: [embed] });
  }

  if (interaction.commandName === 'group') {
    const sub = interaction.options.getSubcommand();
    const user = interaction.options.getMember('user');

    if (sub === 'add') {
      embed.setTitle('Join Roblox Group').setDescription(
        `${user.user.username}, to join the group please use the link below:\n${ROBLOX_GROUP_URL}`
      );
    }
    if (sub === 'remove') {
      embed.setTitle('Leave Roblox Group').setDescription(
        `${user.user.username}, to leave the group please visit the link below and click **Leave Group**:\n${ROBLOX_GROUP_URL}`
      );
    }
    if (sub === 'check') {
      embed.setTitle('Roblox Group').setDescription(
        `To check membership for ${user.user.username}, visit the group page:\n${ROBLOX_GROUP_URL}`
      );
    }

    return interaction.reply({ embeds: [embed] });
  }
});

// ===== PREFIX COMMANDS =====
client.on('messageCreate', async message => {
  if (!message.content.startsWith(PREFIX) || message.author.bot) return;

  if (!isWhitelisted(message.author.id)) {
    return message.reply('You are not authorized to use this bot.');
  }

  const args = message.content.slice(PREFIX.length).split(/ +/);
  const cmd = args.shift().toLowerCase();

  const embed = new EmbedBuilder().setColor('#2b2d31');

  if (cmd === 'group') {
    const user = message.mentions.members.first();
    if (!user) return message.reply('Mention user');

    embed.setTitle('Roblox Group').setDescription(
      `To check membership for ${user.user.username}, visit the group page:\n${ROBLOX_GROUP_URL}`
    );

    return message.reply({ embeds: [embed] });
  }
});

client.login(process.env.TOKEN);

/*
SETUP:
1. npm install discord.js dotenv
2. create .env file:
   TOKEN=your_bot_token_here
3. node index.js

NOTE:
- Group commands now use the Roblox group URL instead of Discord roles
- Roblox group: https://www.roblox.com/communities/489845165/fraidfg#!/about
*/
