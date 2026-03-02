const {
  SlashCommandBuilder,
  AttachmentBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("distractedbf")
    .setDescription("Distracted boyfriend meme")
    .addUserOption(option =>
      option
        .setName("boyfriend")
        .setDescription("Boyfriend user")
        .setRequired(true)
    )
    .addUserOption(option =>
      option
        .setName("girlfriend")
        .setDescription("Girlfriend user")
        .setRequired(true)
    )
    .addUserOption(option =>
      option
        .setName("woman")
        .setDescription("Other woman user")
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const boyfriend = interaction.options.getUser("boyfriend");
      const girlfriend = interaction.options.getUser("girlfriend");
      const woman = interaction.options.getUser("woman");

      const boyfriendAvatar = boyfriend.displayAvatarURL({
        extension: "png",
        size: 512,
      });

      const girlfriendAvatar = girlfriend.displayAvatarURL({
        extension: "png",
        size: 512,
      });

      const womanAvatar = woman.displayAvatarURL({
        extension: "png",
        size: 512,
      });

      const url =
        `https://vacefron.nl/api/distractedbf` +
        `?boyfriend=${encodeURIComponent(boyfriendAvatar)}` +
        `&girlfriend=${encodeURIComponent(girlfriendAvatar)}` +
        `&woman=${encodeURIComponent(womanAvatar)}`;

      const res = await fetch(url);

      if (!res.ok) {
        return interaction.editReply("❌ API Error.");
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      const file = new AttachmentBuilder(buffer, {
        name: "distractedbf.png",
      });

      await interaction.editReply({
        files: [file],
      });

    } catch (err) {
      console.error("DistractedBF Error:", err);
      await interaction.editReply("❌ Failed.");
    }
  },
};
