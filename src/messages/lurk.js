const { EmbedBuilder } = require("discord.js");

const getRandomColor = () => Math.floor(Math.random() * 0xFFFFFF);

module.exports = {
  name: "lurk",
  description: "Lurk in the shadows",
  usage: "lurk",
  category: "roleplay",
  prefixOnly: true,
  requiresTarget: false,

  async execute(message, args, client) {
    // Delete user's command
    try {
      await message.delete();
    } catch (err) {}

    try {
      const res = await fetch("https://nekos.best/api/v2/lurk");
      const data = await res.json();

      const embed = new EmbedBuilder()
        .setDescription(`${message.author} is lurking`)
        .setImage(data.results[0].url)
        .setColor(getRandomColor());

      await message.channel.send({ embeds: [embed] });
    } catch (err) {
      console.error("Lurk Error:", err);
      await message.channel.send("❌ Failed to fetch lurk image.");
    }
  },
};
