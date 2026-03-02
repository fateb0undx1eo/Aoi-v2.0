const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('» Advanced bulk message deletion with smart filtering')
        .addIntegerOption(option =>
            option
                .setName('amount')
                .setDescription('Number of messages to delete (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)
        )
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('Only delete messages from this user')
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName('filter')
                .setDescription('Filter messages by type')
                .setRequired(false)
                .addChoices(
                    { name: 'All Messages', value: 'all' },
                    { name: 'Bot Messages', value: 'bots' },
                    { name: 'Human Messages', value: 'humans' },
                    { name: 'Messages with Links', value: 'links' },
                    { name: 'Messages with Attachments', value: 'attachments' },
                    { name: 'Messages with Embeds', value: 'embeds' },
                    { name: 'Messages with Mentions', value: 'mentions' }
                )
        )
        .addStringOption(option =>
            option
                .setName('contains')
                .setDescription('Only delete messages containing this text')
                .setRequired(false)
        ),

    userPermissions: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.ManageMessages],

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const amount = interaction.options.getInteger('amount');
            const targetUser = interaction.options.getUser('user');
            const filter = interaction.options.getString('filter') || 'all';
            const contains = interaction.options.getString('contains');

            // Fetch messages
            const messages = await interaction.channel.messages.fetch({ limit: 100 });

            // Filter messages
            let filteredMessages = Array.from(messages.values());

            // Filter by user
            if (targetUser) {
                filteredMessages = filteredMessages.filter(msg => msg.author.id === targetUser.id);
            }

            // Filter by type
            switch (filter) {
                case 'bots':
                    filteredMessages = filteredMessages.filter(msg => msg.author.bot);
                    break;
                case 'humans':
                    filteredMessages = filteredMessages.filter(msg => !msg.author.bot);
                    break;
                case 'links':
                    filteredMessages = filteredMessages.filter(msg => 
                        msg.content.match(/https?:\/\/[^\s]+/gi)
                    );
                    break;
                case 'attachments':
                    filteredMessages = filteredMessages.filter(msg => msg.attachments.size > 0);
                    break;
                case 'embeds':
                    filteredMessages = filteredMessages.filter(msg => msg.embeds.length > 0);
                    break;
                case 'mentions':
                    filteredMessages = filteredMessages.filter(msg => 
                        msg.mentions.users.size > 0 || msg.mentions.roles.size > 0
                    );
                    break;
            }

            // Filter by content
            if (contains) {
                filteredMessages = filteredMessages.filter(msg => 
                    msg.content.toLowerCase().includes(contains.toLowerCase())
                );
            }

            // Limit to amount
            filteredMessages = filteredMessages.slice(0, amount);

            if (filteredMessages.length === 0) {
                return interaction.editReply('❌ No messages found matching your criteria!');
            }

            // Separate old and new messages (Discord API limitation: can't bulk delete messages older than 14 days)
            const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
            const newMessages = filteredMessages.filter(msg => msg.createdTimestamp > twoWeeksAgo);
            const oldMessages = filteredMessages.filter(msg => msg.createdTimestamp <= twoWeeksAgo);

            let deletedCount = 0;

            // Bulk delete new messages
            if (newMessages.length > 0) {
                const deleted = await interaction.channel.bulkDelete(newMessages, true);
                deletedCount += deleted.size;
            }

            // Individual delete for old messages
            for (const msg of oldMessages) {
                try {
                    await msg.delete();
                    deletedCount++;
                } catch (err) {
                    // Message might already be deleted or we don't have permission
                }
            }

            // Success embed
            const successEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Messages Purged Successfully')
                .addFields(
                    { name: '🗑️ Deleted', value: `${deletedCount} messages`, inline: true },
                    { name: '👮 Moderator', value: interaction.user.tag, inline: true },
                    { name: '📍 Channel', value: interaction.channel.name, inline: true }
                )
                .setTimestamp();

            if (targetUser) {
                successEmbed.addFields({ name: '👤 Target User', value: targetUser.tag, inline: true });
            }

            if (filter !== 'all') {
                successEmbed.addFields({ name: '🔍 Filter', value: filter, inline: true });
            }

            if (contains) {
                successEmbed.addFields({ name: '📝 Contains', value: contains, inline: true });
            }

            if (oldMessages.length > 0) {
                successEmbed.setFooter({ text: `Note: ${oldMessages.length} messages were older than 14 days and deleted individually` });
            }

            await interaction.editReply({ embeds: [successEmbed] });

            // Log to mod log channel
            const logChannel = interaction.guild.channels.cache.find(
                ch => ch.name === 'mod-logs' || ch.name === 'moderation-logs'
            );

            if (logChannel && logChannel.id !== interaction.channel.id) {
                const logEmbed = new EmbedBuilder()
                    .setColor(0xFF6600)
                    .setTitle('🗑️ Messages Purged')
                    .addFields(
                        { name: '👮 Moderator', value: `${interaction.user.tag} (${interaction.user.id})` },
                        { name: '📍 Channel', value: `${interaction.channel.name} (${interaction.channel.id})` },
                        { name: '🗑️ Deleted', value: `${deletedCount} messages` }
                    )
                    .setTimestamp();

                if (targetUser) {
                    logEmbed.addFields({ name: '👤 Target User', value: `${targetUser.tag} (${targetUser.id})` });
                }

                if (filter !== 'all') {
                    logEmbed.addFields({ name: '🔍 Filter', value: filter });
                }

                await logChannel.send({ embeds: [logEmbed] });
            }

        } catch (error) {
            console.error('Purge command error:', error);
            await interaction.editReply('❌ Failed to purge messages. Please check my permissions and try again.');
        }
    }
};
