const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const mongoose = require('mongoose');

// Warning Schema
const warningSchema = new mongoose.Schema({
    guildId: String,
    userId: String,
    moderatorId: String,
    reason: String,
    timestamp: { type: Date, default: Date.now },
    warnId: String
});

const Warning = mongoose.models.Warning || mongoose.model('Warning', warningSchema);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('» Warn a user with persistent tracking and escalation system')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('User to warn')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason for warning')
                .setRequired(true)
        )
        .addBooleanOption(option =>
            option
                .setName('silent')
                .setDescription('Silent warning (no DM to user)')
                .setRequired(false)
        ),

    userPermissions: [PermissionFlagsBits.Administrator],

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
                return interaction.editReply('❌ You cannot warn yourself!');
            }

            if (member.id === interaction.guild.ownerId) {
                return interaction.editReply('❌ Cannot warn the server owner!');
            }

            // Generate unique warn ID
            const warnId = `W-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            // Save warning to database
            const warning = new Warning({
                guildId: interaction.guild.id,
                userId: targetUser.id,
                moderatorId: interaction.user.id,
                reason: reason,
                warnId: warnId
            });

            await warning.save();

            // Get total warnings for user
            const totalWarnings = await Warning.countDocuments({
                guildId: interaction.guild.id,
                userId: targetUser.id
            });

            // Determine escalation level
            let escalationMessage = '';
            let escalationColor = 0xFFFF00;

            if (totalWarnings >= 5) {
                escalationMessage = '🚨 **CRITICAL**: User has 5+ warnings! Consider ban.';
                escalationColor = 0xFF0000;
            } else if (totalWarnings >= 3) {
                escalationMessage = '⚠️ **HIGH**: User has 3+ warnings! Consider timeout.';
                escalationColor = 0xFF6600;
            } else if (totalWarnings >= 2) {
                escalationMessage = '⚡ **MEDIUM**: User has multiple warnings.';
                escalationColor = 0xFFAA00;
            }

            // DM user (unless silent)
            if (!silent) {
                const dmEmbed = new EmbedBuilder()
                    .setColor(escalationColor)
                    .setTitle('⚠️ You have received a warning')
                    .setDescription(`You have been warned in **${interaction.guild.name}**`)
                    .addFields(
                        { name: '📋 Reason', value: reason },
                        { name: '👮 Moderator', value: interaction.user.tag },
                        { name: '🔢 Total Warnings', value: `${totalWarnings}`, inline: true },
                        { name: '🆔 Warning ID', value: warnId, inline: true }
                    )
                    .setFooter({ text: 'Please follow server rules to avoid further action' })
                    .setTimestamp();

                await targetUser.send({ embeds: [dmEmbed] }).catch(() => {});
            }

            // Success embed
            const successEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Warning Issued Successfully')
                .addFields(
                    { name: '👤 User', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: '👮 Moderator', value: interaction.user.tag, inline: true },
                    { name: '🔢 Total Warnings', value: `${totalWarnings}`, inline: true },
                    { name: '📋 Reason', value: reason },
                    { name: '🆔 Warning ID', value: warnId }
                )
                .setTimestamp();

            if (escalationMessage) {
                successEmbed.addFields({ name: '📊 Escalation Status', value: escalationMessage });
            }

            await interaction.editReply({ embeds: [successEmbed] });

            // Log to mod log channel
            const logChannel = interaction.guild.channels.cache.find(
                ch => ch.name === 'mod-logs' || ch.name === 'moderation-logs'
            );

            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor(escalationColor)
                    .setTitle('⚠️ Warning Issued')
                    .setThumbnail(targetUser.displayAvatarURL())
                    .addFields(
                        { name: '👤 User', value: `${targetUser.tag} (${targetUser.id})` },
                        { name: '👮 Moderator', value: `${interaction.user.tag} (${interaction.user.id})` },
                        { name: '📋 Reason', value: reason },
                        { name: '🔢 Total Warnings', value: `${totalWarnings}`, inline: true },
                        { name: '🆔 Warning ID', value: warnId, inline: true }
                    )
                    .setTimestamp();

                if (escalationMessage) {
                    logEmbed.addFields({ name: '📊 Escalation Status', value: escalationMessage });
                }

                await logChannel.send({ embeds: [logEmbed] });
            }

        } catch (error) {
            console.error('Warn command error:', error);
            await interaction.editReply('❌ Failed to issue warning. Please try again.');
        }
    }
};
