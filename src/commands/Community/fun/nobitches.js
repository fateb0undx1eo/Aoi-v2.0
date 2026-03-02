const {
  SlashCommandBuilder,
  AttachmentBuilder,
} = require("discord.js");

const fetch = require("node-fetch");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("nobitches")
    .setDescription("No bitches meme with text")

    .addStringOption(option =>
      option
        .setName("text")
        .setDescription("Text to display on meme")
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const text = interaction.options.getString("text");

      const url =
        "https://some-random-api.com/canvas/misc/nobitches?no=" +
        encodeURIComponent(text);

      const res = await fetch(url);
      const buffer = await res.buffer();

      const file = new AttachmentBuilder(buffer, {
        name: "nobitches.png",
      });

      await interaction.editReply({ files: [file] });

    } catch (err) {
      console.error(err);

      await interaction.editReply(
        "❌ Failed to generate image."
      );
    }
  },
};
