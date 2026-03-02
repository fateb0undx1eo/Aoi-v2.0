const {
  SlashCommandBuilder,
  AttachmentBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("womanyellingatcat")
    .setDescription("Woman yelling at cat meme")
    .addUserOption(option =>
      option
        .setName("woman")
        .setDescription("Woman user")
        .setRequired(true)
    )
    .addUserOption(option =>
      option
        .setName("cat")
        .setDescription("Cat user")
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const woman = interaction.options.getUser("woman");
      const cat = interaction.options.getUser("cat");

      const womanAvatar = woman.displayAvatarURL({
        extension: "png",
        size: 512,
      });

      const catAvatar = cat.displayAvatarURL({
        extension: "png",
        size: 512,
      });

      const url =
        `https://vacefron.nl/api/womanyellingatcat` +
        `?woman=${encodeURIComponent(womanAvatar)}` +
        `&cat=${encodeURIComponent(catAvatar)}`;

      const res = await fetch(url);

      if (!res.ok) {
        return interaction.editReply("❌ API Error.");
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      const file = new AttachmentBuilder(buffer, {
        name: "womanyellingatcat.png",
      });

      await interaction.editReply({
        files: [file],
      });

    } catch (err) {
      console.error("WomanYellingAtCat Error:", err);
      await interaction.editReply("❌ Failed.");
    }
  },
};
