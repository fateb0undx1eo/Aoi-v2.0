const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('» Unban a user from the server')
        .addStringOption(option =>
            option
                .setName('user_id')
                .setDescription('User ID to unban')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason for unbanning')
                .setRequired(false)
        ),

    userPermissions: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.BanMembers],

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const userId = interaction.options.getString('user_id');
            const reason = interaction.options.getString('reason') || 'No reason provided';

            // Check if user is banned
            const bans = await interaction.guild.bans.fetch();
            const bannedUser = bans.get(userId);

            if (!bannedUser) {
                return interaction.editReply('❌ This user is not banned!');
            }

            // Unban the user
            await interaction.guild.members.unban(userId, `${reason} | Unbanned by ${interaction.user.tag}`);

            // Success embed
            const successEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ User Unbanned Successfully')
                .addFields(
                    { name: '👤 User', value: `${bannedUser.user.tag} (${userId})`, inline: true },
                    { name: '👮 Moderator', value: interaction.user.tag, inline: true },
                    { name: '📋 Reason', value: reason }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [successEmbed] });

            // Log to mod log channel
            const logChannel = interaction.guild.channels.cache.find(
                ch => ch.name === 'mod-logs' || ch.name === 'moderation-logs'
            );

            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('🔓 User Unbanned')
                    .setThumbnail(bannedUser.user.displayAvatarURL())
                    .addFields(
                        { name: '👤 User', value: `${bannedUser.user.tag} (${userId})` },
                        { name: '👮 Moderator', value: `${interaction.user.tag} (${interaction.user.id})` },
                        { name: '📋 Reason', value: reason }
                    )
                    .setTimestamp();

                await logChannel.send({ embeds: [logEmbed] });
            }

        } catch (error) {
            console.error('Unban command error:', error);
            await interaction.editReply('❌ Failed to unban user. Please check the user ID and try again.');
        }
    }
};
