const afkSchema = require('../../schemas/afkSchema');
const { EmbedBuilder } = require('discord.js');
const ms = require('ms');

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        if (!message.guild || message.author.bot) return;

        // =============================
        // 🟢 REMOVE AFK IF USER TALKS
        // =============================
        const userAFK = await afkSchema.findOne({
            userId: message.author.id,
            guildId: message.guild.id
        });

        if (userAFK) {
            const duration = Date.now() - userAFK.timestamp;
            const readableTime = ms(duration, { long: true });

            await afkSchema.findOneAndDelete({
                userId: message.author.id,
                guildId: message.guild.id
            });

            const welcomeEmbed = new EmbedBuilder()
                .setColor(0x00ff00)
                .setDescription(`👋 Welcome back ${message.author}! You were AFK for **${readableTime}**.`)
                .setTimestamp();

            await message.reply({
                embeds: [welcomeEmbed],
                allowedMentions: { repliedUser: false }
            }).catch(() => {});
        }

        // =============================
        // 🟡 CHECK IF MENTIONED USER IS AFK
        // =============================
        if (message.mentions.users.size > 0) {
            for (const user of message.mentions.users.values()) {

                if (user.bot) continue;

                const afkUser = await afkSchema.findOne({
                    userId: user.id,
                    guildId: message.guild.id
                });

                if (!afkUser) continue;

                const duration = Date.now() - afkUser.timestamp;
                const readableTime = ms(duration, { long: true });

                const afkEmbed = new EmbedBuilder()
                    .setColor(0xffa500)
                    .setAuthor({ name: `${user.username} is currently AFK`, iconURL: user.displayAvatarURL() })
                    .addFields(
                        { name: '💬 Reason', value: afkUser.reason || "No reason provided", inline: false },
                        { name: '⏰ Duration', value: readableTime, inline: true },
                        { name: '📅 Since', value: `<t:${Math.floor(afkUser.timestamp / 1000)}:R>`, inline: true }
                    )
                    .setTimestamp();

                await message.reply({
                    embeds: [afkEmbed],
                    allowedMentions: { repliedUser: false }
                }).catch(() => {});

                // =============================
                // 🔵 DM NOTIFY SYSTEM
                // =============================
                if (afkUser.dmNotify) {
                    try {
                        const dmEmbed = new EmbedBuilder()
                            .setColor(0x5865f2)
                            .setTitle('📬 You were mentioned while AFK!')
                            .setDescription(`You were mentioned by **${message.author.tag}** in **${message.guild.name}**`)
                            .addFields(
                                { name: '💬 Message', value: message.content.length > 1024 ? message.content.substring(0, 1021) + '...' : message.content },
                                { name: '📍 Channel', value: `<#${message.channel.id}>`, inline: true },
                                { name: '🔗 Jump to Message', value: `[Click here](${message.url})`, inline: true }
                            )
                            .setThumbnail(message.author.displayAvatarURL())
                            .setTimestamp();

                        await user.send({ embeds: [dmEmbed] });
                    } catch (err) {
                        console.log(`Couldn't send DM to ${user.tag}`);
                    }
                }
            }
        }
    }
};
