const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('» Timeout a member with smart duration presets')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('User to timeout')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('duration')
                .setDescription('Timeout duration')
                .setRequired(true)
                .addChoices(
                    { name: '60 seconds', value: '60s' },
                    { name: '5 minutes', value: '5m' },
                    { name: '10 minutes', value: '10m' },
                    { name: '30 minutes', value: '30m' },
                    { name: '1 hour', value: '1h' },
                    { name: '6 hours', value: '6h' },
                    { name: '12 hours', value: '12h' },
                    { name: '1 day', value: '1d' },
                    { name: '3 days', value: '3d' },
                    { name: '1 week', value: '7d' }
                )
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason for timeout')
                .setRequired(true)
        )
        .addBooleanOption(option =>
            option
                .setName('silent')
                .setDescription('Silent timeout (no DM to user)')
                .setRequired(false)
        ),

    userPermissions: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.ModerateMembers],

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const targetUser = interaction.options.getUser('user');
            const durationStr = interaction.options.getString('duration');
            const reason = interaction.options.getString('reason');
            const silent = interaction.options.getBoolean('silent') || false;

            const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

            if (!member) {
                return interaction.editReply('❌ User is not in this server!');
            }

            // Hierarchy checks
            if (member.id === interaction.user.id) {
                return interaction.editReply('❌ You cannot timeout yourself!');
            }

            if (member.id === interaction.guild.ownerId) {
                return interaction.editReply('❌ Cannot timeout the server owner!');
            }

            if (member.roles.highest.position >= interaction.member.roles.highest.position) {
                return interaction.editReply('❌ You cannot timeout someone with equal or higher role!');
            }

            if (member.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
                return interaction.editReply('❌ I cannot timeout someone with equal or higher role than me!');
            }

            // Parse duration
            const durationMs = parseDuration(durationStr);
            const durationDisplay = formatDuration(durationStr);

            // DM user before timeout (unless silent)
            if (!silent) {
                const dmEmbed = new EmbedBuilder()
                    .setColor(0xFFFF00)
                    .setTitle('⏱️ You have been timed out')
                    .setDescription(`You have been timed out in **${interaction.guild.name}**`)
                    .addFields(
                        { name: '📋 Reason', value: reason },
                        { name: '⏰ Duration', value: durationDisplay },
                        { name: '👮 Moderator', value: interaction.user.tag },
                        { name: '📅 Ends', value: `<t:${Math.floor((Date.now() + durationMs) / 1000)}:R>` }
                    )
                    .setTimestamp();

                await targetUser.send({ embeds: [dmEmbed] }).catch(() => {});
            }

            // Execute timeout
            await member.timeout(durationMs, `${reason} | Moderator: ${interaction.user.tag}`);

            // Success embed
            const successEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ User Timed Out Successfully')
                .addFields(
                    { name: '👤 User', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: '👮 Moderator', value: interaction.user.tag, inline: true },
                    { name: '⏰ Duration', value: durationDisplay, inline: true },
                    { name: '📋 Reason', value: reason },
                    { name: '📅 Ends', value: `<t:${Math.floor((Date.now() + durationMs) / 1000)}:R>`, inline: true },
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
                    .setColor(0xFFFF00)
                    .setTitle('⏱️ Member Timed Out')
                    .setThumbnail(targetUser.displayAvatarURL())
                    .addFields(
                        { name: '👤 User', value: `${targetUser.tag} (${targetUser.id})` },
                        { name: '👮 Moderator', value: `${interaction.user.tag} (${interaction.user.id})` },
                        { name: '⏰ Duration', value: durationDisplay },
                        { name: '📋 Reason', value: reason },
                        { name: '📅 Ends', value: `<t:${Math.floor((Date.now() + durationMs) / 1000)}:F>` }
                    )
                    .setTimestamp();

                await logChannel.send({ embeds: [logEmbed] });
            }

        } catch (error) {
            console.error('Timeout command error:', error);
            await interaction.editReply('❌ Failed to timeout user. Please check my permissions and try again.');
        }
    }
};

function parseDuration(str) {
    const match = str.match(/^(\d+)([smhd])$/);
    if (!match) return 60000; // Default 1 minute

    const value = parseInt(match[1]);
    const unit = match[2];

    const multipliers = {
        's': 1000,
        'm': 60000,
        'h': 3600000,
        'd': 86400000
    };

    return value * multipliers[unit];
}

function formatDuration(str) {
    const match = str.match(/^(\d+)([smhd])$/);
    if (!match) return '1 minute';

    const value = match[1];
    const units = {
        's': 'second',
        'm': 'minute',
        'h': 'hour',
        'd': 'day'
    };

    const unit = units[match[2]];
    return `${value} ${unit}${value > 1 ? 's' : ''}`;
}
