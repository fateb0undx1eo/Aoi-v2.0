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
    // Button handlers
    if (interaction.isButton() && interaction.customId.startsWith('autopost_')) {
        const action = interaction.customId.split('_')[1];

        if (action === 'setup') {
            const channelRow = new ActionRowBuilder()
                .addComponents(
                    new ChannelSelectMenuBuilder()
                        .setCustomId('autopost_channel_select')
                        .setPlaceholder('Select a channel for memes')
                        .addChannelTypes(ChannelType.GuildText)
                );

            await interaction.update({
                content: '**Step 1/3:** Select the channel for meme posts',
                embeds: [],
                components: [channelRow]
            });
            return true;
        }

        if (action === 'stats') {
            const state = getAutoPosterState();
            const channel = interaction.client.channels.cache.get(state.channelId);
            const nextPostTime = Math.floor((Date.now() + state.intervalSeconds * 1000) / 1000);

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('Auto-Post Statistics')
                .addFields(
                    { name: 'Channel', value: channel ? `${channel}` : 'Unknown', inline: true },
                    { name: 'Interval', value: `${state.intervalSeconds}s`, inline: true },
                    { name: 'Ping Role', value: state.pingRoleId ? `<@&${state.pingRoleId}>` : 'None', inline: true },
                    { name: 'Next Post', value: `<t:${nextPostTime}:R>`, inline: true },
                    { name: 'Total Posts', value: `${state.totalPosts || 0}`, inline: true },
                    { name: 'Subreddits', value: `${subreddits.length}`, inline: true },
                    { name: 'Auto-React', value: state.autoReact && state.autoReact.length > 0 ? state.autoReact.join(' ') : 'None', inline: true }
                )
                .setDescription(`**Top Subreddits:**\n${subreddits.slice(0, 10).map(s => `• r/${s}`).join('\n')}`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
            return true;
        }

        if (action === 'stop') {
            stopAutoPoster();
            await interaction.update({
                content: '✅ Auto-posting has been stopped.',
                embeds: [],
                components: []
            });
            return true;
        }

        if (action === 'skip' && interaction.customId === 'autopost_skip_role') {
            await interaction.deferUpdate().catch(console.error);
            
            const modal = new ModalBuilder()
                .setCustomId('autopost_config_modal')
                .setTitle('Configure Auto-Post');

            const intervalInput = new TextInputBuilder()
                .setCustomId('interval')
                .setLabel('Interval in seconds (minimum 10)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('60')
                .setRequired(true)
                .setMinLength(2)
                .setMaxLength(6);

            const reactInput = new TextInputBuilder()
                .setCustomId('reactions')
                .setLabel('Auto-react emojis (optional)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('👍 👎 😂')
                .setRequired(false)
                .setMaxLength(100);

            const row1 = new ActionRowBuilder().addComponents(intervalInput);
            const row2 = new ActionRowBuilder().addComponents(reactInput);
            modal.addComponents(row1, row2);

            await interaction.showModal(modal).catch(console.error);
            return true;
        }
    }

    // Channel select handler
    if (interaction.isChannelSelectMenu() && interaction.customId === 'autopost_channel_select') {
        await interaction.deferUpdate().catch(console.error);
        
        const selectedChannel = interaction.channels.first();
        
        if (!interaction.client.autopostSetup) interaction.client.autopostSetup = new Map();
        
        const setupData = interaction.client.autopostSetup.get(interaction.user.id) || {};
        setupData.channelId = selectedChannel.id;
        interaction.client.autopostSetup.set(interaction.user.id, setupData);

        const roleRow = new ActionRowBuilder()
            .addComponents(
                new RoleSelectMenuBuilder()
                    .setCustomId('autopost_role_select')
                    .setPlaceholder('Select a role to ping (optional)')
            );

        const buttonRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('autopost_skip_role')
                    .setLabel('Skip')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.editReply({
            content: `✅ Channel selected: ${selectedChannel}\n\n**Step 2/3:** Select a role to ping (optional)`,
            components: [roleRow, buttonRow]
        }).catch(console.error);
        return true;
    }

    // Role select handler
    if (interaction.isRoleSelectMenu() && interaction.customId === 'autopost_role_select') {
        const selectedRole = interaction.roles.first();
        
        if (!interaction.client.autopostSetup) interaction.client.autopostSetup = new Map();
        
        const setupData = interaction.client.autopostSetup.get(interaction.user.id) || {};
        setupData.roleId = selectedRole?.id;
        interaction.client.autopostSetup.set(interaction.user.id, setupData);

        const modal = new ModalBuilder()
            .setCustomId('autopost_config_modal')
            .setTitle('Configure Auto-Post');

        const intervalInput = new TextInputBuilder()
            .setCustomId('interval')
            .setLabel('Interval in seconds (minimum 10)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('60')
            .setRequired(true)
            .setMinLength(2)
            .setMaxLength(6);

        const reactInput = new TextInputBuilder()
            .setCustomId('reactions')
            .setLabel('Auto-react emojis (optional)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('👍 👎 😂')
            .setRequired(false)
            .setMaxLength(100);

        const row1 = new ActionRowBuilder().addComponents(intervalInput);
        const row2 = new ActionRowBuilder().addComponents(reactInput);
        modal.addComponents(row1, row2);

        await interaction.showModal(modal).catch(err => {
            console.error('Error showing modal:', err);
            interaction.reply({ content: '❌ Failed to open modal. Please try again.', ephemeral: true }).catch(() => {});
        });
        return true;
    }

    // Modal submission handler
    if (interaction.isModalSubmit() && interaction.customId === 'autopost_config_modal') {
        const intervalSec = parseInt(interaction.fields.getTextInputValue('interval'));
        const reactionsInput = interaction.fields.getTextInputValue('reactions').trim();
        const reactions = reactionsInput ? reactionsInput.split(/\s+/) : [];
        
        if (isNaN(intervalSec) || intervalSec < 10) {
            return interaction.reply({ 
                content: '❌ Invalid interval. Must be a number >= 10 seconds.', 
                ephemeral: true 
            }).catch(console.error);
        }

        const setupData = interaction.client.autopostSetup?.get(interaction.user.id);
        
        if (!setupData || !setupData.channelId) {
            return interaction.reply({ 
                content: '❌ Setup data not found. Please start over with /autopost', 
                ephemeral: true 
            }).catch(console.error);
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
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('Auto-Post Started')
                .setDescription(`Memes will be posted every **${intervalSec} seconds** in ${channel}`)
                .addFields(
                    { name: 'Ping Role', value: setupData.roleId ? `<@&${setupData.roleId}>` : 'None', inline: true },
                    { name: 'Auto-React', value: reactions.length > 0 ? reactions.join(' ') : 'None', inline: true },
                    { name: 'Next Post', value: `<t:${Math.floor((Date.now() + intervalSec * 1000) / 1000)}:R>`, inline: true }
                )
                .setTimestamp();

            interaction.client.autopostSetup.delete(interaction.user.id);
            await interaction.reply({ embeds: [embed], ephemeral: true }).catch(console.error);
        } else {
            await interaction.reply({ content: '❌ Failed to start auto-post.', ephemeral: true }).catch(console.error);
        }
        return true;
    }

    return false;
}

module.exports = { handleAutopostInteractions };
