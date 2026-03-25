const { SlashCommandBuilder, EmbedBuilder, ActivityType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('botconfig')
        .setDescription('Configure bot appearance and presence')
        .setDefaultMemberPermissions('0x0000000000000008') // Administrator permission as string
        .addSubcommand(subcommand =>
            subcommand
                .setName('presence')
                .setDescription('Update bot presence status and activity')
                .addStringOption(option =>
                    option
                        .setName('status')
                        .setDescription('Bot status')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Online', value: 'online' },
                            { name: 'Idle', value: 'idle' },
                            { name: 'Do Not Disturb', value: 'dnd' },
                            { name: 'Invisible', value: 'invisible' }
                        )
                )
                .addStringOption(option =>
                    option
                        .setName('type')
                        .setDescription('Activity type')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Playing', value: 'Playing' },
                            { name: 'Streaming', value: 'Streaming' },
                            { name: 'Listening', value: 'Listening' },
                            { name: 'Watching', value: 'Watching' },
                            { name: 'Competing', value: 'Competing' }
                        )
                )
                .addStringOption(option =>
                    option
                        .setName('activity')
                        .setDescription('Activity name (max 128 characters)')
                        .setRequired(true)
                        .setMaxLength(128)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('avatar')
                .setDescription('Update bot avatar')
                .addStringOption(option =>
                    option
                        .setName('image_url')
                        .setDescription('Image URL or data URI (PNG, JPG, GIF, WebP, max 8MB)')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('username')
                .setDescription('Update bot username')
                .addStringOption(option =>
                    option
                        .setName('new_name')
                        .setDescription('New username (2-32 characters)')
                        .setRequired(true)
                        .setMinLength(2)
                        .setMaxLength(32)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('banner')
                .setDescription('Update bot banner')
                .addStringOption(option =>
                    option
                        .setName('image_url')
                        .setDescription('Image URL or data URI (PNG, JPG, GIF, WebP, min 600x240, max 8MB)')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View current bot configuration')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const botConfigService = interaction.client.botConfigService;

        if (!botConfigService) {
            return interaction.reply({
                content: 'Bot configuration service is not available.',
                ephemeral: true
            });
        }

        // Handle view subcommand
        if (subcommand === 'view') {
            try {
                const config = await botConfigService.getConfig();
                const rateLimits = await botConfigService.getRateLimits();

                const embed = new EmbedBuilder()
                    .setColor(0x0099ff)
                    .setTitle('Bot Configuration')
                    .setThumbnail(interaction.client.user.displayAvatarURL())
                    .addFields(
                        {
                            name: 'Username',
                            value: interaction.client.user.username,
                            inline: true
                        },
                        {
                            name: 'Status',
                            value: config.presence.status || 'online',
                            inline: true
                        },
                        {
                            name: 'Activity',
                            value: config.presence.activities.length > 0
                                ? `${config.presence.activities[0].name}`
                                : 'None',
                            inline: true
                        },
                        {
                            name: 'Rate Limits',
                            value: `Username: ${rateLimits.username.remaining}/2 remaining\n` +
                                   `Avatar: ${rateLimits.avatar.remaining}/2 remaining\n` +
                                   `Banner: ${rateLimits.banner.remaining}/2 remaining`,
                            inline: false
                        }
                    )
                    .setTimestamp();

                if (config.appearance.bannerUrl) {
                    embed.setImage(config.appearance.bannerUrl);
                }

                return interaction.reply({ embeds: [embed] });
            } catch (error) {
                console.error('Error viewing bot config:', error);
                return interaction.reply({
                    content: 'Failed to retrieve bot configuration.',
                    ephemeral: true
                });
            }
        }

        // Handle presence subcommand
        if (subcommand === 'presence') {
            const status = interaction.options.getString('status');
            const type = interaction.options.getString('type');
            const activity = interaction.options.getString('activity');

            const activityTypeMap = {
                'Playing': ActivityType.Playing,
                'Streaming': ActivityType.Streaming,
                'Listening': ActivityType.Listening,
                'Watching': ActivityType.Watching,
                'Competing': ActivityType.Competing
            };

            const presenceConfig = {
                status: status,
                activities: [{
                    type: activityTypeMap[type],
                    name: activity
                }],
                rotation: {
                    enabled: false,
                    interval: 10000,
                    currentIndex: 0
                }
            };

            const result = await botConfigService.updatePresence(
                presenceConfig,
                interaction.user.id,
                'command'
            );

            if (result.success) {
                const embed = new EmbedBuilder()
                    .setColor(0x00ff00)
                    .setTitle('✅ Presence Updated')
                    .setDescription(`**Status:** ${status}\n**Activity:** ${type} ${activity}`)
                    .setTimestamp();

                return interaction.reply({ embeds: [embed] });
            } else {
                return interaction.reply({
                    content: `❌ ${result.error}`,
                    ephemeral: true
                });
            }
        }

        // Handle avatar subcommand
        if (subcommand === 'avatar') {
            const imageUrl = interaction.options.getString('image_url');

            await interaction.deferReply();

            const result = await botConfigService.updateAvatar(
                imageUrl,
                interaction.user.id,
                'command'
            );

            if (result.success) {
                const rateLimits = await botConfigService.getRateLimits();
                const embed = new EmbedBuilder()
                    .setColor(0x00ff00)
                    .setTitle('✅ Avatar Updated')
                    .setDescription(`Avatar has been updated successfully!\n\n**Remaining changes:** ${rateLimits.avatar.remaining}/2`)
                    .setThumbnail(result.avatarUrl)
                    .setTimestamp();

                return interaction.editReply({ embeds: [embed] });
            } else {
                return interaction.editReply({
                    content: `❌ ${result.error}`
                });
            }
        }

        // Handle username subcommand
        if (subcommand === 'username') {
            const newName = interaction.options.getString('new_name');

            await interaction.deferReply();

            const result = await botConfigService.updateUsername(
                newName,
                interaction.user.id,
                'command'
            );

            if (result.success) {
                const rateLimits = await botConfigService.getRateLimits();
                const embed = new EmbedBuilder()
                    .setColor(0x00ff00)
                    .setTitle('✅ Username Updated')
                    .setDescription(`Username has been changed to **${newName}**\n\n**Remaining changes:** ${rateLimits.username.remaining}/2`)
                    .setTimestamp();

                return interaction.editReply({ embeds: [embed] });
            } else {
                return interaction.editReply({
                    content: `❌ ${result.error}`
                });
            }
        }

        // Handle banner subcommand
        if (subcommand === 'banner') {
            const imageUrl = interaction.options.getString('image_url');

            await interaction.deferReply();

            const result = await botConfigService.updateBanner(
                imageUrl,
                interaction.user.id,
                'command'
            );

            if (result.success) {
                const rateLimits = await botConfigService.getRateLimits();
                const embed = new EmbedBuilder()
                    .setColor(0x00ff00)
                    .setTitle('✅ Banner Updated')
                    .setDescription(`Banner has been updated successfully!\n\n**Remaining changes:** ${rateLimits.banner.remaining}/2`)
                    .setTimestamp();

                if (result.bannerUrl) {
                    embed.setImage(result.bannerUrl);
                }

                return interaction.editReply({ embeds: [embed] });
            } else {
                return interaction.editReply({
                    content: `❌ ${result.error}`
                });
            }
        }
    }
};
