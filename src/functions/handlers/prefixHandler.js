const { Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const chalk = require('chalk');
const { logErrorToFile } = require('../../utils/errorLogger');

// ✅ NEW unified logger
function log(message, type = 'INFO') {
    const timestamp = new Date().toLocaleTimeString();
    let icon, color;

    switch (type.toUpperCase()) {
        case 'SUCCESS':
            icon = '✓';
            color = chalk.green;
            break;
        case 'INFO':
            icon = 'ℹ';
            color = chalk.blue;
            break;
        case 'WARNING':
            icon = '⚠';
            color = chalk.yellow;
            break;
        case 'ERROR':
            icon = '✖';
            color = chalk.red;
            break;
        default:
            icon = '•';
            color = chalk.white;
    }

    const timeBox = chalk.gray(`[${timestamp}]`);
    const typeBox = color.bold(` ${icon} ${type.toUpperCase()} `);
    const formatted = `${timeBox}${typeBox}${chalk.white(' │ ')}${message}`;

    console.log(formatted);
}

function prefixHandler(client, prefixPath) {
    // Don't re-initialize if it already exists
    if (!client.prefix) {
        client.prefix = new Collection();
    }

    const loadCommand = (filePath) => {
        try {
            delete require.cache[require.resolve(filePath)];
            const command = require(filePath);

            if (command.name) {
                const disabledCommands = getDisabledCommands();
                if (disabledCommands.includes(command.name)) {
                    log(`Skipping disabled Prefix command: ${chalk.yellow(command.name)}`, 'INFO');
                    return;
                }
                client.prefix.set(command.name, command);
                log(`Loaded Prefix command: ${chalk.green(command.name)}`, 'SUCCESS');
            } else {
                log(`Command in ${chalk.yellow(path.basename(filePath))} is missing a name.`, 'WARNING');
            }
        } catch (error) {
            log(`Failed to load prefix command in ${chalk.red(path.basename(filePath))}`, 'ERROR');
            console.error(error);
            logErrorToFile(error);
        }
    };

    const unloadCommand = (filePath) => {
        const commandName = path.basename(filePath, '.js');
        if (client.prefix.has(commandName)) {
            client.prefix.delete(commandName);
            log(`Unloaded command: ${chalk.red(commandName)}`, 'SUCCESS');
        } else {
            log(`Command "${chalk.yellow(commandName)}" not found in client collection.`, 'WARNING');
        }
    };

    const loadAllCommands = (commandDir) => {
        const commandFiles = fs.readdirSync(commandDir);
        commandFiles.forEach((file) => {
            const filePath = path.join(commandDir, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                loadAllCommands(filePath);
            } else if (file.endsWith('.js')) {
                loadCommand(filePath);
            }
        });
    };

    loadAllCommands(prefixPath);

    const watcher = chokidar.watch(prefixPath, {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: true,
    });

    const debouncedLoadCommand = debounce(loadCommand, 500);
    const debouncedUnloadCommand = debounce(unloadCommand, 500);

    watcher
        .on('add', (filePath) => {
            if (filePath.endsWith('.js')) {
                log(`New command file added: ${chalk.green(path.basename(filePath))}`, 'SUCCESS');
                debouncedLoadCommand(filePath);
            }
        })
        .on('change', (filePath) => {
            if (filePath.endsWith('.js')) {
                log(`Command file changed: ${chalk.blue(path.basename(filePath))}`, 'INFO');
                debouncedUnloadCommand(filePath);
                debouncedLoadCommand(filePath);
            }
        })
        .on('unlink', (filePath) => {
            if (filePath.endsWith('.js')) {
                log(`Command file removed: ${chalk.red(path.basename(filePath))}`, 'ERROR');
                debouncedUnloadCommand(filePath);
            }
        });
}

module.exports = { prefixHandler };
