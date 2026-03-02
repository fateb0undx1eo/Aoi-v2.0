const {
  SlashCommandBuilder,
  AttachmentBuilder,
} = require("discord.js");

const fetch = require("node-fetch");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("oogway2")
    .setDescription("Oogway 2nd wisdom meme")

    .addStringOption(option =>
      option
        .setName("text")
        .setDescription("Enter quote")
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const text = interaction.options.getString("text");

      const apiUrl =
        "https://api.some-random-api.com/canvas/misc/oogway2" +
        `?quote=${encodeURIComponent(text)}`;

      const res = await fetch(apiUrl);

      if (!res.ok) return interaction.editReply("❌ API error.");

      const buffer = await res.buffer();

      const file = new AttachmentBuilder(buffer, {
        name: "oogway.png",
      });

      await interaction.editReply({ files: [file] });

    } catch (err) {
      console.error(err);
      interaction.editReply("❌ Failed.");
    }
  },
};
