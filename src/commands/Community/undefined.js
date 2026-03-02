const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('your-command')
        .setDescription('Describe your command here.'),

    async execute(interaction, client) {
        // Command execution logic goes here
        // Example: Create an embed
        // const embed = new EmbedBuilder()
        //     .setColor('Blue')
        //     .setTitle('Title')
        //     .setDescription('Description');
        // await interaction.reply({ embeds: [embed] });
    }
};