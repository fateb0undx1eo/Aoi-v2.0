const { EmbedBuilder } = require("discord.js");

const getRandomColor = () => Math.floor(Math.random() * 0xFFFFFF);

module.exports = {
  name: "facepalm",
  description: "Facepalm at something",
  usage: "facepalm",
  category: "roleplay",
  prefixOnly: true,
  requiresTarget: false,

  async execute(message, args, client) {
    // Delete user's command
    try {
      await message.delete();
    } catch (err) {}

    try {
      const res = await fetch("https://nekos.best/api/v2/facepalm");
      const data = await res.json();

      const embed = new EmbedBuilder()
        .setDescription(`${message.author} facepalms`)
        .setImage(data.results[0].url)
        .setColor(getRandomColor());

      await message.channel.send({ embeds: [embed] });
    } catch (err) {
      console.error("Facepalm Error:", err);
      await message.channel.send("❌ Failed to fetch facepalm image.");
    }
  },
};
