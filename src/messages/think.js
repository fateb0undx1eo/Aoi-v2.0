const { EmbedBuilder } = require("discord.js");

const getRandomColor = () => Math.floor(Math.random() * 0xFFFFFF);

module.exports = {
  name: "think",
  description: "Think deeply",
  usage: "think",
  category: "roleplay",
  prefixOnly: true,
  requiresTarget: false,

  async execute(message, args, client) {
    // Delete user's command
    try {
      await message.delete();
    } catch (err) {}

    try {
      const res = await fetch("https://nekos.best/api/v2/think");
      const data = await res.json();

      const embed = new EmbedBuilder()
        .setDescription(`${message.author} is thinking`)
        .setImage(data.results[0].url)
        .setColor(getRandomColor());

      await message.channel.send({ embeds: [embed] });
    } catch (err) {
      console.error("Think Error:", err);
      await message.channel.send("❌ Failed to fetch think image.");
    }
  },
};
