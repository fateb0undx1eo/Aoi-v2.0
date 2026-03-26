const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const fetch = require("node-fetch");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("glass")
    .setDescription("Glass effect 🪟")
    .addUserOption(o =>
      o.setName("user").setDescription("Mention user").setRequired(false)
    )
    .addAttachmentOption(o =>
      o.setName("image").setDescription("Upload image").setRequired(false)
    ),

  async execute(interaction) {
    try {
      const user = interaction.options.getUser("user");
      const image = interaction.options.getAttachment("image");

      if (!user && !image)
        return interaction.reply({ content: "❌ Provide user or image.", ephemeral: true });

      await interaction.deferReply();

      const avatar = user
        ? user.displayAvatarURL({ extension: "png", size: 512 })
        : image.url;

      const url = `https://api.some-random-api.com/canvas/overlay/glass?avatar=${encodeURIComponent(avatar)}`;

      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`API returned ${res.status}`);
      }
      
      const buf = await res.buffer();

      await interaction.editReply({
        files: [new AttachmentBuilder(buf, { name: "glass.png" })]
      });
    } catch (error) {
      console.error('Glass command error:', error);
      const errorMessage = { content: "❌ Failed to generate the glass image. Please try again." };
      
      if (interaction.deferred) {
        await interaction.editReply(errorMessage).catch(() => {});
      } else if (!interaction.replied) {
        await interaction.reply({ ...errorMessage, ephemeral: true }).catch(() => {});
      }
    }
  }
};
