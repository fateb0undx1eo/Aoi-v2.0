const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const PrefixSchema = require('../../schemas/prefixSchema');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setprefix')
        .setDescription('Set the regular command prefix for this server')
        .addStringOption(option =>
            option
                .setName('prefix')
                .setDescription('The new prefix (e.g., !, ?, $)')
                .setRequired(true)
                .setMaxLength(5)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // Check if user has Administrator permission
        if (!interaction.memberPermissions?.has('Administrator')) {
            return interaction.reply({
                content: '❌ You need Administrator permission to use this command.',
                ephemeral: true
            });
        }

        const newPrefix = interaction.options.getString('prefix');

        // Validate prefix
        if (newPrefix.length === 0) {
            return interaction.reply({
                content: 'Prefix cannot be empty!',
                ephemeral: true
            });
        }

        if (newPrefix.length > 5) {
            return interaction.reply({
                content: 'Prefix must be 5 characters or less!',
                ephemeral: true
            });
        }

        try {
            // Update or create prefix document
            const guildId = interaction.guild.id;
            let prefixDoc = await PrefixSchema.findOne({ guildId });

            if (!prefixDoc) {
                // Create new document with default roleplay prefix
                prefixDoc = new PrefixSchema({
                    guildId,
                    prefix: newPrefix,
                    roleplayPrefix: 'r!'
                });
            } else {
                // Update existing document
                prefixDoc.prefix = newPrefix;
                prefixDoc.updatedAt = new Date();
            }

            await prefixDoc.save();

            const embed = new EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle('Prefix Updated')
                .setDescription(`The regular command prefix has been changed to: \`${newPrefix}\``)
                .addFields(
                    { name: 'Regular Prefix', value: `\`${prefixDoc.prefix}\``, inline: true },
                    { name: 'Roleplay Prefix', value: `\`${prefixDoc.roleplayPrefix}\``, inline: true }
                )
                .setFooter({ text: `Updated by ${interaction.user.tag}` })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error setting prefix:', error);
            await interaction.reply({
                content: 'Failed to update prefix. Please try again later.',
                ephemeral: true
            });
        }
    }
};
