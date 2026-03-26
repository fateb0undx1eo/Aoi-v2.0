const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const settingsService = require('../../services/settingsService');
const rateIntelligence = require('../../services/rateIntelligence');
const selfHealing = require('../../services/selfHealing');
const logger = require('../../utils/winstonLogger');

async function handleSettingsInteractions(interaction) {
    if (!interaction.isButton() || !interaction.customId.startsWith('settings_')) {
        return false;
    }

    // Check permissions
    if (!interaction.memberPermissions?.has('Administrator')) {
        await interaction.reply({
            content: 'You need Administrator permission to change settings.',
            ephemeral: true
        });
        return true;
    }

    const action = interaction.customId.split('_')[1];
    const guildId = interaction.guild.id;

    try {
        if (action === 'toggle') {
            const feature = interaction.customId.split('_')[2];
            await handleToggle(interaction, guildId, feature);
        } else if (action === 'refresh') {
            await handleRefresh(interaction, guildId);
        }
    } catch (error) {
        logger.error('Settings interaction error:', error);
        
        const errorMessage = 'Failed to update settings. Please try again.';
        
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: errorMessage, ephemeral: true });
        } else {
            await interaction.followUp({ content: errorMessage, ephemeral: true });
        }
    }

    return true;
}

/**
 * Handle toggle action
 */
async function handleToggle(interaction, guildId, feature) {
    const settingName = feature === 'rate' ? 'rateIntelligence' : 'selfHealing';
    const newValue = await settingsService.toggleSetting(guildId, settingName);

    logger.info(`Settings: ${settingName} toggled to ${newValue} for guild ${guildId} by user ${interaction.user.id}`);

    // Get updated settings
    const settings = await settingsService.getSettings(guildId);
    
    // Update the message
    const embed = createSettingsEmbed(settings);
    const buttons = createSettingsButtons(settings);

    await interaction.update({
        embeds: [embed],
        components: [buttons]
    });
}

/**
 * Handle refresh action
 */
async function handleRefresh(interaction, guildId) {
    // Clear cache and reload
    settingsService.clearCache(guildId);
    const settings = await settingsService.getSettings(guildId);

    const embed = createSettingsEmbed(settings);
    const buttons = createSettingsButtons(settings);

    await interaction.update({
        embeds: [embed],
        components: [buttons]
    });
}

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

module.exports = {
    name: 'interactionCreate',
    handleSettingsInteractions
};
