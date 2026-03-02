const {
  SlashCommandBuilder,
  AttachmentBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("emergencymeeting")
    .setDescription("Among Us emergency meeting meme")
    .addStringOption(option =>
      option
        .setName("text")
        .setDescription("Meeting text")
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const text = interaction.options.getString("text");

      const url =
        `https://vacefron.nl/api/emergencymeeting?text=` +
        encodeURIComponent(text);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) {
        return interaction.editReply("❌ API Error.");
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      const file = new AttachmentBuilder(buffer, {
        name: "emergencymeeting.png",
      });

      await interaction.editReply({
        files: [file],
      });

    } catch (err) {
      console.error("EmergencyMeeting Error:", err);
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply("❌ Failed to generate meme.").catch(() => {});
      } else {
        await interaction.reply({ content: "❌ Failed to generate meme.", ephemeral: true }).catch(() => {});
      }
    }
  },
};
