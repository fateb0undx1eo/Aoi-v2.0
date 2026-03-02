const {
  SlashCommandBuilder,
  AttachmentBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("dockofshame")
    .setDescription("Dock of shame meme")
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
    ),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const user = interaction.options.getUser("user");
      const image = interaction.options.getAttachment("image");

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
        `https://vacefron.nl/api/dockofshame?user=` +
        encodeURIComponent(imageUrl);

      const res = await fetch(url);

      if (!res.ok) {
        return interaction.editReply("❌ API Error.");
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      const file = new AttachmentBuilder(buffer, {
        name: "dockofshame.png",
      });

      await interaction.editReply({
        files: [file],
      });

    } catch (err) {
      console.error("DockOfShame Error:", err);
      await interaction.editReply("❌ Failed.");
    }
  },
};
