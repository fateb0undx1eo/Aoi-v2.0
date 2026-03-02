const { EmbedBuilder } = require("discord.js");
const Prefix = require("../schemas/prefixSchema");

const getRandomColor = () => Math.floor(Math.random() * 0xFFFFFF);

module.exports = {
  name: "hug",
  description: "Hug someone!",
  usage: "hug <@user>",
  category: "roleplay",
  prefixOnly: true,
  requiresTarget: true,

  async execute(message, args, client) {
    // Delete user's command
    try {
      await message.delete();
    } catch (err) {}

    const prefix = await Prefix.findOne({ guildId: message.guild.id });
    const guildPrefix = prefix ? prefix.prefix : "!";

    const target = message.mentions.users.first();
    
    if (!target) {
      const errorMsg = await message.channel.send(`❌ Please mention someone to hug! Usage: \`${guildPrefix}hug @user\``);
      setTimeout(() => errorMsg.delete().catch(() => {}), 5000);
      return;
    }

    if (target.id === message.author.id) {
      const errorMsg = await message.channel.send("❌ You can't hug yourself!");
      setTimeout(() => errorMsg.delete().catch(() => {}), 5000);
      return;
    }

    if (target.bot) {
      const errorMsg = await message.channel.send("❌ You can't hug bots!");
      setTimeout(() => errorMsg.delete().catch(() => {}), 5000);
      return;
    }

    try {
      const res = await fetch("https://nekos.best/api/v2/hug");
      const data = await res.json();

      const embed = new EmbedBuilder()
        .setDescription(`${message.author} hugs ${target}`)
        .setImage(data.results[0].url)
        .setColor(getRandomColor());

      await message.channel.send({ embeds: [embed] });
    } catch (err) {
      console.error("Hug Error:", err);
      await message.channel.send("❌ Failed to fetch hug image.");
    }
  },
};
