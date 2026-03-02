const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  disabled: false,

  data: new SlashCommandBuilder()
    .setName("water")
    .setDescription("Send a hydration reminder and ping the hydration role"),

  // Optional: prevent spam
  cooldown: 30, // 30 seconds

  async execute(interaction, client) {


    
    try {

      const roleId = "1415698521709084795";

      const waterMessages = [
        `💧 Hydration Status: LOW — Time to refill! <@&${roleId}>`,
        `🧠 Pro Tip: A hydrated brain thinks better. Drink water! <@&${roleId}>`,
        `🚨 DRINK WATER ALERT — <@&${roleId}>`,
        `📢 Reminder: Your cells want water! <@&${roleId}>`,
        `⚡ System Message: Run hydration protocol. <@&${roleId}>`,
        `🏆 Achievement Unlocked: Hydration! <@&${roleId}>`,
        `📊 Scientific Update: Water = Energy. Apply now. <@&${roleId}>`,
        `🌊 Friendly nudge: Go grab a glass. <@&${roleId}>`
      ];

      const randomMessage =
        waterMessages[Math.floor(Math.random() * waterMessages.length)];

      await interaction.reply({
        content: randomMessage
      });

    } catch (error) {
      console.error("Water command error:", error);

      if (!interaction.replied) {
        await interaction.reply({
          content: "❌ Failed to send hydration reminder.",
          ephemeral: true
        });
      }
    }
  }
};
