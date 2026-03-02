const { EmbedBuilder } = require("discord.js");

const getRandomColor = () => Math.floor(Math.random() * 0xFFFFFF);

module.exports = {
  name: "angry",
  description: "Express anger",
  usage: "angry",
  category: "roleplay",
  prefixOnly: true,
  requiresTarget: false,

  async execute(message, args, client) {
    // Delete user's command
    try {
      await message.delete();
    } catch (err) {}

    try {
      const res = await fetch("https://nekos.best/api/v2/angry");
      const data = await res.json();

      const embed = new EmbedBuilder()
        .setDescription(`${message.author} is angry`)
        .setImage(data.results[0].url)
        .setColor(getRandomColor());

      await message.channel.send({ embeds: [embed] });
    } catch (err) {
      console.error("Angry Error:", err);
      await message.channel.send("❌ Failed to fetch angry image.");
    }
  },
};
