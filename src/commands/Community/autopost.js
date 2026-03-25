const { SlashCommandBuilder, ChannelType, EmbedBuilder } = require('discord.js');
const { startAutoPoster, updateInterval, stopAutoPoster, getAutoPosterState } = require('../../functions/handlers/autoPoster');
const subreddits = require('../../functions/handlers/subreddits');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autopost')
        .setDescription('Manage meme auto-posting')
        .addSubcommand(subcommand =>
            subcommand
                .setName('start')
                .setDescription('Start auto-posting memes')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel for meme posts')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('interval')
                        .setDescription('Interval in seconds (min 10)')
                        .setRequired(true)
                        .setMinValue(10)
                )
                .addRoleOption(option =>
                    option.setName('ping_role')
                        .setDescription('Role to ping when posting memes (optional)')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('stop')
                .setDescription('Stop auto-posting memes')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('View auto-post statistics and settings')
        ),

    async execute(interaction, client) {
        if (!interaction.memberPermissions?.has('Administrator')) {
            return interaction.reply({ content: "❌ Only admins can use this command.", ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'start') {
            const channel = interaction.options.getChannel('channel');
            const intervalSec = interaction.options.getInteger('interval');
            const pingRole = interaction.options.getRole('ping_role');

            const success = updateInterval(client, intervalSec * 1000, channel.id, pingRole?.id);

            if (success) {
                const embed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('✅ Auto-Post Started')
                    .setDescription(`Memes will be posted every **${intervalSec} seconds** in ${channel}`)
                    .addFields(
                        { name: '📢 Ping Role', value: pingRole ? `${pingRole}` : 'None', inline: true },
                        { name: '⏰ Next Post', value: `<t:${Math.floor((Date.now() + intervalSec * 1000) / 1000)}:R>`, inline: true }
                    )
                    .setTimestamp();

                return interaction.reply({ embeds: [embed], ephemeral: true });
            } else {
                return interaction.reply({ content: "❌ Failed to start auto-post.", ephemeral: true });
            }
        }

        if (subcommand === 'stop') {
            const stopped = stopAutoPoster();
            if (stopped) {
                return interaction.reply({ content: "✅ Auto-post stopped.", ephemeral: true });
            } else {
                return interaction.reply({ content: "❌ Auto-post is not running.", ephemeral: true });
            }
        }

        if (subcommand === 'stats') {
            const state = getAutoPosterState();

            if (!state.running) {
                return interaction.reply({ content: "❌ Auto-post is not currently running.", ephemeral: true });
            }

            const channel = client.channels.cache.get(state.channelId);
            const nextPostTime = Math.floor((Date.now() + state.intervalSeconds * 1000) / 1000);

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('📊 Auto-Post Statistics')
                .addFields(
                    { name: '📺 Channel', value: channel ? `${channel}` : 'Unknown', inline: true },
                    { name: '⏱️ Interval', value: `${state.intervalSeconds} seconds`, inline: true },
                    { name: '📢 Ping Role', value: state.pingRoleId ? `<@&${state.pingRoleId}>` : 'None', inline: true },
                    { name: '⏰ Next Post', value: `<t:${nextPostTime}:R>`, inline: true },
                    { name: '📈 Total Posts', value: `${state.totalPosts || 0}`, inline: true },
                    { name: '🔄 Status', value: '🟢 Active', inline: true },
                    { name: '📚 Active Subreddits', value: `${subreddits.length} subreddits`, inline: false }
                )
                .setDescription(`**Top Subreddits:**\n${subreddits.slice(0, 10).map(s => `• r/${s}`).join('\n')}`)
                .setFooter({ text: `Use /autopost stop to disable` })
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
