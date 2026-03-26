const { 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ActionRowBuilder,
    ChannelSelectMenuBuilder,
    RoleSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    EmbedBuilder
} = require('discord.js');
const { updateInterval, stopAutoPoster, getAutoPosterState } = require('../../functions/handlers/autoPoster');
const subreddits = require('../../functions/handlers/subreddits');

async function handleAutopostInteractions(interaction) {
    try {
        // ==================== BUTTON HANDLERS ====================
        if (interaction.isButton() && interaction.customId.startsWith('autopost_')) {
            const action = interaction.customId.split('_')[1];

            // Configure/Setup button - Start configuration flow
            if (action === 'configure') {
                // Use update() directly without deferring for immediate response
                const channelRow = new ActionRowBuilder()
                    .addComponents(
                        new ChannelSelectMenuBuilder()
                            .setCustomId('autopost_channel_select')
                            .setPlaceholder('Select channel for meme posts')
                            .addChannelTypes(ChannelType.GuildText)
                    );

                const embed = new EmbedBuilder()
                    .setColor('#3498db')
                    .setTitle('Configuration - Step 1 of 4')
                    .setDescription('Select the channel where memes will be posted')
                    .setFooter({ text: 'Auto-Post Configuration' });

                await interaction.update({
                    embeds: [embed],
                    components: [channelRow]
                }).catch(() => {});
                return true;
            }

        // Statistics button - Show detailed stats
        if (action === 'stats') {
            await interaction.deferReply({ ephemeral: true }).catch(() => {});
            const state = getAutoPosterState(interaction.guildId);
            
            if (!state.running) {
                await interaction.editReply({ 
                    content: 'Auto-posting is not currently active. No statistics available.'
                });
                return true;
            }

            const channel = interaction.client.channels.cache.get(state.channelId);
            const nextPostTime = Math.floor((Date.now() + state.intervalSeconds * 1000) / 1000);
            const uptime = state.startTime ? Math.floor((Date.now() - state.startTime) / 1000) : 0;
            const hours = Math.floor(uptime / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);

            const embed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setTitle('Auto-Post Statistics')
                .setDescription('Detailed information about the current auto-posting session')
                .addFields(
                    { name: 'Configuration', value: '\u200b', inline: false },
                    { name: 'Target Channel', value: channel ? `${channel}` : 'Unknown', inline: true },
                    { name: 'Post Interval', value: `${state.intervalSeconds} seconds`, inline: true },
                    { name: 'Ping Role', value: state.pingRoleId ? `<@&${state.pingRoleId}>` : 'None', inline: true },
                    { name: '\u200b', value: '\u200b', inline: false },
                    { name: 'Activity', value: '\u200b', inline: false },
                    { name: 'Total Posts', value: `${state.totalPosts || 0}`, inline: true },
                    { name: 'Session Uptime', value: `${hours}h ${minutes}m`, inline: true },
                    { name: 'Next Post', value: `<t:${nextPostTime}:R>`, inline: true },
                    { name: '\u200b', value: '\u200b', inline: false },
                    { name: 'Content Sources', value: '\u200b', inline: false },
                    { name: 'Total Subreddits', value: `${subreddits.length}`, inline: true },
                    { name: 'Auto-React', value: state.autoReact && state.autoReact.length > 0 ? state.autoReact.join(' ') : 'Disabled', inline: true }
                )
                .addFields({
                    name: 'Top Subreddits',
                    value: subreddits.slice(0, 15).map((s, i) => `${i + 1}. r/${s}`).join('\n'),
                    inline: false
                })
                .setTimestamp()
                .setFooter({ text: 'Auto-Post Statistics' });

            const buttonRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('autopost_refresh_stats')
                        .setLabel('Refresh')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('autopost_back_main')
                        .setLabel('Back to Menu')
                        .setStyle(ButtonStyle.Primary)
                );

            await interaction.editReply({ embeds: [embed], components: [buttonRow] });
            return true;
        }

        // Refresh statistics
        if (action === 'refresh' && interaction.customId === 'autopost_refresh_stats') {
            const state = getAutoPosterState(interaction.guild.id);
            
            if (!state.running) {
                await interaction.update({ 
                    content: 'Auto-posting is not currently active. No statistics available.',
                    embeds: [],
                    components: []
                }).catch(() => {});
                return true;
            }

            const channel = interaction.client.channels.cache.get(state.channelId);
            const nextPostTime = Math.floor((Date.now() + state.intervalSeconds * 1000) / 1000);
            const uptime = state.startTime ? Math.floor((Date.now() - state.startTime) / 1000) : 0;
            const hours = Math.floor(uptime / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);

            const embed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setTitle('Auto-Post Statistics')
                .setDescription('Detailed information about the current auto-posting session')
                .addFields(
                    { name: 'Configuration', value: '\u200b', inline: false },
                    { name: 'Target Channel', value: channel ? `${channel}` : 'Unknown', inline: true },
                    { name: 'Post Interval', value: `${state.intervalSeconds} seconds`, inline: true },
                    { name: 'Ping Role', value: state.pingRoleId ? `<@&${state.pingRoleId}>` : 'None', inline: true },
                    { name: '\u200b', value: '\u200b', inline: false },
                    { name: 'Activity', value: '\u200b', inline: false },
                    { name: 'Total Posts', value: `${state.totalPosts || 0}`, inline: true },
                    { name: 'Session Uptime', value: `${hours}h ${minutes}m`, inline: true },
                    { name: 'Next Post', value: `<t:${nextPostTime}:R>`, inline: true },
                    { name: '\u200b', value: '\u200b', inline: false },
                    { name: 'Content Sources', value: '\u200b', inline: false },
                    { name: 'Total Subreddits', value: `${subreddits.length}`, inline: true },
                    { name: 'Auto-React', value: state.autoReact && state.autoReact.length > 0 ? state.autoReact.join(' ') : 'Disabled', inline: true }
                )
                .addFields({
                    name: 'Top Subreddits',
                    value: subreddits.slice(0, 15).map((s, i) => `${i + 1}. r/${s}`).join('\n'),
                    inline: false
                })
                .setTimestamp()
                .setFooter({ text: 'Auto-Post Statistics' });

            const buttonRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('autopost_refresh_stats')
                        .setLabel('Refresh')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('autopost_back_main')
                        .setLabel('Back to Menu')
                        .setStyle(ButtonStyle.Primary)
                );

            await interaction.update({ embeds: [embed], components: [buttonRow] });
            return true;
        }

        // Back to main menu from statistics
        if (action === 'back' && interaction.customId === 'autopost_back_main') {
            const state = getAutoPosterState(interaction.guild.id);
            
            const embed = new EmbedBuilder()
                .setColor(state.running ? '#2ecc71' : '#95a5a6')
                .setTitle('Auto-Post Manager')
                .setDescription(state.running 
                    ? 'Status: Active'
                    : 'Status: Inactive'
                );

            if (state.running) {
                const channel = interaction.client.channels.cache.get(state.channelId);
                embed.addFields(
                    { name: 'Channel', value: channel ? `${channel}` : 'Unknown', inline: true },
                    { name: 'Interval', value: `${state.intervalSeconds}s`, inline: true }
                );
            }

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('autopost_configure')
                        .setLabel(state.running ? 'Configure' : 'Setup')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('autopost_stats')
                        .setLabel('Statistics')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('autopost_stop')
                        .setLabel('Stop')
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(!state.running)
                );

            await interaction.update({ embeds: [embed], components: [row] }).catch(() => {});
            return true;
        }

        // Stop button - Stop auto-posting
        if (action === 'stop') {
            stopAutoPoster(interaction.guild.id);
            
            const embed = new EmbedBuilder()
                .setColor('#e74c3c')
                .setTitle('Auto-Post Stopped')
                .setDescription('Auto-posting has been successfully stopped.')
                .setTimestamp();

            await interaction.update({
                embeds: [embed],
                components: []
            }).catch(() => {});
            return true;
        }

        // Continue button - After role selection
        if (action === 'continue') {
            const setupData = interaction.client.autopostSetup?.get(interaction.user.id);
            
            if (!setupData || !setupData.channelId) {
                await interaction.reply({ 
                    content: 'Configuration data not found. Please start over with /autopost', 
                    ephemeral: true 
                }).catch(() => {});
                return true;
            }

            const modal = new ModalBuilder()
                .setCustomId('autopost_config_modal')
                .setTitle('Auto-Post Configuration');

            const intervalInput = new TextInputBuilder()
                .setCustomId('interval')
                .setLabel('Post interval in seconds')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Minimum: 10 seconds')
                .setValue('60')
                .setRequired(true)
                .setMinLength(2)
                .setMaxLength(6);

            const reactInput = new TextInputBuilder()
                .setCustomId('reactions')
                .setLabel('Auto-react emojis (space separated)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Example: 👍 😂 ❤️ (leave empty to disable)')
                .setRequired(false)
                .setMaxLength(100);

            const row1 = new ActionRowBuilder().addComponents(intervalInput);
            const row2 = new ActionRowBuilder().addComponents(reactInput);
            modal.addComponents(row1, row2);

            await interaction.showModal(modal).catch(() => {});
            return true;
        }

        // Back to channel selection
        if (action === 'back' && interaction.customId === 'autopost_back_channel') {
            const channelRow = new ActionRowBuilder()
                .addComponents(
                    new ChannelSelectMenuBuilder()
                        .setCustomId('autopost_channel_select')
                        .setPlaceholder('Select channel for meme posts')
                        .addChannelTypes(ChannelType.GuildText)
                );

            const embed = new EmbedBuilder()
                .setColor('#3498db')
                .setTitle('Configuration - Step 1 of 4')
                .setDescription('Select the channel where memes will be posted')
                .setFooter({ text: 'Auto-Post Configuration' });

            await interaction.update({
                embeds: [embed],
                components: [channelRow]
            }).catch(() => {});
            return true;
        }

        // Back to role selection
        if (action === 'back' && interaction.customId === 'autopost_back_role') {
            const setupData = interaction.client.autopostSetup?.get(interaction.user.id);
            
            if (!setupData) {
                await interaction.update({ 
                    content: 'Configuration data not found. Please start over with /autopost',
                    embeds: [],
                    components: []
                }).catch(() => {});
                return true;
            }

            const embed = new EmbedBuilder()
                .setColor('#3498db')
                .setTitle('Configuration - Step 2 of 4')
                .setDescription('Select a role to ping with each meme post (optional)')
                .addFields(
                    { name: 'Selected Channel', value: `<#${setupData.channelId}>`, inline: false }
                )
                .setFooter({ text: 'Auto-Post Configuration' });

            const roleRow = new ActionRowBuilder()
                .addComponents(
                    new RoleSelectMenuBuilder()
                        .setCustomId('autopost_role_select')
                        .setPlaceholder('Select role to ping (optional)')
                );

            const buttonRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('autopost_back_channel')
                        .setLabel('Back')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('autopost_skip')
                        .setLabel('Skip')
                        .setStyle(ButtonStyle.Secondary)
                );

            await interaction.update({
                embeds: [embed],
                components: [roleRow, buttonRow]
            }).catch(() => {});
            return true;
        }

        // Skip role button
        if (action === 'skip') {
            const setupData = interaction.client.autopostSetup?.get(interaction.user.id);
            
            if (!setupData) {
                await interaction.update({ 
                    content: 'Configuration data not found. Please start over with /autopost',
                    embeds: [],
                    components: []
                }).catch(() => {});
                return true;
            }

            setupData.roleId = null;
            interaction.client.autopostSetup.set(interaction.user.id, setupData);

            const embed = new EmbedBuilder()
                .setColor('#3498db')
                .setTitle('Configuration - Step 3 of 4')
                .setDescription('Role selection skipped. Click Continue to proceed with final configuration.')
                .addFields(
                    { name: 'Selected Channel', value: `<#${setupData.channelId}>`, inline: true },
                    { name: 'Ping Role', value: 'None', inline: true }
                )
                .setFooter({ text: 'Auto-Post Configuration' });

            const buttonRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('autopost_back_role')
                        .setLabel('Back')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('autopost_continue')
                        .setLabel('Continue')
                        .setStyle(ButtonStyle.Primary)
                );

            await interaction.update({
                embeds: [embed],
                components: [buttonRow]
            }).catch(() => {});
            return true;
        }
    }

    // ==================== CHANNEL SELECT HANDLER ====================
    if (interaction.isChannelSelectMenu() && interaction.customId === 'autopost_channel_select') {
        await interaction.deferUpdate().catch(() => {});
        
        const selectedChannel = interaction.channels.first();
        
        if (!interaction.client.autopostSetup) {
            interaction.client.autopostSetup = new Map();
        }
        
        const setupData = interaction.client.autopostSetup.get(interaction.user.id) || {};
        setupData.channelId = selectedChannel.id;
        interaction.client.autopostSetup.set(interaction.user.id, setupData);

        const embed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle('Configuration - Step 2 of 4')
            .setDescription('Select a role to ping with each meme post (optional)')
            .addFields(
                { name: 'Selected Channel', value: `${selectedChannel}`, inline: false }
            )
            .setFooter({ text: 'Auto-Post Configuration' });

        const roleRow = new ActionRowBuilder()
            .addComponents(
                new RoleSelectMenuBuilder()
                    .setCustomId('autopost_role_select')
                    .setPlaceholder('Select role to ping (optional)')
            );

        const buttonRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('autopost_back_channel')
                    .setLabel('Back')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('autopost_skip')
                    .setLabel('Skip')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.editReply({
            embeds: [embed],
            components: [roleRow, buttonRow]
        }).catch(() => {});
        return true;
    }

    // ==================== ROLE SELECT HANDLER ====================
    if (interaction.isRoleSelectMenu() && interaction.customId === 'autopost_role_select') {
        await interaction.deferUpdate().catch(() => {});
        
        const selectedRole = interaction.roles.first();
        
        if (!interaction.client.autopostSetup) {
            interaction.client.autopostSetup = new Map();
        }
        
        const setupData = interaction.client.autopostSetup.get(interaction.user.id) || {};
        setupData.roleId = selectedRole?.id;
        interaction.client.autopostSetup.set(interaction.user.id, setupData);

        const embed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle('Configuration - Step 3 of 4')
            .setDescription('Role selected. Click Continue to proceed with final configuration.')
            .addFields(
                { name: 'Selected Channel', value: `<#${setupData.channelId}>`, inline: true },
                { name: 'Ping Role', value: selectedRole ? `${selectedRole}` : 'None', inline: true }
            )
            .setFooter({ text: 'Auto-Post Configuration' });

        const buttonRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('autopost_back_role')
                    .setLabel('Back')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('autopost_continue')
                    .setLabel('Continue')
                    .setStyle(ButtonStyle.Primary)
            );

        await interaction.editReply({
            embeds: [embed],
            components: [buttonRow]
        }).catch(() => {});
        return true;
    }

    // ==================== MODAL SUBMISSION HANDLER ====================
    if (interaction.isModalSubmit() && interaction.customId === 'autopost_config_modal') {
        const intervalSec = parseInt(interaction.fields.getTextInputValue('interval'));
        const reactionsInput = interaction.fields.getTextInputValue('reactions').trim();
        const reactions = reactionsInput ? reactionsInput.split(/\s+/).filter(r => r.length > 0) : [];
        
        if (isNaN(intervalSec) || intervalSec < 10) {
            await interaction.reply({ 
                content: 'Invalid interval. Must be a number greater than or equal to 10 seconds.', 
                ephemeral: true 
            }).catch(() => {});
            return true;
        }

        const setupData = interaction.client.autopostSetup?.get(interaction.user.id);
        
        if (!setupData || !setupData.channelId) {
            await interaction.reply({ 
                content: 'Configuration data not found. Please start over with /autopost', 
                ephemeral: true 
            }).catch(() => {});
            return true;
        }

        const success = updateInterval(
            interaction.client, 
            intervalSec * 1000, 
            setupData.channelId, 
            setupData.roleId,
            reactions
        );

        if (success) {
            const channel = interaction.client.channels.cache.get(setupData.channelId);
            const nextPostTime = Math.floor((Date.now() + intervalSec * 1000) / 1000);
            
            const embed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setTitle('Auto-Post Activated')
                .setDescription('Configuration complete. Auto-posting is now active.')
                .addFields(
                    { name: 'Channel', value: channel ? `${channel}` : 'Unknown', inline: true },
                    { name: 'Interval', value: `${intervalSec} seconds`, inline: true },
                    { name: 'Ping Role', value: setupData.roleId ? `<@&${setupData.roleId}>` : 'None', inline: true },
                    { name: 'Auto-React', value: reactions.length > 0 ? reactions.join(' ') : 'Disabled', inline: true },
                    { name: 'Next Post', value: `<t:${nextPostTime}:R>`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'Auto-Post System' });

            interaction.client.autopostSetup.delete(interaction.user.id);
            await interaction.reply({ embeds: [embed], ephemeral: true }).catch(() => {});
        } else {
            await interaction.reply({ 
                content: 'Failed to start auto-posting. Please try again.', 
                ephemeral: true 
            }).catch(() => {});
        }
        return true;
    }

    return false;
    } catch (error) {
        console.error('Autopost interaction error:', error);
        // Try to respond if we haven't already
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ 
                content: 'An error occurred processing your request. Please try again.', 
                ephemeral: true 
            }).catch(() => {});
        }
        return true;
    }
}

module.exports = { 
  name: 'interactionCreate',
  handleAutopostInteractions 
};
