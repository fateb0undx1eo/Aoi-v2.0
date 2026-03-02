const {
  SlashCommandBuilder,
  AttachmentBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("randommeme")
    .setDescription("Get a random meme"),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const url = `https://api.frenchnoodles.xyz/v1/randommeme`;

      const res = await fetch(url);

      if (!res.ok) {
        return interaction.editReply("❌ API Error.");
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      const file = new AttachmentBuilder(buffer, {
        name: "randommeme.png",
      });

      await interaction.editReply({
        files: [file],
      });

    } catch (err) {
      console.error("RandomMeme Error:", err);
      await interaction.editReply("❌ Failed.");
    }
  },
};
