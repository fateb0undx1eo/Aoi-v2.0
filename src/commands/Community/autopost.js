const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { startAutoPoster, updateInterval, stopAutoPoster, getAutoPosterState } = require('../../functions/handlers/autoPoster');

module.exports = {
    // Slash command registration
    data: new SlashCommandBuilder()
        .setName('autopost')
        .setDescription('Set or stop the meme auto-post interval (admin only)')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel where memes will be auto-posted')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(false)
        )
        .addIntegerOption(option =>
            option.setName('milliseconds')
                .setDescription('Interval in ms (min 10000). Leave empty to stop autopost.')
                .setRequired(false)
        ),

    // Slash command execution
    async execute(interaction, client) {
        // Check admin permissions
        if (!interaction.memberPermissions?.has('Administrator')) {
            return interaction.reply({ content: "❌ Only admins can use this command.", ephemeral: true });
        }

        const intervalMs = interaction.options.getInteger('milliseconds');
        const channel = interaction.options.getChannel('channel');

        // Stop autoposter if no interval provided
        if (!intervalMs) {
            stopAutoPoster();
            return interaction.reply({ content: "✅ Auto-post stopped.", ephemeral: true });
        }

        // Start or update autoposter
        const success = updateInterval(client, intervalMs, channel?.id);

        if (success) {
            const state = getAutoPosterState();
            return interaction.reply({ 
                content: `✅ Auto-post interval updated to ${intervalMs / 1000} seconds in <#${state.channelId}>.`, 
                ephemeral: true 
            });
        } else {
            return interaction.reply({ 
                content: "❌ Interval too low or autoposter not initialized. Min 10s.", 
                ephemeral: true 
            });
        }
    }
};
