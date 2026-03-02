const {
  SlashCommandBuilder,
  AttachmentBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stonks")
    .setDescription("Stonks meme")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("User avatar")
        .setRequired(false)
    )
    .addAttachmentOption(option =>
      option
        .setName("image")
        .setDescription("Upload image")
        .setRequired(false)
    )
    .addBooleanOption(option =>
      option
        .setName("notstonks")
        .setDescription("Not stonks? (default: false)")
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const user = interaction.options.getUser("user");
      const image = interaction.options.getAttachment("image");
      const notStonks = interaction.options.getBoolean("notstonks") || false;

      let imageUrl;

      if (image) {
        imageUrl = image.url;
      } else if (user) {
        imageUrl = user.displayAvatarURL({
          extension: "png",
          size: 512,
        });
      } else {
        imageUrl = interaction.user.displayAvatarURL({
          extension: "png",
          size: 512,
        });
      }

      const url =
        `https://vacefron.nl/api/stonks?user=` +
        encodeURIComponent(imageUrl) +
        `&notStonks=${notStonks}`;

      const res = await fetch(url);

      if (!res.ok) {
        return interaction.editReply("❌ API Error.");
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      const file = new AttachmentBuilder(buffer, {
        name: "stonks.png",
      });

      await interaction.editReply({
        files: [file],
      });

    } catch (err) {
      console.error("Stonks Error:", err);
      await interaction.editReply("❌ Failed.");
    }
  },
};
