const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lock')
        .setDescription('» Lock a channel to prevent members from sending messages')
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('Channel to lock (defaults to current channel)')
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason for locking the channel')
                .setRequired(false)
        )
        .addBooleanOption(option =>
            option
                .setName('announce')
                .setDescription('Send announcement in channel about lock')
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

            // Lock the channel by denying SendMessages for @everyone
            await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                SendMessages: false
            }, { reason: `Locked by ${interaction.user.tag}: ${reason}` });

            // Success embed
            const successEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('🔒 Channel Locked')
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
                    .setColor(0xFF0000)
                    .setTitle('🔒 Channel Locked')
                    .setDescription('This channel has been locked. Only moderators can send messages.')
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
                    .setColor(0xFF0000)
                    .setTitle('🔒 Channel Locked')
                    .addFields(
                        { name: '📍 Channel', value: `${channel.name} (${channel.id})` },
                        { name: '👮 Moderator', value: `${interaction.user.tag} (${interaction.user.id})` },
                        { name: '📋 Reason', value: reason }
                    )
                    .setTimestamp();

                await logChannel.send({ embeds: [logEmbed] });
            }

        } catch (error) {
            console.error('Lock command error:', error);
            await interaction.editReply('❌ Failed to lock channel. Please check my permissions and try again.');
        }
    }
};
