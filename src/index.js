require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const express = require('express');
const http = require('http');

// Create Express server for Render deployment
const app = express();
const PORT = process.env.PORT || 3000;

// Create HTTP server for Socket.IO
const server = http.createServer(app);

app.get('/', (req, res) => {
    res.send('Bot is running');
});

// Start server immediately
server.listen(PORT, () => {
    console.log(`Express server listening on port ${PORT}`);
});

// Create a new Discord client with clear, explicit intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.Channel],
    ws: { timeout: 60000 },
    rest: { timeout: 60000 }
});

// Initialize collections BEFORE any handlers
client.commands = new Collection();
client.prefix = new Collection();

// Export immediately so dashboard.js can import
module.exports = { client, server, app };

// Now continue with bot initialization
const chalk = require('chalk');
const config = require('./config');
const figlet = require('figlet');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const { eventsHandler } = require('./functions/handlers/handelEvents');
const { handleCommands } = require('./functions/handlers/handleCommands');
const { prefixHandler } = require('./functions/handlers/prefixHandler');
const { checkMissingIntents } = require('./functions/handlers/requiredIntents');
const { antiCrash } = require('./functions/handlers/antiCrash');
const { initActivityTracker } = require('./functions/handlers/activityTracker');
require('./functions/handlers/watchFolders');

const adminFolderPath = path.join(__dirname, '../admin');
const dashboardFilePath = path.join(adminFolderPath, 'dashboard.js');
const eventsPath = './events';

antiCrash();

const { logErrorToFile } = require('./utils/errorLogger');
const { log: logger } = require('./utils/logger');

async function loadGradient() {
    const mod = await import('gradient-string');
    return mod.default;
}

function printAsciiArt() {
    return new Promise((resolve, reject) => {
        figlet('Discobase', {
            font: 'ANSI Shadow',
            horizontalLayout: 'default',
            verticalLayout: 'default',
            width: 100,
            whitespaceBreak: true
        }, function (err, data) {
            if (err) {
                console.log('Something went wrong with ASCII art...');
                console.dir(err);
                reject(err);
            } else {
                const lines = data.split('\n');
                const width = Math.max(...lines.map(line => line.length));
                const horizontalBorder = '\u2550'.repeat(width + 4);
                const topBorder = '\u2554' + horizontalBorder + '\u2557';
                const bottomBorder = '\u255A' + horizontalBorder + '\u255D';
                
                console.log();
                console.log(chalk.cyan(topBorder));
                lines.forEach(line => {
                    const padding = ' '.repeat(width - line.length);
                    const gradientLine = gradient(['cyan', 'magenta'])(line);
                    console.log(chalk.cyan('\u2551 ') + gradientLine + padding + chalk.cyan(' \u2551'));
                });
                console.log(chalk.cyan(bottomBorder));
                
                const version = require('../package.json').version;
                const infoLine = `DiscoBase v${version} | The Ultimate Discord Bot toolkit!`;
                const infoWidth = infoLine.length + 4;
                const infoBoxTop = '\u250C' + '\u2500'.repeat(infoWidth) + '\u2510';
                const infoBoxBottom = '\u2514' + '\u2500'.repeat(infoWidth) + '\u2518';
                
                console.log();
                console.log(chalk.gray(infoBoxTop));
                console.log(chalk.gray('\u2502 ') + chalk.white.bold(infoLine) + chalk.gray(' \u2502'));
                console.log(chalk.gray(infoBoxBottom));
                console.log();
                
                resolve();
            }
        });
    });
}

(async () => {
    gradient = await loadGradient();
    await printAsciiArt();
    
    try {
        function createHeader(title, icon, color) {
            const width = 80;
            const titleText = ` ${icon}  ${title} `;
            const padding = width - titleText.length;
            const leftPad = Math.floor(padding / 2);
            const rightPad = padding - leftPad;
            
            console.log();
            console.log(chalk.gray('┌' + '─'.repeat(width - 2) + '┐'));
            console.log(chalk.gray('│') + chalk.gray('─'.repeat(leftPad)) + color.bold(titleText) + chalk.gray('─'.repeat(rightPad)) + chalk.gray('│'));
            console.log(chalk.gray('└' + '─'.repeat(width - 2) + '┘'));
        }
        
        createHeader('LOADING COMPONENTS', '⚙️', chalk.magenta);
        
        require('./functions/handlers/functionHandler');

        logger('Loading event handlers...', 'INFO');
        await eventsHandler(client, path.join(__dirname, eventsPath));
        logger('Event handlers loaded successfully!', 'SUCCESS');
        
        checkMissingIntents(client);

        logger('Connecting to MongoDB...', 'INFO');
        await mongoose.connect(process.env.MONGO_URI);
        logger('MongoDB connected successfully!', 'SUCCESS');

        logger('Connecting to Discord...', 'INFO');
        let loginAttempts = 0;
        const maxAttempts = 3;

        while (loginAttempts < maxAttempts) {
            try {
                await client.login(process.env.BOT_TOKEN || config.bot.token);
                // Wait for ready event
                await new Promise((resolve) => {
                    const timeout = setTimeout(() => {
                        logger('Ready event timeout - bot may have issues', 'WARNING');
                        resolve();
                    }, 30000); // 30 second timeout
                    
                    client.once('ready', () => {
                        clearTimeout(timeout);
                        logger(`Bot "${client.user.username}" logged in successfully!`, 'SUCCESS');
                        resolve();
                    });
                });
                break;
            } catch (error) {
                loginAttempts++;
                if (loginAttempts >= maxAttempts) {
                    logger(`Failed to login after ${maxAttempts} attempts`, 'ERROR');
                    logger(`Error: ${error.message}`, 'ERROR');
                    throw error;
                }
                logger(`Login attempt ${loginAttempts} failed, retrying in 5 seconds...`, 'WARNING');
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }

        logger('Loading slash commands...', 'INFO');
        await handleCommands(client, path.join(process.cwd(), 'src/commands'));
        logger(`Slash commands loaded successfully! (${client.commands.size} commands)`, 'SUCCESS');
        
        // Load dashboard routes AFTER bot is ready
        if (fs.existsSync(adminFolderPath) && fs.existsSync(dashboardFilePath)) {
            require(dashboardFilePath);
            logger('Admin dashboard loaded successfully!', 'SUCCESS');
        }

        initActivityTracker(path.join(__dirname, '..'));
        logger('Activity tracker initialized', 'SUCCESS');
        
        createHeader('BOT READY', '🚀', chalk.green);
    } catch (error) {
        if (error.message === "An invalid token was provided.") {
            logger('The token provided for the Discord bot is invalid. Please check your configuration.', 'ERROR');
            logErrorToFile(error);
        } else {
            logger(`Failed to start bot: ${error.message}`, 'ERROR');
            logErrorToFile(error);
        }
        process.exit(1); // Exit on critical error
    }
})();