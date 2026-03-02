const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unlock')
        .setDescription('» Unlock a channel to allow members to send messages')
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('Channel to unlock (defaults to current channel)')
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason for unlocking the channel')
                .setRequired(false)
        )
        .addBooleanOption(option =>
            option
                .setName('announce')
                .setDescription('Send announcement in channel about unlock')
                .setRequired(false)
        ),

    userPermissions: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.ManageChannels],

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const channel = interaction.options.getChannel('channel') || interaction.channel;
            const reason = interaction.options.getString('reason') || 'No reason provided';
            const announce = interaction.options.getBoolean('announce') ?? true;

            // Unlock the channel by allowing SendMessages for @everyone
            await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                SendMessages: null
            }, { reason: `Unlocked by ${interaction.user.tag}: ${reason}` });

            // Success embed
            const successEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🔓 Channel Unlocked')
                .addFields(
                    { name: '📍 Channel', value: `${channel.name}`, inline: true },
                    { name: '👮 Moderator', value: interaction.user.tag, inline: true },
                    { name: '📋 Reason', value: reason }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [successEmbed] });

            // Announce in channel
            if (announce) {
                const announceEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('🔓 Channel Unlocked')
                    .setDescription('This channel has been unlocked. You can now send messages.')
                    .addFields(
                        { name: '📋 Reason', value: reason },
                        { name: '👮 Moderator', value: interaction.user.tag }
                    )
                    .setTimestamp();

                await channel.send({ embeds: [announceEmbed] });
            }

            // Log to mod log channel
            const logChannel = interaction.guild.channels.cache.find(
                ch => ch.name === 'mod-logs' || ch.name === 'moderation-logs'
            );

            if (logChannel && logChannel.id !== channel.id) {
                const logEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('🔓 Channel Unlocked')
                    .addFields(
                        { name: '📍 Channel', value: `${channel.name} (${channel.id})` },
                        { name: '👮 Moderator', value: `${interaction.user.tag} (${interaction.user.id})` },
                        { name: '📋 Reason', value: reason }
                    )
                    .setTimestamp();

                await logChannel.send({ embeds: [logEmbed] });
            }

        } catch (error) {
            console.error('Unlock command error:', error);
            await interaction.editReply('❌ Failed to unlock channel. Please check my permissions and try again.');
        }
    }
};
