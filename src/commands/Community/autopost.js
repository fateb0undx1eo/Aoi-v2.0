const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getAutoPosterState } = require('../../functions/handlers/autoPoster');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autopost')
        .setDescription('Manage meme auto-posting'),

    async execute(interaction, client) {
        if (!interaction.memberPermissions?.has('Administrator')) {
            return interaction.reply({ content: "Only administrators can use this command.", ephemeral: true });
        }

        const state = getAutoPosterState(interaction.guild.id);
        
        const embed = new EmbedBuilder()
            .setColor(state.running ? '#2ecc71' : '#95a5a6')
            .setTitle('Auto-Post Manager')
            .setDescription(state.running 
                ? 'Status: Active'
                : 'Status: Inactive'
            );

        // Only show minimal info in main panel
        if (state.running) {
            const channel = client.channels.cache.get(state.channelId);
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

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }
};
