const chalk = require("chalk");
const config = require('../../config');
const { EmbedBuilder, MessageFlags, ContainerBuilder, TextDisplayBuilder, SectionBuilder } = require('discord.js');
const { getSimilarCommands } = require('../../functions/handlers/similarity');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const { logErrorToFile } = require('../../utils/errorLogger');

async function trackPrefixCommandStats(message, command, client) {
    try {
        const discobasePath = path.join(__dirname, '../../../discobase.json');
        if (!fs.existsSync(discobasePath)) return;

        const discobaseConfig = JSON.parse(fs.readFileSync(discobasePath, 'utf8'));
        if (!discobaseConfig.commandStats || discobaseConfig.commandStats.enabled === false) {
            return;
        }

        // Check if MongoDB is connected
        if (!mongoose.connection || mongoose.connection.readyState !== 1) {
            // MongoDB is not connected, silently return
            return;
        }

        let CommandStats;

        try {
            CommandStats = mongoose.model('CommandStats');
        } catch (e) {
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
            commandStatsSchema.index({ commandName: 1, commandType: 1 }, { unique: true });
            CommandStats = mongoose.model('CommandStats', commandStatsSchema);
        }

        const commandName = command.name;
        const commandType = 'prefix';
        const userId = message.author.id;
        const username = message.author.tag;
        const serverId = message.guild?.id || 'DM';
        const serverName = message.guild?.name || 'Direct Message';

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

        stats.totalUses += 1;
        stats.lastUsed = new Date();

        if (discobaseConfig.commandStats.trackServers !== false && serverId !== 'DM') {
            const serverIndex = stats.servers.findIndex(s => s.serverId === serverId);
            if (serverIndex >= 0) {
                stats.servers[serverIndex].uses += 1;
                stats.servers[serverIndex].serverName = serverName;
            } else {
                stats.servers.push({ serverId, serverName, uses: 1 });
            }
            stats.servers.sort((a, b) => b.uses - a.uses);
        }

        if (discobaseConfig.commandStats.trackUsers !== false) {
            const userIndex = stats.users.findIndex(u => u.userId === userId);
            if (userIndex >= 0) {
                stats.users[userIndex].uses += 1;
                stats.users[userIndex].username = username;
            } else {
                stats.users.push({ userId, username, uses: 1 });
            }
            stats.users.sort((a, b) => b.uses - a.uses);
        }

        await stats.save();
    } catch (err) {
        const chalk = require('chalk');
        console.error(chalk.yellow('Failed to track prefix command stats:'), err.message);
    }
}

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (message.author.bot) return;
        
        const content = message.content;
        
        // Fetch both prefixes from database
        let regularPrefix = config.prefix.value; // Default fallback
        let roleplayPrefix = 'r!'; // Default fallback
        
        try {
            const PrefixSchema = require('../../schemas/prefixSchema');
            const guildId = message.guild?.id || 'global';
            const prefixDoc = await PrefixSchema.findOne({ guildId });
            if (prefixDoc) {
                regularPrefix = prefixDoc.prefix;
                roleplayPrefix = prefixDoc.roleplayPrefix || 'r!';
            }
        } catch (error) {
            // If database fails, use config.json as fallback
            console.error('Failed to fetch prefix from database:', error);
        }
        
        // Determine which prefix is being used
        let prefix = null;
        
        if (content.startsWith(roleplayPrefix)) {
            prefix = roleplayPrefix;
        } else if (content.startsWith(regularPrefix)) {
            prefix = regularPrefix;
        } else {
            // Message doesn't start with any prefix
            return;
        }
        
        // Early returns
        if (prefix === '') return;

        // ✅ FIX: Ensure prefix collection exists before trying to access it
        if (!client.prefix) {
            console.error(chalk.red(`Prefix commands collection not initialized. Please ensure prefixHandler is called before the bot starts.`));
            return await message.reply({
                content: 'Prefix commands are still loading. Please try again in a moment.'
            }).catch(console.error);
        }

        // ✅ FIX: Don't convert to lowercase for args, only for command name
        const args = content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        let command = client.prefix.get(commandName);
        if (!command) {
            command = Array.from(client.prefix.values()).find(
                (cmd) => cmd.aliases && cmd.aliases.includes(commandName)
            );
        }

        if (!command) {
            console.log(chalk.yellow.bold('WARNING: ') + `Unknown command: "${commandName}"`);

            const similarCommands = getSimilarCommands(commandName, Array.from(client.prefix.values()));
            if (similarCommands.length > 0) {
                const embed = new EmbedBuilder()
                    .setColor('Blue')
                    .setDescription(`\`🤔\` | Command not found. Did you mean: ${similarCommands.join(', ')}?`)

                return await message.reply({ embeds: [embed] });
            } else {
                return;
            }
        }

        // Check if command is disabled in discobase.json
        const discobasePath = path.join(process.cwd(), 'discobase.json');
        if (fs.existsSync(discobasePath)) {
            const discobaseConfig = JSON.parse(fs.readFileSync(discobasePath, 'utf-8'));
            if (discobaseConfig.disabledCommands && discobaseConfig.disabledCommands.includes(command.name)) {
                const embed = new EmbedBuilder()
                    .setColor('Orange')
                    .setDescription(`\`⛔\` | This command is currently disabled. Please try again later.`);

                return await message.reply({
                    embeds: [embed]
                });
            }
        }

        if (command.requiredRoles && command.requiredRoles.length > 0) {
            if (!message.guild) {
                // Prevent errors in DMs
                const embed = new EmbedBuilder()
                    .setColor('Blue')
                    .setDescription(`\`❌\` | This command can only be used in a server.`);

                return await message.reply({ embeds: [embed] });
            }

            const memberRoles = message.member.roles.cache;
            const hasRequiredRole = command.requiredRoles.some(roleId => memberRoles.has(roleId));

            if (!hasRequiredRole) {
                const embed = new EmbedBuilder()
                    .setColor('Blue')
                    .setDescription(`\`❌\` | You don't have the required role(s) to use this command.`);

                return await message.reply({ embeds: [embed] });
            }
        }

        if (command.disabled) {
            const embed = new EmbedBuilder()
                .setColor('Orange')
                .setDescription(`\`⛔\` | This command is currently disabled. Please try again later.`);

            return await message.reply({
                embeds: [embed]
            });
        }

        if (command.devOnly) {
            if (!config.bot.developerCommandsServerIds.includes(message.guild.id)) {
                return;
            }
        }

        if (!client.cooldowns) {
            client.cooldowns = new Map();
        }

        const now = Date.now();
        const cooldownAmount = (command.cooldown || 3) * 1000;

        if (!client.cooldowns.has(command.name)) {
            client.cooldowns.set(command.name, new Map());
        }

        const timestamps = client.cooldowns.get(command.name);

        if (timestamps.has(message.author.id)) {
            const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;

                const embed = new EmbedBuilder()
                    .setColor('Blue')
                    .setDescription(`\`❌\` | Please wait **${timeLeft.toFixed(1)}** more second(s) before reusing the \`${command.name}\` command.`)

                return message.reply({
                    embeds: [embed]
                });
            }
        }

        timestamps.set(message.author.id, now);

        if (command.adminOnly && !config.bot.admins.includes(message.author.id)) {
            const embed = new EmbedBuilder()
                .setColor('Blue')
                .setDescription(`\`❌\` | This command is admin-only. You cannot run this command.`)

            return message.reply({
                embeds: [embed]
            });
        }

        if (command.ownerOnly && message.author.id !== config.bot.ownerId) {
            const embed = new EmbedBuilder()
                .setColor('Blue')
                .setDescription(`\`❌\` | This command is owner-only. You cannot run this command.`)

            return await message.reply({
                embeds: [embed],
            });
        }

        if (command.userPermissions) {
            const memberPermissions = message.member.permissions;
            const missingPermissions = command.userPermissions.filter(perm => !memberPermissions.has(perm));
            if (missingPermissions.length) {
                const embed = new EmbedBuilder()
                    .setColor('Blue')
                    .setDescription(`\`❌\` | You lack the necessary permissions to execute this command: \`\`\`${missingPermissions.join(", ")}\`\`\``)

                return message.reply({
                    embeds: [embed],
                });
            }
        }

        if (command.botPermissions) {
            const botPermissions = message.guild.members.me.permissions;
            const missingBotPermissions = command.botPermissions.filter(perm => !botPermissions.has(perm));
            if (missingBotPermissions.length) {
                const embed = new EmbedBuilder()
                    .setColor('Blue')
                    .setDescription(`\`❌\` | I lack the necessary permissions to execute this command: \`\`\`${missingBotPermissions.join(", ")}\`\`\``)

                return message.reply({
                    embeds: [embed],
                });
            }
        }

        try {
            await command.execute(message, args, client);

            // Track prefix command statistics if enabled
            await trackPrefixCommandStats(message, command, client);

            const logContainer = new ContainerBuilder()
                .setAccentColor(0xFFFFFF)

            const text = new TextDisplayBuilder().setContent(
                `## Command Executed
**User** : ${message.author.tag} (${message.author.id})
**Command** : \`${message.content.split(' ')[0]}\`
**Server** : ${message.guild
                    ? `${message.guild.name} (${message.guild.id})`
                    : 'Direct Message'
                }
**Timestamp** : <t:${Math.floor(Date.now() / 1000)}:F>`
            );


            const section = new SectionBuilder()
                .addTextDisplayComponents(text)
                .setThumbnailAccessory(thumbnail =>
                    thumbnail.setURL(
                        message.guild?.iconURL({ size: 256 }) ??
                        message.author.displayAvatarURL({ size: 256 })
                    )
                );

            logContainer.addSectionComponents(section)

            if (config.logging.commandLogsChannelId) {
                const logsChannel = client.channels.cache.get(config.logging.commandLogsChannelId);
                if (logsChannel) {
                    await logsChannel.send({ components: [logContainer], flags: MessageFlags.IsComponentsV2 });
                } else {
                    if (config.logging.commandLogsChannelId === 'COMMAND_LOGS_CHANNEL_ID') return;

                    console.error(chalk.yellow(`Logs channel with ID ${config.logging.commandLogsChannelId} not found.`));
                }
            }
        } catch (error) {
            console.log(chalk.red.bold('ERROR: ') + `Failed to execute command "${commandName}".`);
            console.error(error);
            message.reply({
                content: 'There was an error while executing this command!',
            });
            logErrorToFile(error);
        }
    }
};
