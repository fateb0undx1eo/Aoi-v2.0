const {
  SlashCommandBuilder,
  AttachmentBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("lisastage")
    .setDescription("Lisa presentation meme")
    .addStringOption(option =>
      option
        .setName("text")
        .setDescription("Text on presentation")
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const text = interaction.options.getString("text");

      const url =
        `https://api.frenchnoodles.xyz/v1/lisastage?text=` +
        encodeURIComponent(text);

      const res = await fetch(url);

      if (!res.ok) {
        return interaction.editReply("❌ API Error.");
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      const file = new AttachmentBuilder(buffer, {
        name: "lisastage.png",
      });

      await interaction.editReply({
        files: [file],
      });

    } catch (err) {
      console.error("LisaStage Error:", err);
      await interaction.editReply("❌ Failed.");
    }
  },
};
