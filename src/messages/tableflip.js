const { EmbedBuilder } = require("discord.js");

const getRandomColor = () => Math.floor(Math.random() * 0xFFFFFF);

module.exports = {
  name: "tableflip",
  description: "Flip a table in frustration",
  usage: "tableflip",
  category: "roleplay",
  prefixOnly: true,
  requiresTarget: false,

  async execute(message, args, client) {
    // Delete user's command
    try {
      await message.delete();
    } catch (err) {}

    try {
      const res = await fetch("https://nekos.best/api/v2/tableflip");
      const data = await res.json();

      const embed = new EmbedBuilder()
        .setDescription(`${message.author} flips a table`)
        .setImage(data.results[0].url)
        .setColor(getRandomColor());

      await message.channel.send({ embeds: [embed] });
    } catch (err) {
      console.error("Tableflip Error:", err);
      await message.channel.send("❌ Failed to fetch tableflip image.");
    }
  },
};
