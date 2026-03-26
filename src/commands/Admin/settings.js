const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const settingsService = require('../../services/settingsService');
const rateIntelligence = require('../../services/rateIntelligence');
const selfHealing = require('../../services/selfHealing');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('settings')
        .setDescription('Configure bot advanced features')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // Check if user has Administrator permission
        if (!interaction.memberPermissions?.has('Administrator')) {
            return interaction.reply({
                content: 'You need Administrator permission to use this command.',
                ephemeral: true
            });
        }

        const guildId = interaction.guild.id;
        const settings = await settingsService.getSettings(guildId);

        const embed = createSettingsEmbed(settings);
        const buttons = createSettingsButtons(settings);

        await interaction.reply({
            embeds: [embed],
            components: [buttons],
            ephemeral: true
        });
    }
};

/**
 * Create settings embed
 */
function createSettingsEmbed(settings) {
    const rateStats = rateIntelligence.getStats();
    const healingStats = selfHealing.getStats();

    return new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('Bot Advanced Settings')
        .setDescription('Configure intelligent features for optimal performance')
        .addFields(
            {
                name: 'Adaptive Rate Intelligence',
                value: `Status: ${settings.rateIntelligence ? 'ENABLED' : 'DISABLED'}\n` +
                       `Tracked Users: ${rateStats.trackedUsers}\n` +
                       `Description: Dynamic cooldown system that adapts to user behavior`,
                inline: false
            },
            {
                name: 'Self-Healing System',
                value: `Status: ${settings.selfHealing ? 'ENABLED' : 'DISABLED'}\n` +
                       `Recoveries: ${healingStats.totalRecoveries}\n` +
                       `Description: Automatic retry and recovery for failed operations`,
                inline: false
            }
        )
        .setFooter({ text: 'Click buttons below to toggle features' })
        .setTimestamp();
}

/**
 * Create settings buttons
 */
function createSettingsButtons(settings) {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('settings_toggle_rate')
                .setLabel(`Rate Intelligence: ${settings.rateIntelligence ? 'ON' : 'OFF'}`)
                .setStyle(settings.rateIntelligence ? ButtonStyle.Success : ButtonStyle.Secondary)
                .setEmoji(settings.rateIntelligence ? '✓' : '✗'),
            new ButtonBuilder()
                .setCustomId('settings_toggle_healing')
                .setLabel(`Self-Healing: ${settings.selfHealing ? 'ON' : 'OFF'}`)
                .setStyle(settings.selfHealing ? ButtonStyle.Success : ButtonStyle.Secondary)
                .setEmoji(settings.selfHealing ? '✓' : '✗'),
            new ButtonBuilder()
                .setCustomId('settings_refresh')
                .setLabel('Refresh')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🔄')
        );
}
