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
                console.error(No command matching  was found.);
                return;
            }
            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(Error executing :, error);
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

        if (interaction.isButton()) {
            const customId = interaction.customId;
            if (customId.startsWith('afk_')) {
                const afkInteractions = require('./handlers/afkInteractions');
                return afkInteractions.handleButton(interaction);
            }
            if (customId.startsWith('autopost_')) {
                const autopostInteractions = require('./handlers/autopostInteractions');
                return autopostInteractions.handleButton(interaction);
            }
            if (customId.startsWith('chess_')) {
                const chessInteractions = require('./handlers/chessInteractions');
                return chessInteractions.handleButton(interaction);
            }
        }

        if (interaction.isStringSelectMenu()) {
            const customId = interaction.customId;
            if (customId.startsWith('autopost_')) {
                const autopostInteractions = require('./handlers/autopostInteractions');
                return autopostInteractions.handleSelectMenu(interaction);
            }
        }

        if (interaction.isModalSubmit()) {
            const customId = interaction.customId;
            if (customId.startsWith('autopost_')) {
                const autopostInteractions = require('./handlers/autopostInteractions');
                return autopostInteractions.handleModal(interaction);
            }
        }
    }
};
