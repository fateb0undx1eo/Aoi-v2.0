const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const WaifuConfig = require("../../schemas/waifuConfigSchema");

// Cooldown storage
const globalCooldowns = new Map(); // guildId -> timestamp
const userCooldowns = new Map();   // userId -> timestamp

// Use waifu.it API for high quality images
const WAIFU_API_URL = "https://waifu.it/api/v4/waifu";

// ==================== HELPER FUNCTIONS ====================

async function fetchWaifuImage() {
  try {
    const res = await fetch(WAIFU_API_URL);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    
    if (!data || !data.url) {
      throw new Error("Invalid API response");
    }
    
    return data.url;
  } catch (err) {
    throw new Error("Failed to fetch waifu image");
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
  name: "waifu",
  description: "Claim a random waifu!",
  usage: "waifu",
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
      imageUrl = await fetchWaifuImage();
    } catch (err) {
      return message.channel.send("Failed to fetch waifu image. Try again later.");
    }

    // Create embed
    const embed = new EmbedBuilder()
      .setTitle("A Wild Waifu Appeared!")
      .setDescription("**Status:** Unclaimed\n\nWill you claim her?")
      .setImage(imageUrl)
      .setColor(0xff69b4)
      .setFooter({ text: `Expires in ${config.cardLifetime / 1000}s` })
      .setTimestamp();

    // Create buttons (no emojis)
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId("waifu_smash")
          .setLabel("Smash")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("waifu_pass")
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
      if (interaction.customId === "waifu_smash") {
        if (isClaimed) {
          return interaction.reply({ content: "This waifu has already been claimed!", ephemeral: true });
        }

        // Claim the waifu
        isClaimed = true;
        claimedBy = interaction.user;
        claimedAt = new Date();

        // Update embed
        const claimedEmbed = new EmbedBuilder()
          .setTitle("Waifu Claimed!")
          .setDescription(`**Claimed by:** ${claimedBy}\n**Time:** ${claimedAt.toLocaleTimeString()}`)
          .setImage(imageUrl)
          .setColor(0x00ff00)
          .setTimestamp();

        // Disable buttons
        const disabledRow = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId("waifu_smash")
              .setLabel("Smash")
              .setStyle(ButtonStyle.Success)
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId("waifu_pass")
              .setLabel("Pass")
              .setStyle(ButtonStyle.Danger)
              .setDisabled(true)
          );

        await cardMessage.edit({ embeds: [claimedEmbed], components: [disabledRow] });
        await interaction.reply({ content: "You claimed this waifu!", ephemeral: true });

        // Send DM
        try {
          const dmEmbed = new EmbedBuilder()
            .setTitle("Your Claimed Waifu")
            .setDescription(`**Server:** ${message.guild.name}\n**Claimed at:** ${claimedAt.toLocaleString()}`)
            .setImage(imageUrl)
            .setColor(0xff69b4)
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
      if (interaction.customId === "waifu_pass") {
        if (isClaimed) {
          return interaction.reply({ content: "This waifu has already been claimed!", ephemeral: true });
        }

        await interaction.reply({ content: "You passed on this waifu.", ephemeral: true });
        
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
                .setCustomId("waifu_smash")
                .setLabel("Smash")
                .setStyle(ButtonStyle.Success)
                .setDisabled(true),
              new ButtonBuilder()
                .setCustomId("waifu_pass")
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