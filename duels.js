const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { config } = require('dotenv');

// Load environment variables
config();

// Initialize client with necessary intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const HYPIXEL_API_KEY = process.env.HYPIXEL_API_KEY;

// Utility function to fetch player stats from the Hypixel API
async function fetchPlayerStats(username) {
  try {
    const response = await axios.get(`https://api.hypixel.net/player?key=${HYPIXEL_API_KEY}&name=${username}`);
    const data = response.data;
    if (!data.success || !data.player) {
      throw new Error("Player not found or invalid API response.");
    }
    return data.player;
  } catch (error) {
    throw error;
  }
}

// Utility function to calculate a ratio (with a safeguard against division by zero)
function calculateRatio(numerator, denominator) {
  return denominator === 0 ? numerator : (numerator / Math.max(denominator, 1)).toFixed(2);
}

// Command handler for the !duels command
async function handleDuelsCommand(message, username) {
  // Sanitize the username
  const sanitizedUsername = username.replace(/[^a-zA-Z0-9_]/g, "");
  if (sanitizedUsername.length < 3) {
    return message.reply("❌ Invalid username provided. Must be at least 3 characters.");
  }

  try {
    const player = await fetchPlayerStats(sanitizedUsername);
    const stats = player.stats?.Duels;
    if (!stats) {
      return message.reply(`❌ No Duels stats found for **${sanitizedUsername}**.`);
    }

    // Overall Duels stats
    const overallWins = stats.wins || 0;
    const overallLosses = stats.losses || 0;
    const overallKills = stats.kills || 0;
    const overallDeaths = stats.deaths || 0;
    const overallWL = calculateRatio(overallWins, overallLosses);
    const overallKD = calculateRatio(overallKills, overallDeaths);

    // Mode-specific stats (removed Bridge mode)
    const modes = {
      UHC: {
        wins: stats.uhc_wins_duels || 0,
        losses: stats.uhc_losses_duels || 0,
        kills: stats.uhc_kills_duels || 0,
        deaths: stats.uhc_deaths_duels || 0,
      },
      Sumo: {
        wins: stats.sumo_wins_duels || 0,
        losses: stats.sumo_losses_duels || 0,
        kills: stats.sumo_kills_duels || 0,
        deaths: stats.sumo_deaths_duels || 0,
      },
      OP: {
        wins: stats.op_duels_wins || 0,
        losses: stats.op_duels_losses || 0,
        kills: stats.op_duels_kills || 0,
        deaths: stats.op_duels_deaths || 0,
      },
      Classic: {
        wins: stats.classic_duels_wins || 0,
        losses: stats.classic_duels_losses || 0,
        kills: stats.classic_duels_kills || 0,
        deaths: stats.classic_duels_deaths || 0,
      },
    };

    // Build the embed for a cool, modern look
    const embed = new EmbedBuilder()
      .setColor('#00AAFF')
      .setTitle(`⚔️ Duels Stats for ${sanitizedUsername}`)
      .setDescription("Overall stats and mode-specific Duels performance.")
      .addFields(
        { name: "Overall Wins", value: `${overallWins}`, inline: true },
        { name: "Overall Losses", value: `${overallLosses}`, inline: true },
        { name: "Overall W/L Ratio", value: `${overallWL}`, inline: true },
        { name: "Overall K/D Ratio", value: `${overallKD}`, inline: true }
      )
      .setFooter({ text: "Powered by Hypixel API" })
      .setTimestamp();

    // Add a field for each Duels gamemode (excluding Bridge)
    for (const mode in modes) {
      const m = modes[mode];
      const modeWL = calculateRatio(m.wins, m.losses);
      const modeKD = calculateRatio(m.kills, m.deaths);
      embed.addFields({
        name: `${mode} Duels`,
        value: `Wins: ${m.wins}\nLosses: ${m.losses}\nW/L: ${modeWL}\nKills: ${m.kills}\nDeaths: ${m.deaths}\nK/D: ${modeKD}`,
        inline: false
      });
    }

    message.reply({ embeds: [embed] });
  } catch (error) {
    console.error("Error in !duels command:", error.message);
    message.reply("⚠️ Error fetching Duels stats. Check the username or try again later.");
  }
}

// Listen for messages and handle the !duels command
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.content.toLowerCase().startsWith('!duels')) {
    const args = message.content.slice(7).trim().split(' ');
    const playerName = args[0];
    if (!playerName) {
      return message.reply("Usage: !duels <playerName>");
    }
    await handleDuelsCommand(message, playerName);
  }
});

// Log the bot in with your token
client.login(process.env.BOT_TOKEN);
