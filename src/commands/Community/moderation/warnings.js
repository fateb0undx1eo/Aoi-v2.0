const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const mongoose = require('mongoose');

// Warning Schema (reuse from warn.js)
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
        .setName('warnings')
        .setDescription('📋 View warning history for a user')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('User to check warnings for')
                .setRequired(true)
        ),

    userPermissions: [PermissionFlagsBits.Administrator],

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const targetUser = interaction.options.getUser('user');

            // Fetch all warnings for user
            const warnings = await Warning.find({
                guildId: interaction.guild.id,
                userId: targetUser.id
            }).sort({ timestamp: -1 });

            if (warnings.length === 0) {
                const noWarningsEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('✅ Clean Record')
                    .setDescription(`**${targetUser.tag}** has no warnings in this server.`)
                    .setThumbnail(targetUser.displayAvatarURL())
                    .setTimestamp();

                return interaction.editReply({ embeds: [noWarningsEmbed] });
            }

            // Create warning list
            const warningList = await Promise.all(warnings.slice(0, 10).map(async (warn, index) => {
                const moderator = await interaction.client.users.fetch(warn.moderatorId).catch(() => null);
                const modTag = moderator ? moderator.tag : 'Unknown';
                const timestamp = `<t:${Math.floor(warn.timestamp.getTime() / 1000)}:R>`;
                
                return `**${index + 1}.** ${timestamp}\n` +
                       `└ **Reason:** ${warn.reason}\n` +
                       `└ **Moderator:** ${modTag}\n` +
                       `└ **ID:** \`${warn.warnId}\``;
            }));

            // Determine risk level
            let riskLevel = '🟢 Low Risk';
            let riskColor = 0x00FF00;

            if (warnings.length >= 5) {
                riskLevel = '🔴 Critical Risk';
                riskColor = 0xFF0000;
            } else if (warnings.length >= 3) {
                riskLevel = '🟠 High Risk';
                riskColor = 0xFF6600;
            } else if (warnings.length >= 2) {
                riskLevel = '🟡 Medium Risk';
                riskColor = 0xFFAA00;
            }

            const embed = new EmbedBuilder()
                .setColor(riskColor)
                .setTitle(`⚠️ Warning History for ${targetUser.tag}`)
                .setThumbnail(targetUser.displayAvatarURL())
                .setDescription(warningList.join('\n\n'))
                .addFields(
                    { name: '📊 Total Warnings', value: `${warnings.length}`, inline: true },
                    { name: '🎯 Risk Level', value: riskLevel, inline: true }
                )
                .setFooter({ text: warnings.length > 10 ? `Showing 10 of ${warnings.length} warnings` : `Total: ${warnings.length} warnings` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Warnings command error:', error);
            await interaction.editReply('❌ Failed to fetch warnings. Please try again.');
        }
    }
};
