const {
  SlashCommandBuilder,
  AttachmentBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("icanmilkyou")
    .setDescription("I can milk you meme")
    .addUserOption(option =>
      option
        .setName("user1")
        .setDescription("First user")
        .setRequired(true)
    )
    .addUserOption(option =>
      option
        .setName("user2")
        .setDescription("Second user (optional)")
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const user1 = interaction.options.getUser("user1");
      const user2 = interaction.options.getUser("user2");

      const user1Avatar = user1.displayAvatarURL({
        extension: "png",
        size: 512,
      });

      let url = `https://vacefron.nl/api/icanmilkyou?user1=${encodeURIComponent(user1Avatar)}`;

      if (user2) {
        const user2Avatar = user2.displayAvatarURL({
          extension: "png",
          size: 512,
        });
        url += `&user2=${encodeURIComponent(user2Avatar)}`;
      }

      const res = await fetch(url);

      if (!res.ok) {
        return interaction.editReply("❌ API Error.");
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      const file = new AttachmentBuilder(buffer, {
        name: "icanmilkyou.png",
      });

      await interaction.editReply({
        files: [file],
      });

    } catch (err) {
      console.error("ICanMilkYou Error:", err);
      await interaction.editReply("❌ Failed.");
    }
  },
};
