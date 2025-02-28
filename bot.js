const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js'); // Updated import for intents
const axios = require('axios');
const { config } = require('dotenv');



const { handleBridgeCommand } = require('./bridge'); // Import the bridge command handler
// Load environment variables
config();

// Initialize client with necessary intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ] // Updated intents for v14
});

const HYPIXEL_API_KEY = process.env.HYPIXEL_API_KEY;

// Utility function to check permissions (Optional based on your use case)
function hasPermsRole(member) {
  return member.roles.cache.some(role => role.name === "perms");
}

// Utility function to fetch player stats from Hypixel API
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

// Utility function to calculate W/L ratio
function calculateWLR(wins, losses) {
  return losses === 0 ? wins : (wins / Math.max(losses, 1)).toFixed(2);
}

// Command handler for the !bedwars command
async function handleBedwarsCommand(message, username) {
  // Check if the user has the "perms" role (optional)
  if (!hasPermsRole(message.member)) {
    return message.reply("❌ You do not have permission to use this command.");
  }

  try {
    // Sanitize username to ensure it only contains valid characters
    const sanitizedUsername = username.replace(/[^a-zA-Z0-9_]/g, "");
    if (sanitizedUsername.length < 3) {
      return message.reply("❌ Invalid username provided. Must be at least 3 characters.");
    }

    const player = await fetchPlayerStats(sanitizedUsername);
    const stats = player.stats?.Bedwars;
    if (!stats) {
      return message.reply(`❌ No Bedwars stats found for **${sanitizedUsername}**.`);
    }

    const newWins = {
      total: stats.wins_bedwars || 0,
      solo: stats.eight_one_wins_bedwars || 0,
      doubles: stats.eight_two_wins_bedwars || 0,
      threes: stats.four_three_wins_bedwars || 0,
      fours: stats.four_four_wins_bedwars || 0,
      fourVfour: stats.two_four_wins_bedwars || 0,
    };

    const newLosses = {
      total: stats.losses_bedwars || 0,
      solo: stats.eight_one_losses_bedwars || 0,
      doubles: stats.eight_two_losses_bedwars || 0,
      threes: stats.four_three_losses_bedwars || 0,
      fours: stats.four_four_losses_bedwars || 0,
      fourVfour: stats.two_four_losses_bedwars || 0,
    };

    // Build embed with stats for all modes
    const embed = new EmbedBuilder()
      .setColor('#FF9900') // Orange color for Bedwars
      .setTitle(`🔥 **Bedwars Stats for ${sanitizedUsername}** 🔥`)
      .setDescription("Here are your Bedwars stats! 🔥🏆")
      .addFields(
        { name: "**🏆 Total Wins**", value: `${newWins.total}`, inline: true },
        { name: "**❌ Total Losses**", value: `${newLosses.total}`, inline: true },
        { name: "**⚖️ Total W/L Ratio**", value: `${calculateWLR(newWins.total, newLosses.total)}`, inline: true },
        { name: "**🎭 Solo**", value: `🏆 Wins: ${newWins.solo} | ❌ Losses: ${newLosses.solo} | ⚖️ W/L: ${calculateWLR(newWins.solo, newLosses.solo)}`, inline: false },
        { name: "**👥 Doubles**", value: `🏆 Wins: ${newWins.doubles} | ❌ Losses: ${newLosses.doubles} | ⚖️ W/L: ${calculateWLR(newWins.doubles, newLosses.doubles)}`, inline: false },
        { name: "**👨‍👩‍👦 Threes**", value: `🏆 Wins: ${newWins.threes} | ❌ Losses: ${newLosses.threes} | ⚖️ W/L: ${calculateWLR(newWins.threes, newLosses.threes)}`, inline: false },
        { name: "**🏰 Fours**", value: `🏆 Wins: ${newWins.fours} | ❌ Losses: ${newLosses.fours} | ⚖️ W/L: ${calculateWLR(newWins.fours, newLosses.fours)}`, inline: false },
        { name: "**⚔️ 4v4**", value: `🏆 Wins: ${newWins.fourVfour} | ❌ Losses: ${newLosses.fourVfour} | ⚖️ W/L: ${calculateWLR(newWins.fourVfour, newLosses.fourVfour)}`, inline: false }
      )
      .setFooter({ text: "Powered by Hypixel API" })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  } catch (error) {
    console.error("Error in !bedwars command:", error.message);
    message.reply("⚠️ Error fetching Bedwars stats. Check the username or try again later.");
  }
}

// Handle message event
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith('!bedwars')) {
    const args = message.content.slice(9).trim().split(' ');
    const playerName = args[0];

    if (!playerName) {
      return message.reply('Usage: !bedwars <playerName>');
    }

    await handleBedwarsCommand(message, playerName);
  }
});

// Log the bot in with your token
client.login(process.env.BOT_TOKEN);
