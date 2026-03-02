const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const mongoose = require('mongoose');

// AutoMod Configuration Schema
const automodSchema = new mongoose.Schema({
    guildId: String,
    enabled: { type: Boolean, default: true },
    filters: {
        spam: { type: Boolean, default: true },
        links: { type: Boolean, default: false },
        invites: { type: Boolean, default: true },
        caps: { type: Boolean, default: false },
        mentions: { type: Boolean, default: true },
        badwords: { type: Boolean, default: false }
    },
    thresholds: {
        spamMessages: { type: Number, default: 5 },
        spamTime: { type: Number, default: 5000 },
        capsPercentage: { type: Number, default: 70 },
        maxMentions: { type: Number, default: 5 }
    },
    actions: {
        delete: { type: Boolean, default: true },
        warn: { type: Boolean, default: true },
        timeout: { type: Boolean, default: false },
        timeoutDuration: { type: Number, default: 300000 }
    },
    whitelist: {
        roles: [String],
        channels: [String],
        users: [String]
    }
});

const AutoMod = mongoose.models.AutoMod || mongoose.model('AutoMod', automodSchema);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('automod')
        .setDescription('🤖 Configure advanced AI-powered auto-moderation system')
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('View current automod configuration')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('enable')
                .setDescription('Enable automod system')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('disable')
                .setDescription('Disable automod system')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('filter')
                .setDescription('Configure specific filters')
                .addStringOption(option =>
                    option
                        .setName('type')
                        .setDescription('Filter type')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Spam Detection', value: 'spam' },
                            { name: 'Link Blocking', value: 'links' },
                            { name: 'Invite Blocking', value: 'invites' },
                            { name: 'Caps Lock', value: 'caps' },
                            { name: 'Mass Mentions', value: 'mentions' },
                            { name: 'Bad Words', value: 'badwords' }
                        )
                )
                .addBooleanOption(option =>
                    option
                        .setName('enabled')
                        .setDescription('Enable or disable this filter')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('action')
                .setDescription('Configure automod actions')
                .addStringOption(option =>
                    option
                        .setName('type')
                        .setDescription('Action type')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Delete Message', value: 'delete' },
                            { name: 'Warn User', value: 'warn' },
                            { name: 'Timeout User', value: 'timeout' }
                        )
                )
                .addBooleanOption(option =>
                    option
                        .setName('enabled')
                        .setDescription('Enable or disable this action')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('whitelist')
                .setDescription('Add role/channel/user to automod whitelist')
                .addStringOption(option =>
                    option
                        .setName('type')
                        .setDescription('Whitelist type')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Role', value: 'role' },
                            { name: 'Channel', value: 'channel' },
                            { name: 'User', value: 'user' }
                        )
                )
                .addStringOption(option =>
                    option
                        .setName('id')
                        .setDescription('ID to whitelist')
                        .setRequired(true)
                )
        ),

    userPermissions: [PermissionFlagsBits.Administrator],

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const subcommand = interaction.options.getSubcommand();

            // Get or create automod config
            let config = await AutoMod.findOne({ guildId: interaction.guild.id });
            if (!config) {
                config = new AutoMod({ guildId: interaction.guild.id });
                await config.save();
            }

            switch (subcommand) {
                case 'status':
                    const statusEmbed = new EmbedBuilder()
                        .setColor(config.enabled ? 0x00FF00 : 0xFF0000)
                        .setTitle('🤖 AutoMod Configuration')
                        .setDescription(`Status: ${config.enabled ? '✅ Enabled' : '❌ Disabled'}`)
                        .addFields(
                            {
                                name: '🔍 Active Filters',
                                value: Object.entries(config.filters)
                                    .map(([key, val]) => `${val ? '✅' : '❌'} ${key.charAt(0).toUpperCase() + key.slice(1)}`)
                                    .join('\n') || 'None'
                            },
                            {
                                name: '⚡ Actions',
                                value: Object.entries(config.actions)
                                    .filter(([key]) => key !== 'timeoutDuration')
                                    .map(([key, val]) => `${val ? '✅' : '❌'} ${key.charAt(0).toUpperCase() + key.slice(1)}`)
                                    .join('\n') || 'None'
                            },
                            {
                                name: '📊 Thresholds',
                                value: `Spam: ${config.thresholds.spamMessages} msgs/${config.thresholds.spamTime}ms\n` +
                                       `Caps: ${config.thresholds.capsPercentage}%\n` +
                                       `Mentions: ${config.thresholds.maxMentions} max`
                            },
                            {
                                name: '🛡️ Whitelisted',
                                value: `Roles: ${config.whitelist.roles.length}\n` +
                                       `Channels: ${config.whitelist.channels.length}\n` +
                                       `Users: ${config.whitelist.users.length}`
                            }
                        )
                        .setTimestamp();

                    await interaction.editReply({ embeds: [statusEmbed] });
                    break;

                case 'enable':
                    config.enabled = true;
                    await config.save();
                    await interaction.editReply('✅ AutoMod system enabled!');
                    break;

                case 'disable':
                    config.enabled = false;
                    await config.save();
                    await interaction.editReply('❌ AutoMod system disabled!');
                    break;

                case 'filter':
                    const filterType = interaction.options.getString('type');
                    const filterEnabled = interaction.options.getBoolean('enabled');
                    config.filters[filterType] = filterEnabled;
                    await config.save();
                    await interaction.editReply(`✅ ${filterType} filter ${filterEnabled ? 'enabled' : 'disabled'}!`);
                    break;

                case 'action':
                    const actionType = interaction.options.getString('type');
                    const actionEnabled = interaction.options.getBoolean('enabled');
                    config.actions[actionType] = actionEnabled;
                    await config.save();
                    await interaction.editReply(`✅ ${actionType} action ${actionEnabled ? 'enabled' : 'disabled'}!`);
                    break;

                case 'whitelist':
                    const whitelistType = interaction.options.getString('type');
                    const whitelistId = interaction.options.getString('id');
                    const whitelistKey = whitelistType === 'role' ? 'roles' : whitelistType === 'channel' ? 'channels' : 'users';
                    
                    if (!config.whitelist[whitelistKey].includes(whitelistId)) {
                        config.whitelist[whitelistKey].push(whitelistId);
                        await config.save();
                        await interaction.editReply(`✅ Added ${whitelistType} to whitelist!`);
                    } else {
                        await interaction.editReply(`❌ ${whitelistType} already whitelisted!`);
                    }
                    break;
            }

        } catch (error) {
            console.error('AutoMod command error:', error);
            await interaction.editReply('❌ Failed to configure automod. Please try again.');
        }
    }
};
