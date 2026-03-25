const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getBothPrefixes } = require('../../utils/prefixHelper');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('viewprefixes')
        .setDescription('View the current command prefixes for this server'),

    async execute(interaction) {
        try {
            const { prefix, roleplayPrefix } = await getBothPrefixes(interaction.guild?.id);

            const embed = new EmbedBuilder()
                .setColor(0x0099ff)
                .setTitle('Server Command Prefixes')
                .setDescription('Current prefix configuration for this server')
                .addFields(
                    { 
                        name: 'Regular Commands', 
                        value: `Prefix: \`${prefix}\`\nExample: \`${prefix}help\``, 
                        inline: false 
                    },
                    { 
                        name: 'Roleplay Commands', 
                        value: `Prefix: \`${roleplayPrefix}\`\nExample: \`${roleplayPrefix}hug @user\``, 
                        inline: false 
                    }
                )
                .setFooter({ text: `Server: ${interaction.guild.name}` })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error fetching prefixes:', error);
            await interaction.reply({
                content: 'Failed to fetch prefix information. Please try again later.',
                ephemeral: true
            });
        }
    }
};
