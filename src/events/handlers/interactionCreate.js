const { Interaction, Permissions, EmbedBuilder, CommandInteraction, ButtonInteraction, InteractionType, MessageFlags, ContainerBuilder, TextDisplayBuilder, SectionBuilder } = require("discord.js");
const chalk = require("chalk");
const config = require('../../config');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const afkSchema = require('../../schemas/afkSchema');
const { logErrorToFile } = require('../../utils/errorLogger');



async function trackCommandStats(interaction, command, client) {
    try {
        // Check if command stats tracking is enabled
        const discobasePath = path.join(process.cwd(), 'discobase.json');
        if (!fs.existsSync(discobasePath)) return;

        const discobaseConfig = JSON.parse(fs.readFileSync(discobasePath, 'utf8'));
        if (!discobaseConfig.commandStats || discobaseConfig.commandStats.enabled === false) {
            return; // Stats tracking is disabled
        }

        // Check if MongoDB is connected
        if (!mongoose.connection || mongoose.connection.readyState !== 1) {
            // MongoDB is not connected, silently return
            return;
        }

        // Get or create CommandStats model
        let CommandStats;

        try {
            CommandStats = mongoose.model('CommandStats');
        } catch (e) {
            // Model doesn't exist, create it
            const commandStatsSchema = new mongoose.Schema({
                commandName: { type: String, required: true, index: true },
                commandType: { type: String, required: true, enum: ['slash', 'prefix'], index: true },
                totalUses: { type: Number, default: 0 },
                servers: [{
                    serverId: String,
                    serverName: String,
                    uses: { type: Number, default: 0 }
                }],
                users: [{
                    userId: String,
                    username: String,
                    uses: { type: Number, default: 0 }
                }],
                lastUsed: { type: Date, default: Date.now }
            });
            // Create compound index for efficient queries
            commandStatsSchema.index({ commandName: 1, commandType: 1 }, { unique: true });
            CommandStats = mongoose.model('CommandStats', commandStatsSchema);
        }

        const commandName = command.data.name;
        const commandType = 'slash';
        const userId = interaction.user.id;
        const username = interaction.user.tag;
        const serverId = interaction.guild?.id || 'DM';
        const serverName = interaction.guild?.name || 'Direct Message';

        // Find or create command stats document for SLASH commands
        let stats = await CommandStats.findOne({ commandName, commandType });

        if (!stats) {
            stats = new CommandStats({
                commandName,
                commandType,
                totalUses: 0,
                servers: [],
                users: []
            });
        }

        // Update total uses
        stats.totalUses += 1;
        stats.lastUsed = new Date();

        // Update server stats if tracking is enabled
        if (discobaseConfig.commandStats.trackServers !== false && serverId !== 'DM') {
            const serverIndex = stats.servers.findIndex(s => s.serverId === serverId);
            if (serverIndex >= 0) {
                stats.servers[serverIndex].uses += 1;
                stats.servers[serverIndex].serverName = serverName; // Update name in case it changed
            } else {
                stats.servers.push({ serverId, serverName, uses: 1 });
            }
            // Sort servers by uses (descending)
            stats.servers.sort((a, b) => b.uses - a.uses);
        }

        // Update user stats if tracking is enabled
        if (discobaseConfig.commandStats.trackUsers !== false) {
            const userIndex = stats.users.findIndex(u => u.userId === userId);
            if (userIndex >= 0) {
                stats.users[userIndex].uses += 1;
                stats.users[userIndex].username = username; // Update username in case it changed
            } else {
                stats.users.push({ userId, username, uses: 1 });
            }
            // Sort users by uses (descending)
            stats.users.sort((a, b) => b.uses - a.uses);
        }

        await stats.save();
    } catch (err) {
        // Silently fail - we don't want stats tracking to break commands
        console.error(chalk.yellow('Failed to track command stats:'), err.message);
    }
}



module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        // ================= COMPONENT HANDLER =================

// Handle leaderboard select menu
if (interaction.isStringSelectMenu() && interaction.customId === "chess_leaderboard_mode") {

    const { getLeaderboard } = require("../../functions/handlers/chessService");
    const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

    await interaction.deferUpdate(); // VERY IMPORTANT

    const mode = interaction.values[0];
    const leaderboard = await getLeaderboard(mode);

    if (!leaderboard || leaderboard.length === 0) {
        return interaction.editReply({
            content: "No leaderboard data found.",
            components: []
        });
    }

    let page = 0;
    const pageSize = 10;
    const totalPages = Math.ceil(leaderboard.length / pageSize);

    const generateEmbed = () => {
        const start = page * pageSize;
        const current = leaderboard.slice(start, start + pageSize);

        return new EmbedBuilder()
            .setColor("#2b2d31")
            .setTitle(`🏆 ${mode.replace("live_", "").toUpperCase()} Leaderboard`)
            .setDescription(
                current.map((player, index) => {
    const profileUrl = `https://www.chess.com/member/${player.username}`;
    return `**${start + index + 1}.** [${player.username}](${profileUrl}) — ${player.score}`;
})
.join("\n")
            )
            .setFooter({ text: `Page ${page + 1} of ${totalPages}` });
    };

    const buttons = () => new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("lb_prev")
            .setLabel("Previous")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === 0),

        new ButtonBuilder()
            .setCustomId("lb_next")
            .setLabel("Next")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page >= totalPages - 1)
    );

    const message = await interaction.editReply({
        embeds: [generateEmbed()],
        components: [buttons()]
    });

    const collector = message.createMessageComponentCollector({ time: 60000 });

    collector.on("collect", async (i) => {

        if (!i.isButton()) return;

        if (i.customId === "lb_next" && page < totalPages - 1) page++;
        if (i.customId === "lb_prev" && page > 0) page--;

        await i.update({
            embeds: [generateEmbed()],
            components: [buttons()]
        });
    });

    return;
}
// ================= AFK BUTTON HANDLER =================
if (interaction.isButton() && interaction.customId.startsWith('afk_')) {

    // Instantly acknowledge interaction (prevents Unknown Interaction error)
    await interaction.deferUpdate().catch(() => {});

    const parts = interaction.customId.split('_');
    const choice = parts[1];
    const ownerId = parts[2];

    // Prevent others from pressing
    if (interaction.user.id !== ownerId) {
        return interaction.followUp({
            content: "This button isn't for you.",
            ephemeral: true
        }).catch(() => {});
    }

    const dmNotify = choice === 'yes';

    try {
        const originalEmbed = interaction.message.embeds[0];
        let reason = "No reason provided";

        if (originalEmbed?.description) {
            const firstLine = originalEmbed.description.split('\n')[0];
            reason = firstLine.replace('**Reason:** ', '') || reason;
        }

        await afkSchema.findOneAndUpdate(
            { userId: interaction.user.id, guildId: interaction.guildId },
            {
                reason,
                timestamp: Date.now(),
                dmNotify
            },
            { upsert: true }
        );

        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor('Green')
                    .setDescription(
                        `AFK set successfully!\n\n**DM Notifications:** ${dmNotify ? 'Enabled' : 'Disabled'}`
                    )
            ],
            components: []
        });

    } catch (err) {
        console.error("AFK Button Error:", err);
    }

    return; // IMPORTANT — prevents falling into slash command logic
}

// ================= AUTOPOST BUTTON & MODAL HANDLERS =================
if (interaction.isButton() && interaction.customId.startsWith('autopost_')) {
    const { updateInterval, stopAutoPoster, getAutoPosterState } = require('../../functions/handlers/autoPoster');
    const subreddits = require('../../functions/handlers/subreddits');
    const { 
        ModalBuilder, 
        TextInputBuilder, 
        TextInputStyle, 
        ActionRowBuilder,
        ChannelSelectMenuBuilder,
        RoleSelectMenuBuilder,
        ChannelType,
        EmbedBuilder
    } = require('discord.js');

    const action = interaction.customId.split('_')[1];

    if (action === 'setup') {
        // Show channel and role selectors first
        const channelRow = new ActionRowBuilder()
            .addComponents(
                new ChannelSelectMenuBuilder()
                    .setCustomId('autopost_channel_select')
                    .setPlaceholder('Select a channel for memes')
                    .addChannelTypes(ChannelType.GuildText)
            );

        const roleRow = new ActionRowBuilder()
            .addComponents(
                new RoleSelectMenuBuilder()
                    .setCustomId('autopost_role_select')
                    .setPlaceholder('Select a role to ping (optional)')
            );

        await interaction.update({
            content: '**Step 1/2:** Select the channel and role (optional)',
            embeds: [],
            components: [channelRow, roleRow]
        });
        return;
    }

    if (action === 'stats') {
        const state = getAutoPosterState();
        const channel = interaction.client.channels.cache.get(state.channelId);
        const nextPostTime = Math.floor((Date.now() + state.intervalSeconds * 1000) / 1000);

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('📊 Auto-Post Statistics')
            .addFields(
                { name: '📺 Channel', value: channel ? `${channel}` : 'Unknown', inline: true },
                { name: '⏱️ Interval', value: `${state.intervalSeconds}s`, inline: true },
                { name: '📢 Ping Role', value: state.pingRoleId ? `<@&${state.pingRoleId}>` : 'None', inline: true },
                { name: '⏰ Next Post', value: `<t:${nextPostTime}:R>`, inline: true },
                { name: '📈 Total Posts', value: `${state.totalPosts || 0}`, inline: true },
                { name: '📚 Subreddits', value: `${subreddits.length}`, inline: true }
            )
            .setDescription(`**Top Subreddits:**\n${subreddits.slice(0, 10).map(s => `• r/${s}`).join('\n')}`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
    }

    if (action === 'stop') {
        stopAutoPoster();
        await interaction.update({
            content: '✅ Auto-posting has been stopped.',
            embeds: [],
            components: []
        });
        return;
    }
}

// Handle channel/role select menus for autopost
if (interaction.isChannelSelectMenu() && interaction.customId === 'autopost_channel_select') {
    const selectedChannel = interaction.channels.first();
    
    // Store in temporary cache (you could use a Map or database)
    if (!interaction.client.autopostSetup) interaction.client.autopostSetup = new Map();
    
    const setupData = interaction.client.autopostSetup.get(interaction.user.id) || {};
    setupData.channelId = selectedChannel.id;
    interaction.client.autopostSetup.set(interaction.user.id, setupData);

    await interaction.update({
        content: `✅ Channel selected: ${selectedChannel}\n\nNow select a role to ping (or click "Skip" to continue)`,
        components: interaction.message.components
    });
    return;
}

if (interaction.isRoleSelectMenu() && interaction.customId === 'autopost_role_select') {
    const selectedRole = interaction.roles.first();
    
    if (!interaction.client.autopostSetup) interaction.client.autopostSetup = new Map();
    
    const setupData = interaction.client.autopostSetup.get(interaction.user.id) || {};
    setupData.roleId = selectedRole?.id;
    interaction.client.autopostSetup.set(interaction.user.id, setupData);

    // Now show modal for interval
    const modal = new ModalBuilder()
        .setCustomId('autopost_interval_modal')
        .setTitle('Set Posting Interval');

    const intervalInput = new TextInputBuilder()
        .setCustomId('interval')
        .setLabel('Interval in seconds (minimum 10)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('60')
        .setRequired(true)
        .setMinLength(2)
        .setMaxLength(6);

    const row = new ActionRowBuilder().addComponents(intervalInput);
    modal.addComponents(row);

    await interaction.showModal(modal);
    return;
}

// Handle modal submission for autopost interval
if (interaction.isModalSubmit() && interaction.customId === 'autopost_interval_modal') {
    const { updateInterval } = require('../../functions/handlers/autoPoster');
    
    const intervalSec = parseInt(interaction.fields.getTextInputValue('interval'));
    
    if (isNaN(intervalSec) || intervalSec < 10) {
        return interaction.reply({ 
            content: '❌ Invalid interval. Must be a number >= 10 seconds.', 
            ephemeral: true 
        });
    }

    const setupData = interaction.client.autopostSetup?.get(interaction.user.id);
    
    if (!setupData || !setupData.channelId) {
        return interaction.reply({ 
            content: '❌ Setup data not found. Please start over with /autopost', 
            ephemeral: true 
        });
    }

    const success = updateInterval(
        interaction.client, 
        intervalSec * 1000, 
        setupData.channelId, 
        setupData.roleId
    );

    if (success) {
        const channel = interaction.client.channels.cache.get(setupData.channelId);
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('✅ Auto-Post Started')
            .setDescription(`Memes will be posted every **${intervalSec} seconds** in ${channel}`)
            .addFields(
                { name: '📢 Ping Role', value: setupData.roleId ? `<@&${setupData.roleId}>` : 'None', inline: true },
                { name: '⏰ Next Post', value: `<t:${Math.floor((Date.now() + intervalSec * 1000) / 1000)}:R>`, inline: true }
            )
            .setTimestamp();

        interaction.client.autopostSetup.delete(interaction.user.id);
        await interaction.reply({ embeds: [embed], ephemeral: true });
    } else {
        await interaction.reply({ content: '❌ Failed to start auto-post.', ephemeral: true });
    }
    return;
}




        if (interaction.isChatInputCommand()) {
            // Safety check: ensure commands are loaded
            if (!client.commands) {
                console.log(chalk.yellow('Commands not yet loaded. Please wait...'));
                return await interaction.reply({
                    content: '⏳ Bot is still starting up. Please try again in a moment!',
                    flags: MessageFlags.Ephemeral
                }).catch(() => { });
            }

            const command = client.commands.get(interaction.commandName);

            if (!command) {
                console.log(chalk.yellow(`Command "${interaction.commandName}" not found.`));
                return;
            }

            // Check if command is disabled in discobase.json
            const discobasePath = path.join(process.cwd(), 'discobase.json');
            if (fs.existsSync(discobasePath)) {
                const discobaseConfig = JSON.parse(fs.readFileSync(discobasePath, 'utf-8'));
                if (discobaseConfig.disabledCommands && discobaseConfig.disabledCommands.includes(interaction.commandName)) {
                    const embed = new EmbedBuilder()
                        .setColor('Orange')
                        .setDescription(`\`⛔\` | This command is currently disabled. Please try again later.`);

                    return await interaction.reply({
                        embeds: [embed]
                    });
                }
            }

            // if (!interaction.deferred && !interaction.replied) {
            //     await interaction.deferReply({ flags: MessageFlags.Ephemeral }).catch(() => {});
            // }

            if (command.adminOnly) {
                if (!config.bot.admins.includes(interaction.user.id)) {

                    const embed = new EmbedBuilder()
                        .setColor('Blue')
                        .setDescription(`\`❌\` | This command is admin-only. You cannot run this command.`)

                    return await interaction.reply({
                        embeds: [embed]
                    });
                }
            }

            if (command.ownerOnly) {
                if (interaction.user.id !== config.bot.ownerId) {
                    const embed = new EmbedBuilder()
                        .setColor('Blue')
                        .setDescription(`\`❌\` | This command is owner-only. You cannot run this command.`)

                    return await interaction.reply({
                        embeds: [embed]
                    });
                }
            }

            if (command.userPermissions) {
                const userPermissions = interaction.member.permissions;
                const missingPermissions = command.userPermissions.filter(perm => !userPermissions.has(perm));

                if (missingPermissions.length) {
                    const embed = new EmbedBuilder()
                        .setColor('Blue')
                        .setDescription(`\`❌\` | You lack the necessary permissions to execute this command: \`\`\`${missingPermissions.join(", ")}\`\`\``)

                    return await interaction.reply({
                        embeds: [embed]
                    });
                }
            }

            if (command.requiredRoles && command.requiredRoles.length > 0) {
                const memberRoles = interaction.member.roles.cache;
                const hasRequiredRole = command.requiredRoles.some(roleId => memberRoles.has(roleId));

                if (!hasRequiredRole) {
                    const embed = new EmbedBuilder()
                        .setColor('Blue')
                        .setDescription(`\`❌\` | You don't have the required role(s) to use this command.`);

                    return await interaction.reply({
                        embeds: [embed]
                    });
                }
            }

            if (command.botPermissions) {
                const botPermissions = interaction.guild.members.me.permissions;
                const missingBotPermissions = command.botPermissions.filter(perm => !botPermissions.has(perm));
                if (missingBotPermissions.length) {
                    const embed = new EmbedBuilder()
                        .setColor('Blue')
                        .setDescription(`\`❌\` | I lack the necessary permissions to execute this command: \`\`\`${missingBotPermissions.join(", ")}\`\`\``)

                    return await interaction.reply({
                        embeds: [embed]
                    });
                }
            }

            if (command.disabled === true) {
                const embed = new EmbedBuilder()
                    .setColor('Orange')
                    .setDescription(`\`⛔\` | This command is currently disabled. Please try again later.`);

                return await interaction.reply({
                    embeds: [embed]
                });
            }

            // Initialize cooldown map if it doesn't exist
            if (!client.cooldowns) {
                client.cooldowns = new Map();
            }

            const cooldowns = client.cooldowns;
            const now = Date.now();
            const cooldownAmount = (command.cooldown || 3) * 1000;
            const timestamps = cooldowns.get(command.name) || new Map();

            if (timestamps.has(interaction.user.id)) {
                const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

                if (now < expirationTime) {
                    const timeLeft = ((expirationTime - now) / 1000).toFixed(1);

                    const embed = new EmbedBuilder()
                        .setColor('Blue')
                        .setDescription(`\`❌\` | Please wait **${timeLeft}** more second(s) before reusing the command.`);

                    // Use reply if not replied yet
                    if (!interaction.replied && !interaction.deferred) {
                        return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                    } else {
                        return await interaction.reply({ embeds: [embed] });
                    }
                }
            }


            timestamps.set(interaction.user.id, now);
            cooldowns.set(command.name, timestamps);


            try {
                await command.execute(interaction, client);


                // Track command statistics if enabled
                await trackCommandStats(interaction, command, client);

                const logContainer = new ContainerBuilder()
                    .setAccentColor(0xFFFFFF)

                const text = new TextDisplayBuilder().setContent(
                    `## Command Executed
**User** : ${interaction.user.tag} (${interaction.user.id})
**Command** : \`/${command.data.name}\`
**Server** : ${interaction.guild
                        ? `${interaction.guild.name} (${interaction.guild.id})`
                        : 'Direct Message'
                    }
**Timestamp** : <t:${Math.floor(Date.now() / 1000)}:F>`
                );


                const section = new SectionBuilder()
                    .addTextDisplayComponents(text)
                    .setThumbnailAccessory(thumbnail =>
                        thumbnail.setURL(
                            interaction.guild?.iconURL({ size: 256 }) ??
                            'https://cdn.discordapp.com/embed/avatars/0.png'
                        )
                    );

                logContainer.addSectionComponents(section)

                if (config.logging.commandLogsChannelId) {
                    if (config.logging.commandLogsChannelId === 'COMMAND_LOGS_CHANNEL_ID') return;
                    const logsChannel = client.channels.cache.get(config.logging.commandLogsChannelId);
                    if (logsChannel) {
                        await logsChannel.send({ components: [logContainer], flags: MessageFlags.IsComponentsV2 });
                    } else {
                        console.error(chalk.yellow(`Logs channel with ID ${config.logging.commandLogsChannelId} not found.`));
                    }
                }
            } catch (error) {
                console.error(chalk.red(`Error executing command "${command.data.name}": `), error);
                logErrorToFile(error);
                if (!interaction.replied && !interaction.deferred) {
                    interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral }).catch(err => console.error('Failed to send error response:', err));
                }
            }

        }

    }
}
