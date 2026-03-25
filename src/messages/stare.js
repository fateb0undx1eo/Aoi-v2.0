const { EmbedBuilder } = require("discord.js");
const { getRoleplayGIF } = require("../utils/roleplayAPI");
const { getRoleplayPrefix } = require("../utils/prefixHelper");
const logger = require("../utils/winstonLogger");

const getRandomColor = () => Math.floor(Math.random() * 0xFFFFFF);

module.exports = {
  name: "stare",
  description: "Stare",
  usage: "stare",
  category: "roleplay",
  prefixOnly: true,
  requiresTarget: false,

  async execute(message, args, client) {
    // Delete user's command
    try {
      await message.delete();
    } catch (err) {}


    try {
      const gifUrl = await getRoleplayGIF('stare');

      const embed = new EmbedBuilder()
        .setDescription(`${message.author} stares`)
        .setImage(gifUrl)
        .setColor(getRandomColor());

      await message.channel.send({ embeds: [embed] });
      
      logger.command('stare', message.author.id, message.guild.id, true);
    } catch (err) {
      logger.error("Stare command error:", err);
      await message.channel.send("Failed to fetch stare image.");
    }
  },
};
