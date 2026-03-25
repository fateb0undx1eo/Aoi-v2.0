const { Interaction, Permissions, EmbedBuilder, CommandInteraction, ButtonInteraction, InteractionType, MessageFlags, ContainerBuilder, TextDisplayBuilder, SectionBuilder } = require("discord.js");
const chalk = require("chalk");
const config = require('../../config');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const afkSchema = require('../../schemas/afkSchema');
const { logErrorToFile } = require('../../utils/errorLogger');
const { handleCommandError } = require('../../utils/errorHandler');
const logger = require('../../utils/winstonLogger');



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
                lastUsed: { type: Date, default: Date.now, index: true }
            });
            // Create compound index for efficient queries
            commandStatsSchema.index({ commandName: 1, commandType: 1 }, { unique: true });
            commandStatsSchema.index({ totalUses: -1 }); // For sorting by popularity
            commandStatsSchema.index({ lastUsed: -1 }); // For recent commands
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
        // ================= AUTOCOMPLETE HANDLER =================
        if (interaction.isAutocomplete()) {
            const command = client.commands.get(interaction.commandName);
            
            if (!command || !command.autocomplete) {
                return;
            }

            try {
                await command.autocomplete(interaction);
            } catch (error) {
                logger.error('Autocomplete error:', {
                    command: interaction.commandName,
                    error: error.message
                });
            }
            return;
        }

        // ================= COMPONENT HANDLERS =================
        
        // Chess interactions (leaderboard, pagination)
        const { handleChessInteractions } = require('./chessInteractions');
        const chessHandled = await handleChessInteractions(interaction);
        if (chessHandled) return;

        // AFK button interactions
        const { handleAfkInteractions } = require('./afkInteractions');
        const afkHandled = await handleAfkInteractions(interaction);
        if (afkHandled) return;

        // Autopost interactions
        const { handleAutopostInteractions } = require('./autopostInteractions');
        const autopostHandled = await handleAutopostInteractions(interaction);
        if (autopostHandled) return;



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
                        logger.warn(`Logs channel with ID ${config.logging.commandLogsChannelId} not found.`);
                    }
                }
            } catch (error) {
                logger.error(`Error executing command "${command.data.name}":`, {
                    error: error.message,
                    stack: error.stack,
                    user: interaction.user.tag,
                    guild: interaction.guild?.name
                });
                
                // Use centralized error handler
                await handleCommandError(interaction, error);
            }

        }

    }
}
