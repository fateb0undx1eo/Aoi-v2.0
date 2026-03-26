const { REST, Routes, Collection } = require('discord.js');
const fs = require('fs');
const chalk = require('chalk');
const path = require('path');
const chokidar = require('chokidar');
const gradientPkg = require('gradient-string');
const gradient = gradientPkg.default || gradientPkg;
const config = require('../../config');
const { logErrorToFile } = require('../../utils/errorLogger');

const activities = [];

// -------------------- Activity Logging --------------------
const addActivity = (action, filePath) => {
    const timestamp = new Date().toLocaleTimeString();
    const message = `${action} ${formatFilePath(filePath)}`;
    activities.push({ type: action, message, timestamp });

    if (activities.length > 100) activities.shift();
};

const getActivities = () => activities;

const log = (message, type = 'INFO') => {
    const timestamp = new Date().toLocaleTimeString();
    let icon, color;

    switch (type) {
        case 'SUCCESS': icon = '✓'; color = chalk.green.bold(`${icon} ${type}`); break;
        case 'INFO': icon = 'ℹ'; color = chalk.blue.bold(`${icon} ${type}`); break;
        case 'WARNING': icon = '⚠'; color = chalk.yellow.bold(`${icon} ${type}`); break;
        case 'ERROR': icon = '✖'; color = chalk.red.bold(`${icon} ${type}`); break;
        default: icon = '•'; color = chalk.white.bold(`${icon} ${type}`);
    }

    const timeBox = chalk.gray(`[${timestamp}]`);
    const messageText = chalk.white(message);
    console.log(`${timeBox} ${color} ${chalk.white('│')} ${messageText}`);
    addActivity(type.toLowerCase(), message);
};

// -------------------- Helpers --------------------
const formatFilePath = (filePath) => path.relative(process.cwd(), filePath);

const isConfigIncomplete = (key, value, placeholderTokens) => !value || placeholderTokens.includes(value);

const getDisabledCommands = () => {
    const discobasePath = path.join(__dirname, '../../../discobase.json');
    if (fs.existsSync(discobasePath)) {
        const config = JSON.parse(fs.readFileSync(discobasePath, 'utf-8'));
        return config.disabledCommands || [];
    }
    return [];
};

const isCommandDisabled = (commandName) => {
    const disabledCommands = getDisabledCommands();
    return disabledCommands.includes(commandName);
};

const getAllCommandFiles = (dirPath, arrayOfFiles = []) => {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
        const filePath = path.join(dirPath, file);
        if (fs.statSync(filePath).isDirectory()) {
            arrayOfFiles = getAllCommandFiles(filePath, arrayOfFiles);
        } else if (file.endsWith('.js')) {
            arrayOfFiles.push(filePath);
        }
    }
    return arrayOfFiles;
};

const loadCommand = (client, filePath) => {
    try {
        if (filePath.includes('schemas')) {
            log(`Ignoring schema file: ${formatFilePath(filePath)}`, 'WARNING');
            return null;
        }

        delete require.cache[require.resolve(filePath)];
        const command = require(filePath);

        if (!command.data?.name || typeof command.data.name !== 'string') {
            log(`Command file "${formatFilePath(filePath)}" missing valid name.`, 'ERROR');
            return null;
        }

        if (isCommandDisabled(command.data.name)) {
            log(`Skipping disabled command: ${formatFilePath(filePath)}`, 'INFO');
            return null;
        }

        client.commands.set(command.data.name, command);
        return command;
    } catch (error) {
        log(`Failed to load command from "${formatFilePath(filePath)}".`, 'ERROR');
        console.error(`${chalk.gray(`[${new Date().toLocaleTimeString()}]`)} ${gradient(['#ff0000', '#8b0000'])("✖ ERROR")} ${chalk.white('│')} ${error.message}`);
        console.error(`${chalk.gray('Stack:')} ${error.stack}`);
        logErrorToFile(error);
        return null;
    }
};

const loadCommands = (client, commandsPath) => {
    const globalCommandArray = [];
    const devCommandArray = [];

    const commandFiles = getAllCommandFiles(commandsPath);
    for (const filePath of commandFiles) {
        const command = loadCommand(client, filePath);
        if (command) {
            if (command.devOnly) devCommandArray.push(command.data.toJSON());
            else globalCommandArray.push(command.data.toJSON());
        }
    }

    return { globalCommandArray, devCommandArray };
};

// -------------------- Command Registration --------------------
const unregisterCommand = async (commandName, rest, botId, devCommandArray) => {
    try {
        log(`Unregistering global command: ${commandName}`, 'INFO');
        const globalCommands = await rest.get(Routes.applicationCommands(botId));
        const cmdToDelete = globalCommands.find(cmd => cmd.name === commandName);
        if (cmdToDelete) await rest.delete(Routes.applicationCommand(botId, cmdToDelete.id));

        if (devCommandArray.length > 0 && process.env.DEVELOPER_GUILD_IDS) {
            const serverIds = process.env.DEVELOPER_GUILD_IDS.split(',');
            for (const serverId of serverIds) {
                const guildCommands = await rest.get(Routes.applicationGuildCommands(botId, serverId));
                const guildCmd = guildCommands.find(cmd => cmd.name === commandName);
                if (guildCmd) await rest.delete(Routes.applicationGuildCommand(botId, serverId, guildCmd.id));
            }
        }
    } catch (error) {
        log(`Failed to unregister command: ${commandName}`, 'ERROR');
        logErrorToFile(error);
    }
};

const registerCommands = async (globalCommandArray, devCommandArray, rest, botId) => {
    try {
        if (globalCommandArray.length > 0) {
            log('Refreshing global application (/) commands...', 'INFO');
            await rest.put(Routes.applicationCommands(botId), { body: globalCommandArray });
            log('Successfully reloaded global commands!', 'SUCCESS');
        }

        if (devCommandArray.length > 0 && process.env.DEVELOPER_GUILD_IDS) {
            const serverIds = process.env.DEVELOPER_GUILD_IDS.split(',');
            for (const serverId of serverIds) {
                log(`Refreshing dev guild commands for server ${serverId}`, 'INFO');
                await rest.put(Routes.applicationGuildCommands(botId, serverId), { body: devCommandArray });
                log(`Successfully reloaded dev guild commands for server ${serverId}`, 'SUCCESS');
            }
        } else if (devCommandArray.length > 0) {
            log('Developer guild IDs not provided in .env', 'WARNING');
        }
    } catch (error) {
        log('Failed to register commands', 'ERROR');
        logErrorToFile(error);
    }
};

// -------------------- Main Handler --------------------
const handleCommands = async (client, commandsPath) => {
    if (!process.env.BOT_ID || !process.env.BOT_TOKEN) {
        log('BOT_ID or BOT_TOKEN missing in environment variables!', 'ERROR');
        process.exit(1);
    }

    if (!client.commands) client.commands = new Collection();
    const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

    const { globalCommandArray, devCommandArray } = loadCommands(client, commandsPath);
    await registerCommands(globalCommandArray, devCommandArray, rest, process.env.BOT_ID);

    // Watch for command changes
    const watcher = chokidar.watch([commandsPath, './src/functions', './src/schemas'], {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: true,
    });

    let timeout;
    const registerDebounced = async () => {
        const { globalCommandArray, devCommandArray } = loadCommands(client, commandsPath);
        await registerCommands(globalCommandArray, devCommandArray, rest, process.env.BOT_ID);
    };

    watcher
        .on('add', (filePath) => {
            if (filePath.includes('schemas') || filePath.includes('functions')) return;
            log(`New command file added: ${formatFilePath(filePath)}`, 'SUCCESS');
            loadCommand(client, filePath);
            addActivity('added', filePath);
            clearTimeout(timeout);
            timeout = setTimeout(registerDebounced, 5000);
        })
        .on('change', (filePath) => {
            if (filePath.includes('schemas') || filePath.includes('functions')) return;
            log(`Command file changed: ${formatFilePath(filePath)}`, 'INFO');
            loadCommand(client, filePath);
            addActivity('changed', filePath);
            clearTimeout(timeout);
            timeout = setTimeout(registerDebounced, 5000);
        })
        .on('unlink', async (filePath) => {
            if (filePath.includes('schemas') || filePath.includes('functions')) return;
            const commandName = path.basename(filePath, '.js');
            log(`Command file removed: ${formatFilePath(filePath)}`, 'ERROR');
            client.commands.delete(commandName);
            await unregisterCommand(commandName, rest, process.env.BOT_ID, devCommandArray);
            addActivity('removed', filePath);
            clearTimeout(timeout);
            timeout = setTimeout(registerDebounced, 5000);
        });
};

module.exports = { handleCommands, getActivities };
