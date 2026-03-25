const fs = require('fs');
const path = require('path');
const BotConfigSchema = require('../schemas/botConfigSchema');

/**
 * Migrate presence configuration from discobase.json to database
 * @param {Object} client - Discord client
 * @returns {Promise<boolean>} - True if migration successful
 */
async function migratePresenceConfig(client) {
    try {
        // Check if config already exists in database
        const existingConfig = await BotConfigSchema.findOne({ botId: client.user.id });
        if (existingConfig) {
            console.log('[Migration] Bot configuration already exists in database, skipping migration');
            return false;
        }

        // Try to load from discobase.json
        const discobasePath = path.join(__dirname, '../../discobase.json');
        let presenceConfig = null;

        if (fs.existsSync(discobasePath)) {
            const discobaseConfig = JSON.parse(fs.readFileSync(discobasePath, 'utf8'));
            
            if (discobaseConfig.presence && discobaseConfig.presence.enabled) {
                const { status, type, names, interval, streamingUrl, customState } = discobaseConfig.presence;
                
                // Map activity type string to Discord.js ActivityType number
                const activityTypeMap = {
                    'PLAYING': 0,
                    'STREAMING': 1,
                    'LISTENING': 2,
                    'WATCHING': 3,
                    'CUSTOM': 4,
                    'COMPETING': 5
                };

                // Create activities array from names
                const activities = names.map(name => ({
                    type: activityTypeMap[type] || 0,
                    name: name,
                    url: type === 'STREAMING' ? streamingUrl : undefined
                }));

                presenceConfig = {
                    status: status || 'online',
                    activities: activities,
                    rotation: {
                        enabled: names.length > 1,
                        interval: interval || 10000,
                        currentIndex: 0
                    }
                };

                console.log('[Migration] Loaded presence config from discobase.json');
            }
        }

        // Fallback to environment variables if discobase.json doesn't exist
        if (!presenceConfig) {
            const envNames = process.env.PRESENCE_NAMES ? process.env.PRESENCE_NAMES.split('|') : ['with commands'];
            const envType = process.env.PRESENCE_TYPE || 'PLAYING';
            const envStatus = process.env.PRESENCE_STATUS || 'online';
            const envInterval = parseInt(process.env.PRESENCE_INTERVAL || '10000');

            const activityTypeMap = {
                'PLAYING': 0,
                'STREAMING': 1,
                'LISTENING': 2,
                'WATCHING': 3,
                'CUSTOM': 4,
                'COMPETING': 5
            };

            const activities = envNames.map(name => ({
                type: activityTypeMap[envType] || 0,
                name: name
            }));

            presenceConfig = {
                status: envStatus,
                activities: activities,
                rotation: {
                    enabled: envNames.length > 1,
                    interval: envInterval,
                    currentIndex: 0
                }
            };

            console.log('[Migration] Loaded presence config from environment variables');
        }

        // Create new config in database
        await BotConfigSchema.create({
            botId: client.user.id,
            presence: presenceConfig,
            appearance: {
                username: client.user.username,
                avatarUrl: client.user.displayAvatarURL()
            },
            rateLimits: {
                username: { changesRemaining: 2 },
                avatar: { changesRemaining: 2 },
                banner: { changesRemaining: 2 }
            }
        });

        console.log('[Migration] Successfully migrated presence configuration to database');
        return true;
    } catch (error) {
        console.error('[Migration] Failed to migrate presence config:', error);
        return false;
    }
}

module.exports = { migratePresenceConfig };
