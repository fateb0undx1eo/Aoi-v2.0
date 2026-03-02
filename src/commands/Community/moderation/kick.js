const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('» Kick a member from the server with detailed logging')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('User to kick')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason for kick')
                .setRequired(true)
        )
        .addBooleanOption(option =>
            option
                .setName('silent')
                .setDescription('Silent kick (no DM to user)')
                .setRequired(false)
        ),

    userPermissions: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.KickMembers],

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const targetUser = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason');
            const silent = interaction.options.getBoolean('silent') || false;

            const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

            if (!member) {
                return interaction.editReply('❌ User is not in this server!');
            }

            // Hierarchy checks
            if (member.id === interaction.user.id) {
                return interaction.editReply('❌ You cannot kick yourself!');
            }

            if (member.id === interaction.guild.ownerId) {
                return interaction.editReply('❌ Cannot kick the server owner!');
            }

            if (member.roles.highest.position >= interaction.member.roles.highest.position) {
                return interaction.editReply('❌ You cannot kick someone with equal or higher role!');
            }

            if (member.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
                return interaction.editReply('❌ I cannot kick someone with equal or higher role than me!');
            }

            // DM user before kick (unless silent)
            if (!silent) {
                const dmEmbed = new EmbedBuilder()
                    .setColor(0xFFA500)
                    .setTitle('👢 You have been kicked')
                    .setDescription(`You have been kicked from **${interaction.guild.name}**`)
                    .addFields(
                        { name: '📋 Reason', value: reason },
                        { name: '👮 Moderator', value: interaction.user.tag },
                        { name: '📅 Date', value: `<t:${Math.floor(Date.now() / 1000)}:F>` },
                        { name: '🔗 Rejoin', value: 'You can rejoin with a new invite link' }
                    )
                    .setTimestamp();

                await targetUser.send({ embeds: [dmEmbed] }).catch(() => {});
            }

            // Execute kick
            await member.kick(`${reason} | Moderator: ${interaction.user.tag}`);

            // Success embed
            const successEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ User Kicked Successfully')
                .addFields(
                    { name: '👤 User', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: '👮 Moderator', value: interaction.user.tag, inline: true },
                    { name: '📋 Reason', value: reason },
                    { name: '🔇 Silent', value: silent ? 'Yes' : 'No', inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [successEmbed] });

            // Log to mod log channel
            const logChannel = interaction.guild.channels.cache.find(
                ch => ch.name === 'mod-logs' || ch.name === 'moderation-logs'
            );

            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor(0xFFA500)
                    .setTitle('👢 Member Kicked')
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
            console.error('Kick command error:', error);
            await interaction.editReply('❌ Failed to kick user. Please check my permissions and try again.');
        }
    }
};
