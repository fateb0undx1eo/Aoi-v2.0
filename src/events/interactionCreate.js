const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (interaction.isAutocomplete()) {
            const command = client.commands.get(interaction.commandName);
            if (command && command.autocomplete) {
                try {
                    await command.autocomplete(interaction);
                } catch (error) {
                    console.error('Autocomplete error:', error);
                }
            }
            return;
        }

        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }
            try {
                await command.execute(interaction, client);
            } catch (error) {
                console.error(`Error executing ${interaction.commandName}:`, error);
                const errorEmbed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Command Error')
                    .setDescription('There was an error executing this command.')
                    .setTimestamp();
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
                } else {
                    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }
            }
            return;
        }

        if (interaction.isButton() || interaction.isStringSelectMenu() || interaction.isModalSubmit()) {
            const customId = interaction.customId;
            
            if (customId.startsWith('afk_')) {
                const { handleButton } = require('./handlers/afkInteractions');
                return handleButton(interaction);
            }
            
            if (customId.startsWith('autopost_')) {
                const { handleAutopostInteractions } = require('./handlers/autopostInteractions');
                return handleAutopostInteractions(interaction);
            }
            
            if (customId.startsWith('chess_') || customId.startsWith('lb_')) {
                const { handleChessInteractions } = require('./handlers/chessInteractions');
                return handleChessInteractions(interaction);
            }
        }
    }
};
