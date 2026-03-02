const {
  SlashCommandBuilder,
  AttachmentBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("changemymind")
    .setDescription("Change My Mind meme")

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
        "https://vacefron.nl/api/changemymind" +
        `?text=${encodeURIComponent(text)}`;

      const res = await fetch(url);

      if (!res.ok) {
        return interaction.editReply("❌ API Error.");
      }

      const buffer = Buffer.from(
        await res.arrayBuffer()
      );

      const file = new AttachmentBuilder(buffer, {
        name: "changemymind.png",
      });

      await interaction.editReply({
        files: [file],
      });

    } catch (err) {
      console.error(err);
      await interaction.editReply("❌ Failed.");
    }
  },
};
