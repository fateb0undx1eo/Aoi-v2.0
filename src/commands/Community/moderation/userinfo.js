const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const mongoose = require('mongoose');

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
        .setName('userinfo')
        .setDescription('» Advanced user information with moderation history')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('User to get information about')
                .setRequired(true)
        ),

    userPermissions: [PermissionFlagsBits.Administrator],

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const targetUser = interaction.options.getUser('user');
            const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

            // Get warning count
            const warningCount = await Warning.countDocuments({
                guildId: interaction.guild.id,
                userId: targetUser.id
            });

            // Calculate account age
            const accountAge = Date.now() - targetUser.createdTimestamp;
            const accountAgeDays = Math.floor(accountAge / (1000 * 60 * 60 * 24));

            // Risk assessment
            let riskLevel = '🟢 Low Risk';
            let riskColor = 0x00FF00;
            let riskFactors = [];

            if (warningCount >= 3) {
                riskLevel = '🔴 High Risk';
                riskColor = 0xFF0000;
                riskFactors.push(`${warningCount} warnings`);
            } else if (warningCount >= 1) {
                riskLevel = '🟡 Medium Risk';
                riskColor = 0xFFAA00;
                riskFactors.push(`${warningCount} warning(s)`);
            }

            if (accountAgeDays < 7) {
                riskLevel = riskLevel === '🟢 Low Risk' ? '🟡 Medium Risk' : riskLevel;
                riskColor = riskColor === 0x00FF00 ? 0xFFAA00 : riskColor;
                riskFactors.push('New account');
            }

            if (member && member.joinedTimestamp > Date.now() - 24 * 60 * 60 * 1000) {
                riskFactors.push('Recently joined');
            }

            // Create embed
            const embed = new EmbedBuilder()
                .setColor(riskColor)
                .setTitle(`👤 User Information: ${targetUser.tag}`)
                .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
                .addFields(
                    { name: '🆔 User ID', value: targetUser.id, inline: true },
                    { name: '🤖 Bot', value: targetUser.bot ? 'Yes' : 'No', inline: true },
                    { name: '📅 Account Created', value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`, inline: true }
                );

            if (member) {
                embed.addFields(
                    { name: '📥 Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
                    { name: '🎭 Nickname', value: member.nickname || 'None', inline: true },
                    { name: '🎨 Roles', value: member.roles.cache.size > 1 ? `${member.roles.cache.size - 1}` : 'None', inline: true }
                );

                // Show top roles
                const roles = member.roles.cache
                    .filter(role => role.id !== interaction.guild.id)
                    .sort((a, b) => b.position - a.position)
                    .first(5);

                if (roles.length > 0) {
                    embed.addFields({
                        name: '🏅 Top Roles',
                        value: roles.map(role => role.toString()).join(', ')
                    });
                }

                // Permissions
                const keyPerms = [];
                if (member.permissions.has(PermissionFlagsBits.Administrator)) keyPerms.push('Administrator');
                if (member.permissions.has(PermissionFlagsBits.ManageGuild)) keyPerms.push('Manage Server');
                if (member.permissions.has(PermissionFlagsBits.ManageChannels)) keyPerms.push('Manage Channels');
                if (member.permissions.has(PermissionFlagsBits.BanMembers)) keyPerms.push('Ban Members');
                if (member.permissions.has(PermissionFlagsBits.KickMembers)) keyPerms.push('Kick Members');

                if (keyPerms.length > 0) {
                    embed.addFields({
                        name: '🔑 Key Permissions',
                        value: keyPerms.join(', ')
                    });
                }

                // Timeout status
                if (member.communicationDisabledUntil) {
                    embed.addFields({
                        name: '⏱️ Timeout Status',
                        value: `Timed out until <t:${Math.floor(member.communicationDisabledUntil.getTime() / 1000)}:R>`,
                        inline: false
                    });
                }
            } else {
                embed.addFields({ name: '📥 Server Member', value: 'No (not in server)', inline: true });
            }

            // Moderation history
            embed.addFields(
                { name: '⚠️ Warnings', value: `${warningCount}`, inline: true },
                { name: '🎯 Risk Level', value: riskLevel, inline: true },
                { name: '📊 Account Age', value: `${accountAgeDays} days`, inline: true }
            );

            if (riskFactors.length > 0) {
                embed.addFields({
                    name: '⚠️ Risk Factors',
                    value: riskFactors.join(', ')
                });
            }

            // User badges
            const badges = [];
            if (targetUser.flags) {
                const flagsArray = targetUser.flags.toArray();
                if (flagsArray.includes('Staff')) badges.push('Discord Staff');
                if (flagsArray.includes('Partner')) badges.push('Partnered Server Owner');
                if (flagsArray.includes('CertifiedModerator')) badges.push('Certified Moderator');
                if (flagsArray.includes('BugHunterLevel1')) badges.push('Bug Hunter');
                if (flagsArray.includes('BugHunterLevel2')) badges.push('Bug Hunter Level 2');
                if (flagsArray.includes('HypeSquadOnlineHouse1')) badges.push('HypeSquad Bravery');
                if (flagsArray.includes('HypeSquadOnlineHouse2')) badges.push('HypeSquad Brilliance');
                if (flagsArray.includes('HypeSquadOnlineHouse3')) badges.push('HypeSquad Balance');
                if (flagsArray.includes('PremiumEarlySupporter')) badges.push('Early Supporter');
                if (flagsArray.includes('VerifiedDeveloper')) badges.push('Verified Bot Developer');
            }

            if (badges.length > 0) {
                embed.addFields({
                    name: '🏆 Badges',
                    value: badges.join(', ')
                });
            }

            embed.setFooter({ text: `Requested by ${interaction.user.tag}` });
            embed.setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Userinfo command error:', error);
            await interaction.editReply('❌ Failed to fetch user information. Please try again.');
        }
    }
};
