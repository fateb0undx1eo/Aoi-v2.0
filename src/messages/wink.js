const { EmbedBuilder } = require("discord.js");

const getRandomColor = () => Math.floor(Math.random() * 0xFFFFFF);

module.exports = {
  name: "wink",
  description: "Wink at someone or just wink!",
  usage: "wink [@user]",
  category: "roleplay",
  prefixOnly: true,
  requiresTarget: false,

  async execute(message, args, client) {
    // Delete user's command
    try {
      await message.delete();
    } catch (err) {}

    const target = message.mentions.users.first();
    
    try {
      const res = await fetch("https://nekos.best/api/v2/wink");
      const data = await res.json();

      const description = target 
        ? `${message.author} winks at ${target}`
        : `${message.author} winks`;

      const embed = new EmbedBuilder()
        .setDescription(description)
        .setImage(data.results[0].url)
        .setColor(getRandomColor());

      await message.channel.send({ embeds: [embed] });
    } catch (err) {
      console.error("Wink Error:", err);
      await message.channel.send("❌ Failed to fetch wink image.");
    }
  },
};
