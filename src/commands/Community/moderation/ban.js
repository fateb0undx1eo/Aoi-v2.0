const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('» Advanced ban system with evidence logging and appeal tracking')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('User to ban')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason for ban')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName('delete_days')
                .setDescription('Delete messages from last X days (0-7)')
                .setMinValue(0)
                .setMaxValue(7)
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName('evidence')
                .setDescription('Evidence URL or message link')
                .setRequired(false)
        )
        .addBooleanOption(option =>
            option
                .setName('silent')
                .setDescription('Silent ban (no DM to user)')
                .setRequired(false)
        ),

    userPermissions: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.BanMembers],

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const targetUser = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason');
            const deleteDays = interaction.options.getInteger('delete_days') || 0;
            const evidence = interaction.options.getString('evidence');
            const silent = interaction.options.getBoolean('silent') || false;

            const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

            // Hierarchy check
            if (member) {
                if (member.id === interaction.user.id) {
                    return interaction.editReply('❌ You cannot ban yourself!');
                }

                if (member.id === interaction.guild.ownerId) {
                    return interaction.editReply('❌ Cannot ban the server owner!');
                }

                if (member.roles.highest.position >= interaction.member.roles.highest.position) {
                    return interaction.editReply('❌ You cannot ban someone with equal or higher role!');
                }

                if (member.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
                    return interaction.editReply('❌ I cannot ban someone with equal or higher role than me!');
                }
            }

            // DM user before ban (unless silent)
            if (!silent && member) {
                const dmEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('🔨 You have been banned')
                    .setDescription(`You have been banned from **${interaction.guild.name}**`)
                    .addFields(
                        { name: '📋 Reason', value: reason },
                        { name: '👮 Moderator', value: interaction.user.tag },
                        { name: '📅 Date', value: `<t:${Math.floor(Date.now() / 1000)}:F>` }
                    )
                    .setTimestamp();

                if (evidence) {
                    dmEmbed.addFields({ name: '🔍 Evidence', value: evidence });
                }

                await targetUser.send({ embeds: [dmEmbed] }).catch(() => {
                    // User has DMs disabled
                });
            }

            // Execute ban
            await interaction.guild.members.ban(targetUser.id, {
                deleteMessageSeconds: deleteDays * 24 * 60 * 60,
                reason: `${reason} | Moderator: ${interaction.user.tag}`
            });

            // Success embed
            const successEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ User Banned Successfully')
                .addFields(
                    { name: '👤 User', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: '👮 Moderator', value: interaction.user.tag, inline: true },
                    { name: '📋 Reason', value: reason },
                    { name: '🗑️ Messages Deleted', value: `${deleteDays} days`, inline: true },
                    { name: '🔇 Silent', value: silent ? 'Yes' : 'No', inline: true }
                )
                .setTimestamp();

            if (evidence) {
                successEmbed.addFields({ name: '🔍 Evidence', value: evidence });
            }

            await interaction.editReply({ embeds: [successEmbed] });

            // Log to mod log channel (if exists)
            const logChannel = interaction.guild.channels.cache.find(
                ch => ch.name === 'mod-logs' || ch.name === 'moderation-logs'
            );

            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('🔨 Member Banned')
                    .setThumbnail(targetUser.displayAvatarURL())
                    .addFields(
                        { name: '👤 User', value: `${targetUser.tag} (${targetUser.id})` },
                        { name: '👮 Moderator', value: `${interaction.user.tag} (${interaction.user.id})` },
                        { name: '📋 Reason', value: reason },
                        { name: '🗑️ Messages Deleted', value: `${deleteDays} days` }
                    )
                    .setTimestamp();

                if (evidence) {
                    logEmbed.addFields({ name: '🔍 Evidence', value: evidence });
                }

                await logChannel.send({ embeds: [logEmbed] });
            }

        } catch (error) {
            console.error('Ban command error:', error);
            await interaction.editReply('❌ Failed to ban user. Please check my permissions and try again.');
        }
    }
};
