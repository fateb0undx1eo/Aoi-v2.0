const config = require('../../config');
const mongoose = require('mongoose');
const chalk = require('chalk');
const { ActivityType } = require('discord.js');
const { prefixHandler } = require('../../functions/handlers/prefixHandler');
const path = require('path');
const fs = require('fs');
const { logErrorToFile } = require('../../utils/errorLogger');
const { log: logger } = require('../../utils/logger');

async function loadGradient() {
  const mod = await import('gradient-string');
  return mod.default;
}

// Helper function to update presence based on name rotation
function updatePresence(client, config, nameIndex) {
    try {
        // Map string activity types to Discord.js ActivityType enum
        const activityTypeMap = {
            'PLAYING': ActivityType.Playing,
            'STREAMING': ActivityType.Streaming,
            'LISTENING': ActivityType.Listening,
            'WATCHING': ActivityType.Watching,
            'COMPETING': ActivityType.Competing,
            'CUSTOM': ActivityType.Custom
        };
        
        // Validate status
        const validStatusTypes = ['online', 'idle', 'dnd', 'invisible'];
        const status = validStatusTypes.includes(config.status?.toLowerCase()) 
            ? config.status.toLowerCase() 
            : 'online';
        
        // Get the activity type
        const type = activityTypeMap[config.type] || ActivityType.Playing;
        
        // Get the current name from rotation
        const name = config.names[nameIndex] || 'DiscoBase';
        
        // Create the activity object
        const presenceActivity = {
            type: type,
            name: name
        };
        
        // Handle special activity types
        if (type === ActivityType.Streaming && config.streamingUrl) {
            // Validate streaming URL
            if (!config.streamingUrl) {
                logWithStyle('WARNING', 'Invalid streaming URL. Please provide a valid URL.');
            }
        } else if (type === ActivityType.Custom && config.customState) {
            presenceActivity.state = config.customState;
        }
        
        // Set the presence (only changes the name to minimize rate limiting)
        client.user.setPresence({
            activities: [presenceActivity],
            status: status
        });
        
        logger('Updated presence: ' + config.type + ' "' + name + '" (' + status + ')', 'INFO');
    } catch (error) {
        logger('Failed to update presence', 'ERROR');
        logErrorToFile(error);
    }
}

module.exports = {
    name: 'clientReady',
    once: true,
    async execute(client) {
        logger('Bot is ready and connected to Discord!', 'SUCCESS');

        if (!config.database.mongodbUrl || config.database.mongodbUrl === 'YOUR_MONGODB_URL_HERE') {
            logger('MongoDB URL is not provided or is set to the default placeholder. Skipping MongoDB connection.', 'INFO');
        } else {
            try {
                const gradient = await loadGradient();
                await mongoose.connect(config.database.mongodbUrl);
                const message = gradient(['#caf0f8', '#90e0ef', '#0077b6'])('✓ CONNECTION │ Successfully connected to MongoDB! Database is ready.');
                console.log(`${chalk.gray(`[${new Date().toLocaleTimeString([], { hour12: true })}]`)} ${message}`);
            } catch (error) {
                logger('Failed to connect to MongoDB. Please check your MongoDB URL and connection.', 'ERROR');
                logErrorToFile(error);
            }
        }

        // Load presence configuration from discobase.json
        try {
            const discobasePath = path.join(__dirname, '../../../discobase.json');
            if (fs.existsSync(discobasePath)) {
                const discobaseConfig = JSON.parse(fs.readFileSync(discobasePath, 'utf8'));
                
                if (discobaseConfig.presence && discobaseConfig.presence.enabled) {
                    const presenceConfig = discobaseConfig.presence;
                    const names = presenceConfig.names || ['DiscoBase'];
                    const interval = presenceConfig.interval || 10000;
                    
                    // Set initial presence
                    updatePresence(client, presenceConfig, 0);
                    
                    // If there are multiple names, set up rotation
                    if (names.length > 1) {
                        let currentIndex = 0;
                        setInterval(() => {
                            currentIndex = (currentIndex + 1) % names.length;
                            updatePresence(client, presenceConfig, currentIndex);
                        }, interval);
                    }
                } else {
                    // Default presence if disabled or not configured
                    client.user.setPresence({
                        activities: [{
                            type: ActivityType.Custom,
                            name: 'custom',
                            state: '🚀 Made with discoBase!'
                        }],
                        status: 'online'
                    });
                }
            } else {
                // Default presence if discobase.json doesn't exist
                client.user.setPresence({
                    activities: [{
                        type: ActivityType.Custom,
                        name: 'custom',
                        state: '🚀 Made with discoBase!'
                    }],
                    status: 'online'
                });
            }
        } catch (error) {
            logger('Failed to set custom presence. Using default.', 'ERROR');
            logErrorToFile(error);
            // Default presence if there's an error
            client.user.setPresence({
                activities: [{
                    type: ActivityType.Custom,
                    name: 'custom',
                    state: '🚀 Made with discoBase!'
                }],
                status: 'online'
            });
        }

        // Load prefix commands
        prefixHandler(client, path.join(process.cwd(), 'src/messages'));
    },
};
