const {
  SlashCommandBuilder,
  AttachmentBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("peeposign")
    .setDescription("Peepo sign meme")
    .addStringOption(option =>
      option
        .setName("text")
        .setDescription("Text on sign")
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const text = interaction.options.getString("text");

      const url =
        `https://vacefron.nl/api/peeposign?text=` +
        encodeURIComponent(text);

      const res = await fetch(url);

      if (!res.ok) {
        return interaction.editReply("❌ API Error.");
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      const file = new AttachmentBuilder(buffer, {
        name: "peeposign.png",
      });

      await interaction.editReply({
        files: [file],
      });

    } catch (err) {
      console.error("PeepoSign Error:", err);
      await interaction.editReply("❌ Failed.");
    }
  },
};
