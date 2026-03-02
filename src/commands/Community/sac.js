const {
  SlashCommandBuilder,
  EmbedBuilder,
  ChannelType,
  PermissionsBitField,
} = require("discord.js");

require("dotenv").config();

// ===== CONFIG =====
const MAX_DELETE = 100;
const AUTO_DELETE = 15000; // 15 sec
const GIF_URL =
  "https://cdn.discordapp.com/attachments/1457404028760625327/1474098042482196480/ezgif-2e59e8189341c324.gif";
// ==================

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sac")
    .setDescription("Begin the Eclipse and sacrifice messages")

    // Amount option
    .addIntegerOption(option =>
      option
        .setName("amount")
        .setDescription("Number of messages to sacrifice")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(MAX_DELETE)
    )

    // Channel option
    .addChannelOption(option =>
      option
        .setName("channel")
        .setDescription("Target channel (optional)")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      // 1️⃣ Defer reply
      await interaction.deferReply();

      // 2️⃣ Get protected reply
      const protectedMsg = await interaction.fetchReply();

      // 3️⃣ Role check
      const roleId = process.env.ECLIPSE_ID;

      if (!roleId) {
        return interaction.editReply(
          "❌ ECLIPSE_ID not set in .env file."
        );
      }

      if (!interaction.member.roles.cache.has(roleId)) {
        return interaction.editReply(
          "❌ You are not permitted to invoke the Eclipse."
        );
      }

      // 4️⃣ Get options
      const amount = interaction.options.getInteger("amount");

      const targetChannel =
        interaction.options.getChannel("channel") ||
        interaction.channel;

      // 5️⃣ Permission check
      if (
        !targetChannel
          .permissionsFor(interaction.client.user)
          ?.has(PermissionsBitField.Flags.ManageMessages)
      ) {
        return interaction.editReply(
          "❌ I don't have permission to manage messages there."
        );
      }

      // 6️⃣ Safe fetch limit (max 100)
      const fetchLimit = Math.min(amount + 20, 100);

      const messages = await targetChannel.messages.fetch({
        limit: fetchLimit,
      });

      // 7️⃣ Filter protected message
      const filtered = messages.filter(msg => {
        if (targetChannel.id === interaction.channel.id) {
          return msg.id !== protectedMsg.id;
        }
        return true;
      });

      // 8️⃣ Pick messages
      const toDelete = filtered.first(amount);

      if (!toDelete.length) {
        return interaction.editReply(
          "⚠️ No valid messages found to delete."
        );
      }

      // 9️⃣ Bulk delete
      const deleted = await targetChannel.bulkDelete(
        toDelete,
        true // ignore old messages
      );

      // 🔟 Build embed
      const embed = new EmbedBuilder()
        .setColor(0x5b0000) // Dark red
        .setTitle("The Eclipse Has Begun")
        .setDescription(
          `⚔️ **${deleted.size}** messages sacrificed in <#${targetChannel.id}>`
        )
        .setImage(GIF_URL)
        .setFooter({
          text: "The Brand of Sacrifice has been cast.",
        });

      // 1️⃣1️⃣ Send reply
      await interaction.editReply({
        embeds: [embed],
      });

      // 1️⃣2️⃣ Auto delete reply
      setTimeout(() => {
        interaction.deleteReply().catch(() => {});
      }, AUTO_DELETE);

    } catch (err) {
      console.error("SAC ERROR:", err);

      try {
        if (interaction.deferred) {
          await interaction.editReply("❌ The Eclipse failed.");
        }
      } catch {}
    }
  },
};