const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { getLeaderboard } = require("../../functions/handlers/chessService");
const logger = require("../../utils/winstonLogger");

/**
 * Handle chess-related interactions (leaderboard select menu and pagination)
 * @param {Interaction} interaction - Discord interaction
 * @returns {Promise<boolean>} True if handled, false otherwise
 */
async function handleChessInteractions(interaction) {
  // Handle leaderboard select menu
  if (interaction.isStringSelectMenu() && interaction.customId === "chess_leaderboard_mode") {
    await handleLeaderboardSelect(interaction);
    return true;
  }

  // Handle leaderboard pagination buttons
  if (interaction.isButton() && (interaction.customId === "lb_prev" || interaction.customId === "lb_next")) {
    // These are handled by the collector in handleLeaderboardSelect
    // But we return false to let the collector handle them
    return false;
  }

  return false;
}

/**
 * Handle chess leaderboard select menu
 * @param {StringSelectMenuInteraction} interaction - Select menu interaction
 */
async function handleLeaderboardSelect(interaction) {
  try {
    await interaction.deferUpdate();

    const mode = interaction.values[0];
    const leaderboard = await getLeaderboard(mode);

    if (!leaderboard || leaderboard.length === 0) {
      return interaction.editReply({
        content: "No leaderboard data found.",
        components: []
      });
    }

    let page = 0;
    const pageSize = 10;
    const totalPages = Math.ceil(leaderboard.length / pageSize);

    const generateEmbed = () => {
      const start = page * pageSize;
      const current = leaderboard.slice(start, start + pageSize);

      return new EmbedBuilder()
        .setColor("#2b2d31")
        .setTitle(`${mode.replace("live_", "").toUpperCase()} Leaderboard`)
        .setDescription(
          current.map((player, index) => {
            const profileUrl = `https://www.chess.com/member/${player.username}`;
            return `**${start + index + 1}.** [${player.username}](${profileUrl}) — ${player.score}`;
          }).join("\n")
        )
        .setFooter({ text: `Page ${page + 1} of ${totalPages}` });
    };

    const generateButtons = () => new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("lb_prev")
        .setLabel("Previous")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === 0),
      new ButtonBuilder()
        .setCustomId("lb_next")
        .setLabel("Next")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page >= totalPages - 1),
      new ButtonBuilder()
        .setCustomId("lb_refresh")
        .setLabel("Refresh")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("lb_back")
        .setLabel("Back to Menu")
        .setStyle(ButtonStyle.Danger)
    );

    const message = await interaction.editReply({
      embeds: [generateEmbed()],
      components: [generateButtons()]
    });

    // Extended timeout to 5 minutes
    const collector = message.createMessageComponentCollector({ time: 300000 });

    collector.on("collect", async (i) => {
      if (!i.isButton()) return;

      try {
        if (i.customId === "lb_next" && page < totalPages - 1) {
          page++;
        } else if (i.customId === "lb_prev" && page > 0) {
          page--;
        } else if (i.customId === "lb_refresh") {
          // Refresh leaderboard data
          await i.deferUpdate();
          const freshLeaderboard = await getLeaderboard(mode);
          if (freshLeaderboard && freshLeaderboard.length > 0) {
            leaderboard.splice(0, leaderboard.length, ...freshLeaderboard);
            page = 0; // Reset to first page
          }
        } else if (i.customId === "lb_back") {
          // Return to main chess menu (if exists)
          await i.update({
            content: "Returned to main menu.",
            embeds: [],
            components: []
          });
          collector.stop();
          return;
        }

        await i.update({
          embeds: [generateEmbed()],
          components: [generateButtons()]
        });

        logger.interaction('button', i.customId, i.user.id);
      } catch (error) {
        logger.error('Chess leaderboard interaction error:', error);
      }
    });

    collector.on("end", async () => {
      try {
        // Disable all buttons when collector expires
        const disabledButtons = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("lb_prev")
            .setLabel("Previous")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId("lb_next")
            .setLabel("Next")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId("lb_refresh")
            .setLabel("Refresh")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId("lb_back")
            .setLabel("Back to Menu")
            .setStyle(ButtonStyle.Danger)
            .setDisabled(true)
        );

        await message.edit({ components: [disabledButtons] }).catch(() => {});
      } catch (error) {
        // Message might be deleted
      }
    });

  } catch (error) {
    logger.error('Chess leaderboard select error:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "Failed to load leaderboard. Please try again.",
        ephemeral: true
      }).catch(() => {});
    }
  }
}

module.exports = {
  handleChessInteractions
};
