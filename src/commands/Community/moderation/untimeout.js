const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('untimeout')
        .setDescription('» Remove timeout from a member')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('User to remove timeout from')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason for removing timeout')
                .setRequired(false)
        ),

    userPermissions: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.ModerateMembers],

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const targetUser = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason') || 'No reason provided';

            const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

            if (!member) {
                return interaction.editReply('❌ User is not in this server!');
            }

            if (!member.communicationDisabledUntil) {
                return interaction.editReply('❌ This user is not timed out!');
            }

            // Remove timeout
            await member.timeout(null, `${reason} | Removed by ${interaction.user.tag}`);

            // Success embed
            const successEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Timeout Removed Successfully')
                .addFields(
                    { name: '👤 User', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: '👮 Moderator', value: interaction.user.tag, inline: true },
                    { name: '📋 Reason', value: reason }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [successEmbed] });

            // DM user
            const dmEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Your timeout has been removed')
                .setDescription(`Your timeout in **${interaction.guild.name}** has been removed.`)
                .addFields(
                    { name: '📋 Reason', value: reason },
                    { name: '👮 Moderator', value: interaction.user.tag }
                )
                .setTimestamp();

            await targetUser.send({ embeds: [dmEmbed] }).catch(() => {});

            // Log to mod log channel
            const logChannel = interaction.guild.channels.cache.find(
                ch => ch.name === 'mod-logs' || ch.name === 'moderation-logs'
            );

            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('⏰ Timeout Removed')
                    .setThumbnail(targetUser.displayAvatarURL())
                    .addFields(
                        { name: '👤 User', value: `${targetUser.tag} (${targetUser.id})` },
                        { name: '👮 Moderator', value: `${interaction.user.tag} (${interaction.user.id})` },
                        { name: '📋 Reason', value: reason }
                    )
                    .setTimestamp();

                await logChannel.send({ embeds: [logEmbed] });
            }

        } catch (error) {
            console.error('Untimeout command error:', error);
            await interaction.editReply('❌ Failed to remove timeout. Please check my permissions and try again.');
        }
    }
};
