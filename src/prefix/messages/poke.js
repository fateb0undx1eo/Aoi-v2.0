const { EmbedBuilder } = require("discord.js");
const { getRoleplayGIF } = require("../utils/roleplayAPI");
const { getRoleplayPrefix } = require("../utils/prefixHelper");
const logger = require("../utils/winstonLogger");

const getRandomColor = () => Math.floor(Math.random() * 0xFFFFFF);

module.exports = {
  name: "poke",
  description: "Poke someone!",
  usage: "poke <@user>",
  category: "roleplay",
  prefixOnly: true,
  requiresTarget: true,

  async execute(message, args, client) {
    // Delete user's command
    try {
      await message.delete();
    } catch (err) {}

    const target = message.mentions.users.first();
    const roleplayPrefix = await getRoleplayPrefix(message.guild?.id);
    
    if (!target) {
      const errorMsg = await message.channel.send(`Please mention someone to poke! Usage: \`${roleplayPrefix}poke @user\``);
      setTimeout(() => errorMsg.delete().catch(() => {}), 5000);
      return;
    }

    if (target.id === message.author.id) {
      const errorMsg = await message.channel.send("You can't poke yourself!");
      setTimeout(() => errorMsg.delete().catch(() => {}), 5000);
      return;
    }

    if (target.bot) {
      const errorMsg = await message.channel.send("You can't poke bots!");
      setTimeout(() => errorMsg.delete().catch(() => {}), 5000);
      return;
    }

    try {
      const gifUrl = await getRoleplayGIF('poke');

      const embed = new EmbedBuilder()
        .setDescription(`${message.author} pokes ${target}`)
        .setImage(gifUrl)
        .setColor(getRandomColor());

      await message.channel.send({ embeds: [embed] });
      
      logger.command('poke', message.author.id, message.guild.id, true);
    } catch (err) {
      logger.error("Poke command error:", err);
      await message.channel.send("Failed to fetch poke image.");
    }
  },
};
