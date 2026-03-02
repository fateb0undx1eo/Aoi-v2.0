const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nuke')
        .setDescription('» Clone and delete a channel to clear all messages instantly')
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('Channel to nuke (defaults to current channel)')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason for nuking the channel')
                .setRequired(false)
        ),

    userPermissions: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.ManageChannels],

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const channel = interaction.options.getChannel('channel') || interaction.channel;
            const reason = interaction.options.getString('reason') || 'Channel nuked';

            // Store channel properties
            const position = channel.position;
            const name = channel.name;
            const topic = channel.topic;
            const nsfw = channel.nsfw;
            const rateLimitPerUser = channel.rateLimitPerUser;
            const parent = channel.parent;
            const permissionOverwrites = channel.permissionOverwrites.cache;

            // Clone the channel
            const newChannel = await channel.clone({
                name: name,
                topic: topic,
                nsfw: nsfw,
                rateLimitPerUser: rateLimitPerUser,
                parent: parent,
                permissionOverwrites: permissionOverwrites,
                position: position,
                reason: `Nuked by ${interaction.user.tag}: ${reason}`
            });

            // Delete the old channel
            await channel.delete(`Nuked by ${interaction.user.tag}: ${reason}`);

            // Send nuke message in new channel
            const nukeEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('💣 Channel Nuked!')
                .setDescription('This channel has been completely cleared.')
                .setImage('https://media.giphy.com/media/HhTXt43pk1I1W/giphy.gif')
                .addFields(
                    { name: '👮 Moderator', value: interaction.user.tag, inline: true },
                    { name: '📋 Reason', value: reason, inline: true }
                )
                .setTimestamp();

            await newChannel.send({ embeds: [nukeEmbed] });

            // Success message to moderator
            const successEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Channel Nuked Successfully')
                .addFields(
                    { name: '📍 Channel', value: name, inline: true },
                    { name: '👮 Moderator', value: interaction.user.tag, inline: true },
                    { name: '📋 Reason', value: reason }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [successEmbed] });

            // Log to mod log channel
            const logChannel = interaction.guild.channels.cache.find(
                ch => ch.name === 'mod-logs' || ch.name === 'moderation-logs'
            );

            if (logChannel && logChannel.id !== newChannel.id) {
                const logEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('💣 Channel Nuked')
                    .addFields(
                        { name: '📍 Channel', value: `${name} → ${newChannel.name}` },
                        { name: '🆔 Old ID', value: channel.id, inline: true },
                        { name: '🆔 New ID', value: newChannel.id, inline: true },
                        { name: '👮 Moderator', value: `${interaction.user.tag} (${interaction.user.id})` },
                        { name: '📋 Reason', value: reason }
                    )
                    .setTimestamp();

                await logChannel.send({ embeds: [logEmbed] });
            }

        } catch (error) {
            console.error('Nuke command error:', error);
            await interaction.editReply('❌ Failed to nuke channel. Please check my permissions and try again.');
        }
    }
};
