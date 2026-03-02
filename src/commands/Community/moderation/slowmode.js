const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slowmode')
        .setDescription('» Set slowmode delay for a channel')
        .addIntegerOption(option =>
            option
                .setName('seconds')
                .setDescription('Slowmode delay in seconds (0 to disable, max 21600)')
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(21600)
        )
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('Channel to set slowmode (defaults to current channel)')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason for setting slowmode')
                .setRequired(false)
        ),

    userPermissions: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.ManageChannels],

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const seconds = interaction.options.getInteger('seconds');
            const channel = interaction.options.getChannel('channel') || interaction.channel;
            const reason = interaction.options.getString('reason') || 'No reason provided';

            // Set slowmode
            await channel.setRateLimitPerUser(seconds, `${reason} | Set by ${interaction.user.tag}`);

            // Format time display
            const timeDisplay = seconds === 0 ? 'Disabled' : formatTime(seconds);

            // Success embed
            const successEmbed = new EmbedBuilder()
                .setColor(seconds === 0 ? 0x00FF00 : 0xFFAA00)
                .setTitle(seconds === 0 ? '✅ Slowmode Disabled' : '⏱️ Slowmode Enabled')
                .addFields(
                    { name: '📍 Channel', value: `${channel.name}`, inline: true },
                    { name: '⏰ Delay', value: timeDisplay, inline: true },
                    { name: '👮 Moderator', value: interaction.user.tag, inline: true },
                    { name: '📋 Reason', value: reason }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [successEmbed] });

            // Log to mod log channel
            const logChannel = interaction.guild.channels.cache.find(
                ch => ch.name === 'mod-logs' || ch.name === 'moderation-logs'
            );

            if (logChannel && logChannel.id !== channel.id) {
                const logEmbed = new EmbedBuilder()
                    .setColor(seconds === 0 ? 0x00FF00 : 0xFFAA00)
                    .setTitle(seconds === 0 ? '✅ Slowmode Disabled' : '⏱️ Slowmode Enabled')
                    .addFields(
                        { name: '📍 Channel', value: `${channel.name} (${channel.id})` },
                        { name: '⏰ Delay', value: timeDisplay },
                        { name: '👮 Moderator', value: `${interaction.user.tag} (${interaction.user.id})` },
                        { name: '📋 Reason', value: reason }
                    )
                    .setTimestamp();

                await logChannel.send({ embeds: [logEmbed] });
            }

        } catch (error) {
            console.error('Slowmode command error:', error);
            await interaction.editReply('❌ Failed to set slowmode. Please check my permissions and try again.');
        }
    }
};

function formatTime(seconds) {
    if (seconds < 60) return `${seconds} seconds`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
    return `${Math.floor(seconds / 3600)} hours`;
}
