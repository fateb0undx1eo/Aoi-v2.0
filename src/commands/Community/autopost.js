const { 
    SlashCommandBuilder, 
    ChannelType, 
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ChannelSelectMenuBuilder,
    RoleSelectMenuBuilder
} = require('discord.js');
const { startAutoPoster, updateInterval, stopAutoPoster, getAutoPosterState } = require('../../functions/handlers/autoPoster');
const subreddits = require('../../functions/handlers/subreddits');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autopost')
        .setDescription('Manage meme auto-posting with interactive setup'),

    async execute(interaction, client) {
        if (!interaction.memberPermissions?.has('Administrator')) {
            return interaction.reply({ content: "❌ Only admins can use this command.", ephemeral: true });
        }

        // Show main menu with buttons
        const state = getAutoPosterState();
        
        const embed = new EmbedBuilder()
            .setColor(state.running ? '#00ff00' : '#ff9900')
            .setTitle('🎭 Meme Auto-Post Manager')
            .setDescription(state.running 
                ? '✅ Auto-posting is currently **active**\n\nChoose an action below:'
                : '⚠️ Auto-posting is currently **inactive**\n\nChoose an action below:'
            );

        if (state.running) {
            const channel = client.channels.cache.get(state.channelId);
            const nextPostTime = Math.floor((Date.now() + state.intervalSeconds * 1000) / 1000);
            
            embed.addFields(
                { name: '📺 Channel', value: channel ? `${channel}` : 'Unknown', inline: true },
                { name: '⏱️ Interval', value: `${state.intervalSeconds}s`, inline: true },
                { name: '📢 Ping Role', value: state.pingRoleId ? `<@&${state.pingRoleId}>` : 'None', inline: true },
                { name: '⏰ Next Post', value: `<t:${nextPostTime}:R>`, inline: true },
                { name: '📈 Total Posts', value: `${state.totalPosts || 0}`, inline: true },
                { name: '📚 Subreddits', value: `${subreddits.length}`, inline: true }
            );
        }

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('autopost_setup')
                    .setLabel(state.running ? 'Reconfigure' : 'Start Setup')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('⚙️'),
                new ButtonBuilder()
                    .setCustomId('autopost_stats')
                    .setLabel('View Stats')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📊')
                    .setDisabled(!state.running),
                new ButtonBuilder()
                    .setCustomId('autopost_stop')
                    .setLabel('Stop')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🛑')
                    .setDisabled(!state.running)
            );

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }
};
