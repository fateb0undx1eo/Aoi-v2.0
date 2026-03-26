const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const WaifuConfig = require("../../schemas/waifuConfigSchema");

// Cooldown storage
const globalCooldowns = new Map(); // guildId -> timestamp
const userCooldowns = new Map();   // userId -> timestamp

// Use waifu.it API for high quality husbando images
const HUSBANDO_API_URL = "https://waifu.it/api/v4/husbando";

// ==================== HELPER FUNCTIONS ====================

async function fetchHusbandoImage() {
  try {
    const res = await fetch(HUSBANDO_API_URL);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    
    if (!data || !data.url) {
      throw new Error("Invalid API response");
    }
    
    return data.url;
  } catch (err) {
    throw new Error("Failed to fetch husbando image");
  }
}

function checkCooldown(guildId, userId, config) {
  const now = Date.now();
  
  // Check global cooldown
  const globalCd = globalCooldowns.get(guildId);
  if (globalCd && now < globalCd) {
    const remaining = Math.ceil((globalCd - now) / 1000);
    return { onCooldown: true, type: "global", remaining };
  }
  
  // Check user cooldown
  const userCd = userCooldowns.get(userId);
  if (userCd && now < userCd) {
    const remaining = Math.ceil((userCd - now) / 1000);
    return { onCooldown: true, type: "user", remaining };
  }
  
  return { onCooldown: false };
}

function setCooldowns(guildId, userId, config) {
  const now = Date.now();
  globalCooldowns.set(guildId, now + config.globalCooldown);
  userCooldowns.set(userId, now + config.userCooldown);
}

// ==================== MAIN COMMAND ====================

module.exports = {
  name: "husbando",
  description: "Claim a random husbando!",
  usage: "husbando",
  category: "fun",
  prefixOnly: true,
  requiresTarget: false,

  async execute(message, args, client) {
    // Get config from database
    let config = await WaifuConfig.findOne({ guildId: message.guild.id });
    if (!config) {
      config = await WaifuConfig.create({ guildId: message.guild.id });
    }

    // Check cooldowns
    const cooldownCheck = checkCooldown(message.guild.id, message.author.id, config);
    if (cooldownCheck.onCooldown) {
      const errorMsg = await message.channel.send(
        cooldownCheck.type === "global" 
          ? `Server cooldown active. Try again in ${cooldownCheck.remaining}s`
          : `You're on cooldown. Try again in ${cooldownCheck.remaining}s`
      );
      try {
        await message.delete();
      } catch (err) {}
      setTimeout(() => errorMsg.delete().catch(() => {}), 5000);
      return;
    }

    // Set cooldowns
    setCooldowns(message.guild.id, message.author.id, config);

    // Delete user's command
    try {
      await message.delete();
    } catch (err) {}

    // Fetch image
    let imageUrl;
    try {
      imageUrl = await fetchHusbandoImage();
    } catch (err) {
      return message.channel.send("Failed to fetch husbando image. Try again later.");
    }

    // Create embed
    const embed = new EmbedBuilder()
      .setTitle("A Wild Husbando Appeared!")
      .setDescription("**Status:** Unclaimed\n\nWill you claim him?")
      .setImage(imageUrl)
      .setColor(0x4169e1)
      .setFooter({ text: `Expires in ${config.cardLifetime / 1000}s` })
      .setTimestamp();

    // Create buttons (Smash is green)
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId("husbando_smash")
          .setLabel("Smash")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("husbando_pass")
          .setLabel("Pass")
          .setStyle(ButtonStyle.Danger)
      );

    const cardMessage = await message.channel.send({ embeds: [embed], components: [row] });

    // Claim state
    let isClaimed = false;
    let claimedBy = null;
    let claimedAt = null;

    // Create collector
    const collector = cardMessage.createMessageComponentCollector({
      time: config.collectorTime
    });

    collector.on("collect", async (interaction) => {
      // Handle Smash
      if (interaction.customId === "husbando_smash") {
        if (isClaimed) {
          return interaction.reply({ content: "This husbando has already been claimed!", ephemeral: true });
        }

        // Claim the husbando
        isClaimed = true;
        claimedBy = interaction.user;
        claimedAt = new Date();

        // Update embed
        const claimedEmbed = new EmbedBuilder()
          .setTitle("Husbando Claimed!")
          .setDescription(`**Claimed by:** ${claimedBy}\n**Time:** ${claimedAt.toLocaleTimeString()}`)
          .setImage(imageUrl)
          .setColor(0x00ff00)
          .setTimestamp();

        // Disable buttons
        const disabledRow = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId("husbando_smash")
              .setLabel("Smash")
              .setStyle(ButtonStyle.Success)
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId("husbando_pass")
              .setLabel("Pass")
              .setStyle(ButtonStyle.Danger)
              .setDisabled(true)
          );

        await cardMessage.edit({ embeds: [claimedEmbed], components: [disabledRow] });
        await interaction.reply({ content: "You claimed this husbando!", ephemeral: true });

        // Send DM
        try {
          const dmEmbed = new EmbedBuilder()
            .setTitle("Your Claimed Husbando")
            .setDescription(`**Server:** ${message.guild.name}\n**Claimed at:** ${claimedAt.toLocaleString()}`)
            .setImage(imageUrl)
            .setColor(0x4169e1)
            .setTimestamp();

          await claimedBy.send({ embeds: [dmEmbed] });
        } catch (err) {
          await interaction.followUp({ content: "Couldn't send DM. Please enable DMs from server members.", ephemeral: true });
        }

        // Delete after display time
        setTimeout(async () => {
          try {
            await cardMessage.delete();
          } catch (err) {
            // Message already deleted
          }
        }, config.claimDisplayTime);

        collector.stop();
      }

      // Handle Pass
      if (interaction.customId === "husbando_pass") {
        if (isClaimed) {
          return interaction.reply({ content: "This husbando has already been claimed!", ephemeral: true });
        }

        await interaction.reply({ content: "You passed on this husbando.", ephemeral: true });
        
        try {
          await cardMessage.delete();
        } catch (err) {
          // Message already deleted
        }
        
        collector.stop();
      }
    });

    // Auto-expire
    setTimeout(async () => {
      if (!isClaimed) {
        try {
          await cardMessage.delete();
        } catch (err) {
          // Message already deleted
        }
        collector.stop();
      }
    }, config.cardLifetime);

    collector.on("end", async () => {
      // Cleanup if message still exists
      try {
        const msg = await cardMessage.fetch();
        if (msg && !isClaimed) {
          const expiredRow = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setCustomId("husbando_smash")
                .setLabel("Smash")
                .setStyle(ButtonStyle.Success)
                .setDisabled(true),
              new ButtonBuilder()
                .setCustomId("husbando_pass")
                .setLabel("Pass")
                .setStyle(ButtonStyle.Danger)
                .setDisabled(true)
            );
          await cardMessage.edit({ components: [expiredRow] });
        }
      } catch (err) {
        // Message deleted or not found
      }
    });
  },
};