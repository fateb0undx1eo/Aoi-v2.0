const {
  SlashCommandBuilder,
  AttachmentBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("worthless")
    .setDescription("Worthless meme")
    .addStringOption(option =>
      option
        .setName("text")
        .setDescription("Text on meme")
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const text = interaction.options.getString("text");

      const url =
        `https://api.frenchnoodles.xyz/v1/worthless?text=` +
        encodeURIComponent(text);

      const res = await fetch(url);

      if (!res.ok) {
        return interaction.editReply("❌ API Error.");
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      const file = new AttachmentBuilder(buffer, {
        name: "worthless.png",
      });

      await interaction.editReply({
        files: [file],
      });

    } catch (err) {
      console.error("Worthless Error:", err);
      await interaction.editReply("❌ Failed.");
    }
  },
};
