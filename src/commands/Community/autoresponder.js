const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const AutoResponder = require('../../schemas/autoResponderSchema');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autoresponder')
        .setDescription('» Manage auto-responder triggers and responses')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a new auto-responder trigger')
                .addStringOption(option =>
                    option
                        .setName('type')
                        .setDescription('Trigger type')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Keyword (contains)', value: 'keyword' },
                            { name: 'Exact Match', value: 'exact' },
                            { name: 'Mention (bot/role/everyone)', value: 'mention' },
                            { name: 'Starts With', value: 'startsWith' },
                            { name: 'Ends With', value: 'endsWith' },
                            { name: 'Regex Pattern', value: 'regex' }
                        )
                )
                .addStringOption(option =>
                    option
                        .setName('pattern')
                        .setDescription('Trigger pattern (keyword, phrase, or regex)')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('response')
                        .setDescription('Response message (use {user}, {username}, {server}, {channel}, {membercount})')
                        .setRequired(true)
                )
                .addBooleanOption(option =>
                    option
                        .setName('case_sensitive')
                        .setDescription('Case sensitive matching')
                        .setRequired(false)
                )
                .addBooleanOption(option =>
                    option
                        .setName('auto_delete')
                        .setDescription('Auto-delete bot response')
                        .setRequired(false)
                )
                .addIntegerOption(option =>
                    option
                        .setName('delete_after')
                        .setDescription('Delete response after X seconds (1-300)')
                        .setMinValue(1)
                        .setMaxValue(300)
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove an auto-responder trigger')
                .addStringOption(option =>
                    option
                        .setName('id')
                        .setDescription('Trigger ID to remove')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all auto-responder triggers')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('toggle')
                .setDescription('Enable/disable a trigger')
                .addStringOption(option =>
                    option
                        .setName('id')
                        .setDescription('Trigger ID')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit')
                .setDescription('Edit a trigger response')
                .addStringOption(option =>
                    option
                        .setName('id')
                        .setDescription('Trigger ID')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('response')
                        .setDescription('New response message')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('View trigger statistics')
                .addStringOption(option =>
                    option
                        .setName('id')
                        .setDescription('Trigger ID (leave empty for all)')
                        .setRequired(false)
                )
        ),

    userPermissions: [PermissionFlagsBits.Administrator],

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const subcommand = interaction.options.getSubcommand();

            // Get or create config
            let config = await AutoResponder.findOne({ guildId: interaction.guild.id });
            if (!config) {
                config = new AutoResponder({ guildId: interaction.guild.id, triggers: [] });
            }

            switch (subcommand) {
                case 'add':
                    await handleAdd(interaction, config);
                    break;
                case 'remove':
                    await handleRemove(interaction, config);
                    break;
                case 'list':
                    await handleList(interaction, config);
                    break;
                case 'toggle':
                    await handleToggle(interaction, config);
                    break;
                case 'edit':
                    await handleEdit(interaction, config);
                    break;
                case 'stats':
                    await handleStats(interaction, config);
                    break;
            }

        } catch (error) {
            console.error('Auto-responder command error:', error);
            await interaction.editReply('× Failed to execute command. Please try again.');
        }
    }
};

async function handleAdd(interaction, config) {
    const type = interaction.options.getString('type');
    const pattern = interaction.options.getString('pattern');
    const response = interaction.options.getString('response');
    const caseSensitive = interaction.options.getBoolean('case_sensitive') || false;
    const autoDelete = interaction.options.getBoolean('auto_delete') || false;
    const deleteAfter = interaction.options.getInteger('delete_after') || 5;

    // Generate unique ID
    const id = `AR-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    const trigger = {
        id,
        type,
        pattern,
        response,
        caseSensitive,
        enabled: true,
        embed: { enabled: false },
        deleteOriginal: false,
        deleteResponse: autoDelete,
        deleteResponseAfter: autoDelete ? deleteAfter : 0,
        cooldown: 0,
        channelWhitelist: [],
        channelBlacklist: [],
        roleWhitelist: [],
        roleBlacklist: [],
        triggerCount: 0
    };

    config.triggers.push(trigger);
    await config.save();

    const embed = new EmbedBuilder()
        .setColor(0x8A5CF6)
        .setTitle('› Auto-Responder Added')
        .addFields(
            { name: '» ID', value: id, inline: true },
            { name: '» Type', value: type, inline: true },
            { name: '» Case Sensitive', value: caseSensitive ? 'Yes' : 'No', inline: true },
            { name: '» Pattern', value: `\`${pattern}\`` },
            { name: '» Response', value: response }
        );

    if (autoDelete) {
        embed.addFields({ name: '» Auto-Delete', value: `After ${deleteAfter} seconds`, inline: true });
    }

    embed.setFooter({ text: 'Use /autoresponder list to see all triggers' })
        .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
}

async function handleRemove(interaction, config) {
    const id = interaction.options.getString('id');

    const index = config.triggers.findIndex(t => t.id === id);
    if (index === -1) {
        return interaction.editReply('× Trigger not found.');
    }

    const removed = config.triggers.splice(index, 1)[0];
    await config.save();

    const embed = new EmbedBuilder()
        .setColor(0xFF6600)
        .setTitle('› Auto-Responder Removed')
        .addFields(
            { name: '» ID', value: removed.id },
            { name: '» Pattern', value: `\`${removed.pattern}\`` },
            { name: '» Total Triggers', value: `${removed.triggerCount}` }
        )
        .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
}

async function handleList(interaction, config) {
    if (!config.triggers || config.triggers.length === 0) {
        return interaction.editReply('» No auto-responders configured for this server.');
    }

    const triggers = config.triggers.slice(0, 10).map((t, i) => {
        const status = t.enabled ? '●' : '○';
        const typeSymbol = {
            keyword: '∗',
            exact: '≡',
            mention: '◆',
            regex: '◊',
            startsWith: '▸',
            endsWith: '◂'
        }[t.type] || '·';

        return `${i + 1}. ${status} ${typeSymbol} **${t.type}** | \`${t.id}\`\n` +
               `   Pattern: \`${t.pattern.substring(0, 50)}${t.pattern.length > 50 ? '...' : ''}\`\n` +
               `   Triggers: ${t.triggerCount || 0}`;
    }).join('\n\n');

    const embed = new EmbedBuilder()
        .setColor(0x8A5CF6)
        .setTitle('› Auto-Responder List')
        .setDescription(triggers)
        .setFooter({ text: `Total: ${config.triggers.length} triggers${config.triggers.length > 10 ? ' (showing first 10)' : ''}` })
        .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
}

async function handleToggle(interaction, config) {
    const id = interaction.options.getString('id');

    const trigger = config.triggers.find(t => t.id === id);
    if (!trigger) {
        return interaction.editReply('× Trigger not found.');
    }

    trigger.enabled = !trigger.enabled;
    await config.save();

    const embed = new EmbedBuilder()
        .setColor(trigger.enabled ? 0x00FF00 : 0xFF0000)
        .setTitle(`› ${trigger.enabled ? 'Enabled' : 'Disabled'} Auto-Responder`)
        .addFields(
            { name: '» ID', value: trigger.id },
            { name: '» Pattern', value: `\`${trigger.pattern}\`` },
            { name: '» Status', value: trigger.enabled ? 'Active' : 'Inactive' }
        )
        .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
}

async function handleEdit(interaction, config) {
    const id = interaction.options.getString('id');
    const newResponse = interaction.options.getString('response');

    const trigger = config.triggers.find(t => t.id === id);
    if (!trigger) {
        return interaction.editReply('× Trigger not found.');
    }

    const oldResponse = trigger.response;
    trigger.response = newResponse;
    await config.save();

    const embed = new EmbedBuilder()
        .setColor(0x8A5CF6)
        .setTitle('› Response Updated')
        .addFields(
            { name: '» ID', value: trigger.id },
            { name: '» Pattern', value: `\`${trigger.pattern}\`` },
            { name: '» Old Response', value: oldResponse.substring(0, 100) },
            { name: '» New Response', value: newResponse.substring(0, 100) }
        )
        .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
}

async function handleStats(interaction, config) {
    const id = interaction.options.getString('id');

    if (id) {
        // Show stats for specific trigger
        const trigger = config.triggers.find(t => t.id === id);
        if (!trigger) {
            return interaction.editReply('× Trigger not found.');
        }

        const embed = new EmbedBuilder()
            .setColor(0x8A5CF6)
            .setTitle('› Trigger Statistics')
            .addFields(
                { name: '» ID', value: trigger.id, inline: true },
                { name: '» Type', value: trigger.type, inline: true },
                { name: '» Status', value: trigger.enabled ? '● Active' : '○ Inactive', inline: true },
                { name: '» Pattern', value: `\`${trigger.pattern}\`` },
                { name: '» Response', value: trigger.response.substring(0, 100) },
                { name: '» Total Triggers', value: `${trigger.triggerCount || 0}`, inline: true },
                { name: '» Created', value: `<t:${Math.floor(new Date(trigger.createdAt).getTime() / 1000)}:R>`, inline: true },
                { name: '» Last Triggered', value: trigger.lastTriggered ? `<t:${Math.floor(new Date(trigger.lastTriggered).getTime() / 1000)}:R>` : 'Never', inline: true }
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    } else {
        // Show overall stats
        const totalTriggers = config.triggers.length;
        const activeTriggers = config.triggers.filter(t => t.enabled).length;
        const totalActivations = config.triggers.reduce((sum, t) => sum + (t.triggerCount || 0), 0);
        const mostUsed = config.triggers.sort((a, b) => (b.triggerCount || 0) - (a.triggerCount || 0))[0];

        const embed = new EmbedBuilder()
            .setColor(0x8A5CF6)
            .setTitle('› Auto-Responder Statistics')
            .addFields(
                { name: '» Total Triggers', value: `${totalTriggers}`, inline: true },
                { name: '» Active', value: `${activeTriggers}`, inline: true },
                { name: '» Inactive', value: `${totalTriggers - activeTriggers}`, inline: true },
                { name: '» Total Activations', value: `${totalActivations}`, inline: true },
                { name: '» Most Used', value: mostUsed ? `\`${mostUsed.pattern}\` (${mostUsed.triggerCount})` : 'None', inline: false }
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
}