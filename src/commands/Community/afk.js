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
        .addSubcommand(sub =>
            sub.setName('set')
                .setDescription('Set your AFK status')
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for going AFK')
                        .setRequired(false)
                )
        )
        .addSubcommand(sub =>
            sub.setName('remove')
                .setDescription('Remove your AFK status')
        ),

    async execute(interaction) {

        const { options, user, guildId, client } = interaction;
        const sub = options.getSubcommand();

        if (sub === 'set') {

            const reason = options.getString('reason') || 'No reason provided';

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

            const embed = new EmbedBuilder()
                .setAuthor({
                    name: `${user.tag} is setting AFK`,
                    iconURL: user.displayAvatarURL()
                })
                .setDescription(
                    `**Reason:** ${reason}\n\nWould you like to receive DMs when someone mentions you while AFK?`
                )
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
            const afkSchema = require('../../schemas/afkSchema');

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
    }
};
