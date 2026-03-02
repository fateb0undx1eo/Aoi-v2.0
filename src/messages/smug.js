const { EmbedBuilder } = require("discord.js");

const getRandomColor = () => Math.floor(Math.random() * 0xFFFFFF);

module.exports = {
  name: "smug",
  description: "Look smug",
  usage: "smug",
  category: "roleplay",
  prefixOnly: true,
  requiresTarget: false,

  async execute(message, args, client) {
    // Delete user's command
    try {
      await message.delete();
    } catch (err) {}

    try {
      const res = await fetch("https://nekos.best/api/v2/smug");
      const data = await res.json();

      const embed = new EmbedBuilder()
        .setDescription(`${message.author} looks smug`)
        .setImage(data.results[0].url)
        .setColor(getRandomColor());

      await message.channel.send({ embeds: [embed] });
    } catch (err) {
      console.error("Smug Error:", err);
      await message.channel.send("❌ Failed to fetch smug image.");
    }
  },
};
