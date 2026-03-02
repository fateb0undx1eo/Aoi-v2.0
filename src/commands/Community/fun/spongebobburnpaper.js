const {
  SlashCommandBuilder,
  AttachmentBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("spongebobburnpaper")
    .setDescription("SpongeBob burning paper meme")
    .addStringOption(option =>
      option
        .setName("text")
        .setDescription("Text on paper")
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const text = interaction.options.getString("text");

      const url =
        `https://api.frenchnoodles.xyz/v1/spongebobburnpaper?text=` +
        encodeURIComponent(text);

      const res = await fetch(url);

      if (!res.ok) {
        return interaction.editReply("❌ API Error.");
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      const file = new AttachmentBuilder(buffer, {
        name: "spongebobburnpaper.png",
      });

      await interaction.editReply({
        files: [file],
      });

    } catch (err) {
      console.error("SpongeBobBurnPaper Error:", err);
      await interaction.editReply("❌ Failed.");
    }
  },
};
