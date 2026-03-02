const {
  SlashCommandBuilder,
  AttachmentBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("drake")
    .setDescription("Drake meme")
    .addStringOption(option =>
      option
        .setName("text1")
        .setDescription("Top text (bad)")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("text2")
        .setDescription("Bottom text (good)")
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const text1 = interaction.options.getString("text1");
      const text2 = interaction.options.getString("text2");

      const url =
        `https://api.frenchnoodles.xyz/v1/drake?text1=` +
        encodeURIComponent(text1) +
        `&text2=` +
        encodeURIComponent(text2);

      const res = await fetch(url);

      if (!res.ok) {
        return interaction.editReply("❌ API Error.");
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      const file = new AttachmentBuilder(buffer, {
        name: "drake.png",
      });

      await interaction.editReply({
        files: [file],
      });

    } catch (err) {
      console.error("Drake Error:", err);
      await interaction.editReply("❌ Failed.");
    }
  },
};
