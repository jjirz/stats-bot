const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

// Utility: Calculate Win/Loss Ratio (avoid division by zero)
function calculateWLR(wins, losses) {
  return losses === 0 ? wins : (wins / Math.max(losses, 1)).toFixed(2);
}

// Fetch player stats from Hypixel API
async function fetchPlayerStats(username, HYPIXEL_API_KEY) {
  const url = `https://api.hypixel.net/player?key=${HYPIXEL_API_KEY}&name=${username}`;
  try {
    const response = await axios.get(url);
    const data = response.data;

    // Check for successful API response
    if (!data.success || !data.player) {
      throw new Error("Player not found or invalid API response.");
    }

    return data.player;
  } catch (error) {
    console.error("Error fetching player data:", error);
    throw error;
  }
}

// Handle the Bridge command – no win streaks included!
async function handleBridgeCommand(message, username, HYPIXEL_API_KEY) {
  try {
    // Sanitize username: allow only alphanumerics and underscores.
    const sanitizedUsername = username.replace(/[^a-zA-Z0-9_]/g, "");
    if (sanitizedUsername.length < 3) {
      return message.reply("❌ Invalid username provided. Must be at least 3 characters.");
    }

    const player = await fetchPlayerStats(sanitizedUsername, HYPIXEL_API_KEY);
    const duelsStats = player.stats?.Duels;

    // Check if the player has Duels stats, especially for Bridge Duels
    if (!duelsStats) {
      return message.reply(`❌ No Duels stats found for **${sanitizedUsername}**.`);
    }

    // Extract Bridge Duels stats
    const soloWins = duelsStats.bridge_duel_wins || 0;
    const soloLosses = duelsStats.bridge_duel_losses || 0;
    const doublesWins = duelsStats.bridge_doubles_wins || 0;
    const doublesLosses = duelsStats.bridge_doubles_losses || 0;

    const totalWins = soloWins + doublesWins;
    const totalLosses = soloLosses + doublesLosses;

    // Retrieve the inventory layout (if available)
    const inventoryLayout = duelsStats.layout_bridge_duel_layout || "Not available";

    // Build a clean, modern embed using EmbedBuilder
    const embed = new EmbedBuilder()
      .setColor(0x00BFFF)
      .setTitle(`Bridge Duels Stats for ${sanitizedUsername}`)
      .setDescription("Here are the Bridge Duels stats (Solo & Doubles) from Hypixel.")
      .addFields(
        { name: "🌟 Overall", value: `🏆 Wins: ${totalWins}\n❌ Losses: ${totalLosses}\n⚖️ W/L: ${calculateWLR(totalWins, totalLosses)}`, inline: true },
        { name: "🎭 Solo", value: `🏆 Wins: ${soloWins}\n❌ Losses: ${soloLosses}\n⚖️ W/L: ${calculateWLR(soloWins, soloLosses)}`, inline: true },
        { name: "👥 Doubles", value: `🏆 Wins: ${doublesWins}\n❌ Losses: ${doublesLosses}\n⚖️ W/L: ${calculateWLR(doublesWins, doublesLosses)}`, inline: true },
        { name: "🛠️ Inventory Layout", value: `${inventoryLayout}` }
      )
      .setFooter({ text: "Powered by Hypixel API" })
      .setTimestamp();

    // Send the embed
    message.reply({ embeds: [embed] });
  } catch (error) {
    console.error("Error in !bridge command:", error.message);
    
    // Add more specific error messages
    if (error.response && error.response.status === 429) {
      message.reply("⚠️ Rate limit reached. Please try again later.");
    } else {
      message.reply("⚠️ Error fetching Bridge stats. Check the username or try again later.");
    }
  }
}

module.exports = { handleBridgeCommand };
