const afkSchema = require('../../schemas/afkSchema');
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

            await message.reply({
                content: `Welcome back <@${message.author.id}>! You were AFK for **${readableTime}**.`,
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

                await message.reply({
                    content: `**${user.username}** is currently AFK\n> **Reason:** ${afkUser.reason || "No reason provided"}\n> **Since:** ${readableTime} ago`,
                    allowedMentions: { repliedUser: false }
                }).catch(() => {});

                // =============================
                // 🔵 DM NOTIFY SYSTEM
                // =============================
                if (afkUser.dmNotify) {
                    try {
                        await user.send(
                            `You were mentioned by **${message.author.tag}** in **${message.guild.name}**.\n\n` +
                            `> **Message:** ${message.content}\n` +
                            `[Jump to message](${message.url})`
                        );
                    } catch (err) {
                        console.log(`Couldn't send DM to ${user.tag}`);
                    }
                }
            }
        }
    }
};
