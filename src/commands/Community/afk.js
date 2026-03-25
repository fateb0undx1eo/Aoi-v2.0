const {
    SlashCommandBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    EmbedBuilder,
    MessageFlags
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('afk')
        .setDescription('Manage your AFK status')
        .setDMPermission(false) // Server only
        .addSubcommand(sub =>
            sub.setName('set')
                .setDescription('Set your AFK status')
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for going AFK')
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option.setName('duration')
                        .setDescription('Expected duration (e.g., 30m, 2h, 1d)')
                        .setRequired(false)
                )
        )
        .addSubcommand(sub =>
            sub.setName('remove')
                .setDescription('Remove your AFK status')
        )
        .addSubcommand(sub =>
            sub.setName('list')
                .setDescription('View all AFK users in this server')
        )
        .addSubcommand(sub =>
            sub.setName('status')
                .setDescription('Check someone\'s AFK status')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to check')
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        const { options, user, guildId, client } = interaction;
        const sub = options.getSubcommand();
        const afkSchema = require('../../schemas/afkSchema');
        const validators = require('../../utils/validators');

        if (sub === 'set') {
            const reason = options.getString('reason') || 'No reason provided';
            const durationStr = options.getString('duration');
            
            let expectedReturn = null;
            if (durationStr) {
                try {
                    const durationMs = validators.duration(durationStr);
                    expectedReturn = Date.now() + durationMs;
                } catch (error) {
                    return interaction.reply({
                        content: error.userMessage || 'Invalid duration format. Use: 30m, 2h, 1d',
                        flags: MessageFlags.Ephemeral
                    });
                }
            }

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`afk_yes_${user.id}`)
                    .setLabel('Yes, DM me when mentioned')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`afk_no_${user.id}`)
                    .setLabel("No, don't DM me")
                    .setStyle(ButtonStyle.Danger)
            );

            let description = `**Reason:** ${reason}\n`;
            if (expectedReturn) {
                description += `**Expected return:** <t:${Math.floor(expectedReturn / 1000)}:R>\n`;
            }
            description += `\nWould you like to receive DMs when someone mentions you while AFK?`;

            const embed = new EmbedBuilder()
                .setAuthor({
                    name: `${user.tag} is setting AFK`,
                    iconURL: user.displayAvatarURL()
                })
                .setDescription(description)
                .setColor('Blue')
                .setFooter({
                    text: client.user.username,
                    iconURL: client.user.displayAvatarURL()
                })
                .setTimestamp();

            return interaction.reply({
                embeds: [embed],
                components: [row],
                flags: MessageFlags.Ephemeral
            });
        }

        if (sub === 'remove') {
            const data = await afkSchema.findOneAndDelete({
                userId: user.id,
                guildId
            });

            if (!data) {
                return interaction.reply({
                    content: "You are not currently AFK.",
                    flags: MessageFlags.Ephemeral
                });
            }

            return interaction.reply({
                content: "Your AFK status has been removed.",
                flags: MessageFlags.Ephemeral
            });
        }

        if (sub === 'list') {
            await interaction.deferReply();

            const afkUsers = await afkSchema.find({ guildId }).lean();

            if (!afkUsers || afkUsers.length === 0) {
                return interaction.editReply({
                    content: "No users are currently AFK in this server."
                });
            }

            const embed = new EmbedBuilder()
                .setTitle(`AFK Users in ${interaction.guild.name}`)
                .setColor('Blue')
                .setTimestamp();

            const userList = afkUsers.map((afk, index) => {
                const duration = Date.now() - afk.timestamp;
                const minutes = Math.floor(duration / 60000);
                const hours = Math.floor(minutes / 60);
                const days = Math.floor(hours / 24);

                let timeStr;
                if (days > 0) timeStr = `${days}d ago`;
                else if (hours > 0) timeStr = `${hours}h ago`;
                else timeStr = `${minutes}m ago`;

                return `**${index + 1}.** <@${afk.userId}> - ${afk.reason} (${timeStr})`;
            }).join('\n');

            embed.setDescription(userList);
            embed.setFooter({ text: `Total: ${afkUsers.length} user${afkUsers.length !== 1 ? 's' : ''}` });

            return interaction.editReply({ embeds: [embed] });
        }

        if (sub === 'status') {
            const targetUser = options.getUser('user');

            const afkData = await afkSchema.findOne({
                userId: targetUser.id,
                guildId
            }).lean();

            if (!afkData) {
                return interaction.reply({
                    content: `${targetUser.username} is not currently AFK.`,
                    flags: MessageFlags.Ephemeral
                });
            }

            const duration = Date.now() - afkData.timestamp;
            const minutes = Math.floor(duration / 60000);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);

            let durationStr;
            if (days > 0) durationStr = `${days} day${days !== 1 ? 's' : ''}`;
            else if (hours > 0) durationStr = `${hours} hour${hours !== 1 ? 's' : ''}`;
            else durationStr = `${minutes} minute${minutes !== 1 ? 's' : ''}`;

            const embed = new EmbedBuilder()
                .setTitle(`${targetUser.username} is AFK`)
                .setDescription(`**Reason:** ${afkData.reason}\n**Since:** <t:${Math.floor(afkData.timestamp / 1000)}:F>\n**Duration:** ${durationStr}`)
                .setColor('Blue')
                .setThumbnail(targetUser.displayAvatarURL())
                .setTimestamp();

            return interaction.reply({
                embeds: [embed],
                flags: MessageFlags.Ephemeral
            });
        }
    }
};
