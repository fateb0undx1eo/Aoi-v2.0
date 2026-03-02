const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const fetchMeme = require('../../functions/handlers/fetchMeme'); // make sure path is correct
const memeSubreddits = require('../../functions/handlers/subreddits'); // correct path

module.exports = {
    // Slash command registration
    data: new SlashCommandBuilder()
        .setName('meme')
        .setDescription('Fetch a random meme from Reddit'),

    // Slash command execution
    async execute(interaction) {
        await interaction.deferReply();

        try {
            const meme = await fetchMeme(memeSubreddits);

            if (!meme || !meme.url) {
                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xFF0000)
                            .setDescription('❌ Could not fetch a meme at this time.')
                    ]
                });
            }

            const embed = new EmbedBuilder()
                .setColor(Math.floor(Math.random() * 16777215))
                .setImage(meme.url)
                .setFooter({ text: `r/${meme.subreddit}` });

            interaction.editReply({ embeds: [embed] });

        } catch (err) {
            console.error(err);
            interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setDescription('❌ Could not fetch a meme at this time.')
                ]
            });
        }
    }
};
