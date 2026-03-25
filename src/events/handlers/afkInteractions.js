const { EmbedBuilder } = require("discord.js");
const afkSchema = require("../../schemas/afkSchema");
const logger = require("../../utils/winstonLogger");

/**
 * Handle AFK-related button interactions
 * @param {Interaction} interaction - Discord interaction
 * @returns {Promise<boolean>} True if handled, false otherwise
 */
async function handleAfkInteractions(interaction) {
  if (!interaction.isButton() || !interaction.customId.startsWith('afk_')) {
    return false;
  }

  // Instantly acknowledge interaction (prevents Unknown Interaction error)
  await interaction.deferUpdate().catch(() => {});

  const parts = interaction.customId.split('_');
  const choice = parts[1];
  const ownerId = parts[2];

  // Prevent others from pressing
  if (interaction.user.id !== ownerId) {
    await interaction.followUp({
      content: "This button isn't for you.",
      ephemeral: true
    }).catch(() => {});
    return true;
  }

  const dmNotify = choice === 'yes';

  try {
    const originalEmbed = interaction.message.embeds[0];
    let reason = "No reason provided";

    if (originalEmbed?.description) {
      const firstLine = originalEmbed.description.split('\n')[0];
      reason = firstLine.replace('**Reason:** ', '') || reason;
    }

    await afkSchema.findOneAndUpdate(
      { userId: interaction.user.id, guildId: interaction.guildId },
      {
        reason,
        timestamp: Date.now(),
        dmNotify
      },
      { upsert: true }
    );

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor('Green')
          .setDescription(
            `AFK set successfully!\n\n**DM Notifications:** ${dmNotify ? 'Enabled' : 'Disabled'}`
          )
      ],
      components: []
    });

    logger.interaction('button', 'afk_set', interaction.user.id);

  } catch (err) {
    logger.error("AFK Button Error:", err);
    await interaction.followUp({
      content: "Failed to set AFK status. Please try again.",
      ephemeral: true
    }).catch(() => {});
  }

  return true;
}

module.exports = {
  handleAfkInteractions
};
