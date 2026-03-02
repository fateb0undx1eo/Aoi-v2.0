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
        .setName('modstats')
        .setDescription('» View moderation statistics and analytics')
        .addUserOption(option =>
            option
                .setName('moderator')
                .setDescription('View stats for specific moderator')
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName('timeframe')
                .setDescription('Time period for statistics')
                .setRequired(false)
                .addChoices(
                    { name: 'Last 24 Hours', value: '24h' },
                    { name: 'Last 7 Days', value: '7d' },
                    { name: 'Last 30 Days', value: '30d' },
                    { name: 'All Time', value: 'all' }
                )
        ),

    userPermissions: [PermissionFlagsBits.Administrator],

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const moderator = interaction.options.getUser('moderator');
            const timeframe = interaction.options.getString('timeframe') || '7d';

            // Calculate time threshold
            const timeThresholds = {
                '24h': Date.now() - 24 * 60 * 60 * 1000,
                '7d': Date.now() - 7 * 24 * 60 * 60 * 1000,
                '30d': Date.now() - 30 * 24 * 60 * 60 * 1000,
                'all': 0
            };

            const threshold = new Date(timeThresholds[timeframe]);

            // Build query
            const query = {
                guildId: interaction.guild.id,
                timestamp: { $gte: threshold }
            };

            if (moderator) {
                query.moderatorId = moderator.id;
            }

            // Fetch warnings
            const warnings = await Warning.find(query);

            // Get audit logs for additional stats
            const auditLogs = await interaction.guild.fetchAuditLogs({
                limit: 100
            });

            // Count actions by type
            const actionCounts = {
                bans: 0,
                kicks: 0,
                timeouts: 0,
                warnings: warnings.length
            };

            auditLogs.entries.forEach(entry => {
                if (entry.createdTimestamp < timeThresholds[timeframe]) return;
                if (moderator && entry.executor.id !== moderator.id) return;

                switch (entry.action) {
                    case 22: // MEMBER_BAN_ADD
                        actionCounts.bans++;
                        break;
                    case 20: // MEMBER_KICK
                        actionCounts.kicks++;
                        break;
                    case 24: // MEMBER_UPDATE (timeout)
                        if (entry.changes.some(c => c.key === 'communication_disabled_until')) {
                            actionCounts.timeouts++;
                        }
                        break;
                }
            });

            // Calculate total actions
            const totalActions = Object.values(actionCounts).reduce((a, b) => a + b, 0);

            // Get top moderators (if not viewing specific moderator)
            let topModerators = [];
            if (!moderator) {
                const modWarnings = await Warning.aggregate([
                    { $match: { guildId: interaction.guild.id, timestamp: { $gte: threshold } } },
                    { $group: { _id: '$moderatorId', count: { $sum: 1 } } },
                    { $sort: { count: -1 } },
                    { $limit: 5 }
                ]);

                topModerators = await Promise.all(
                    modWarnings.map(async (mod) => {
                        const user = await interaction.client.users.fetch(mod._id).catch(() => null);
                        return {
                            tag: user ? user.tag : 'Unknown',
                            count: mod.count
                        };
                    })
                );
            }

            // Create embed
            const timeframeNames = {
                '24h': 'Last 24 Hours',
                '7d': 'Last 7 Days',
                '30d': 'Last 30 Days',
                'all': 'All Time'
            };

            const embed = new EmbedBuilder()
                .setColor(0x00AAFF)
                .setTitle(`📊 Moderation Statistics - ${timeframeNames[timeframe]}`)
                .setThumbnail(interaction.guild.iconURL())
                .addFields(
                    { name: '🔨 Total Actions', value: `${totalActions}`, inline: true },
                    { name: '⚠️ Warnings', value: `${actionCounts.warnings}`, inline: true },
                    { name: '🔴 Bans', value: `${actionCounts.bans}`, inline: true },
                    { name: '👢 Kicks', value: `${actionCounts.kicks}`, inline: true },
                    { name: '⏱️ Timeouts', value: `${actionCounts.timeouts}`, inline: true },
                    { name: '📈 Avg/Day', value: `${(totalActions / getDays(timeframe)).toFixed(1)}`, inline: true }
                )
                .setTimestamp();

            if (moderator) {
                embed.setDescription(`Statistics for **${moderator.tag}**`);
                embed.setThumbnail(moderator.displayAvatarURL());
            } else if (topModerators.length > 0) {
                embed.addFields({
                    name: '🏆 Top Moderators (by warnings)',
                    value: topModerators.map((mod, i) => `${i + 1}. ${mod.tag} - ${mod.count} warnings`).join('\n')
                });
            }

            // Activity trend
            const activityEmoji = totalActions > 50 ? '🔥' : totalActions > 20 ? '📈' : totalActions > 5 ? '📊' : '📉';
            embed.setFooter({ text: `${activityEmoji} Activity Level: ${getActivityLevel(totalActions, timeframe)}` });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Modstats command error:', error);
            await interaction.editReply('❌ Failed to fetch moderation statistics. Please try again.');
        }
    }
};

function getDays(timeframe) {
    const days = {
        '24h': 1,
        '7d': 7,
        '30d': 30,
        'all': 365
    };
    return days[timeframe] || 7;
}

function getActivityLevel(actions, timeframe) {
    const perDay = actions / getDays(timeframe);
    if (perDay > 10) return 'Very High';
    if (perDay > 5) return 'High';
    if (perDay > 2) return 'Medium';
    if (perDay > 0.5) return 'Low';
    return 'Very Low';
}
