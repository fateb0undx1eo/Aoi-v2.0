const { EmbedBuilder } = require("discord.js");
const Prefix = require("../schemas/prefixSchema");

const getRandomColor = () => Math.floor(Math.random() * 0xFFFFFF);

module.exports = {
  name: "handhold",
  description: "Hold someone's hand!",
  usage: "handhold <@user>",
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
      return message.reply(`❌ Please mention someone to hold hands with! Usage: \`${guildPrefix}handhold @user\``);
    }

    if (target.id === message.author.id) {
      return message.reply("❌ You can't hold your own hand!");
    }

    if (target.bot) {
      return message.reply("❌ You can't hold hands with bots!");
    }

    try {
      const res = await fetch("https://nekos.best/api/v2/handhold");
      const data = await res.json();

      const embed = new EmbedBuilder()
        .setDescription(`${message.author} holds hands with ${target}`)
        .setImage(data.results[0].url)
        .setColor(getRandomColor());

      await message.channel.send({ embeds: [embed] });
    } catch (err) {
      console.error("Handhold Error:", err);
      await message.channel.send("❌ Failed to fetch handhold image.");
    }
  },
};
