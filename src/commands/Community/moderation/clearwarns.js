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
        .setName('clearwarns')
        .setDescription('🧹 Clear warnings for a user')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('User to clear warnings for')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('warn_id')
                .setDescription('Specific warning ID to remove (leave empty to clear all)')
                .setRequired(false)
        ),

    userPermissions: [PermissionFlagsBits.Administrator],

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const targetUser = interaction.options.getUser('user');
            const warnId = interaction.options.getString('warn_id');

            if (warnId) {
                // Remove specific warning
                const result = await Warning.deleteOne({
                    guildId: interaction.guild.id,
                    userId: targetUser.id,
                    warnId: warnId
                });

                if (result.deletedCount === 0) {
                    return interaction.editReply('❌ Warning ID not found!');
                }

                const embed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('✅ Warning Removed')
                    .setDescription(`Removed warning \`${warnId}\` for **${targetUser.tag}**`)
                    .addFields(
                        { name: '👮 Moderator', value: interaction.user.tag }
                    )
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });

            } else {
                // Clear all warnings
                const result = await Warning.deleteMany({
                    guildId: interaction.guild.id,
                    userId: targetUser.id
                });

                if (result.deletedCount === 0) {
                    return interaction.editReply('❌ No warnings found for this user!');
                }

                const embed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('✅ All Warnings Cleared')
                    .setDescription(`Cleared **${result.deletedCount}** warning(s) for **${targetUser.tag}**`)
                    .addFields(
                        { name: '👮 Moderator', value: interaction.user.tag }
                    )
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });

                // Log to mod log channel
                const logChannel = interaction.guild.channels.cache.find(
                    ch => ch.name === 'mod-logs' || ch.name === 'moderation-logs'
                );

                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor(0x00FF00)
                        .setTitle('🧹 Warnings Cleared')
                        .addFields(
                            { name: '👤 User', value: `${targetUser.tag} (${targetUser.id})` },
                            { name: '👮 Moderator', value: `${interaction.user.tag} (${interaction.user.id})` },
                            { name: '🔢 Warnings Cleared', value: `${result.deletedCount}` }
                        )
                        .setTimestamp();

                    await logChannel.send({ embeds: [logEmbed] });
                }
            }

        } catch (error) {
            console.error('Clearwarns command error:', error);
            await interaction.editReply('❌ Failed to clear warnings. Please try again.');
        }
    }
};
