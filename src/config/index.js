/**
 * Configuration module that reads from environment variables
 * This replaces the old config.json approach
 */

require('dotenv').config();

const config = {
    bot: {
        token: process.env.BOT_TOKEN,
        id: process.env.BOT_ID,
        admins: process.env.BOT_ADMINS ? process.env.BOT_ADMINS.split(',').map(id => id.trim()) : [],
        ownerId: process.env.BOT_OWNER_ID || '',
        developerCommandsServerIds: process.env.DEV_SERVER_IDS ? process.env.DEV_SERVER_IDS.split(',').map(id => id.trim()) : []
    },
    database: {
        mongodbUrl: process.env.MONGO_URI
    },
    logging: {
        guildJoinLogsId: process.env.GUILD_JOIN_LOGS_CHANNEL_ID || '',
        guildLeaveLogsId: process.env.GUILD_LEAVE_LOGS_CHANNEL_ID || '',
        commandLogsChannelId: process.env.COMMAND_LOGS_CHANNEL_ID || '',
        errorLogs: process.env.ERROR_WEBHOOK_URL || ''
    },
    prefix: {
        value: process.env.DEFAULT_PREFIX || '!'
    },
    // DiscoBase configuration from environment variables
    discobase: {
        errorLogging: {
            enabled: process.env.ERROR_LOGGING_ENABLED !== 'false' // default true
        },
        presence: {
            enabled: process.env.PRESENCE_ENABLED !== 'false', // default true
            status: process.env.PRESENCE_STATUS || 'online',
            interval: parseInt(process.env.PRESENCE_INTERVAL || '10000'),
            type: process.env.PRESENCE_TYPE || 'PLAYING',
            names: process.env.PRESENCE_NAMES ? process.env.PRESENCE_NAMES.split('|') : ['with commands'],
            streamingUrl: process.env.PRESENCE_STREAMING_URL || 'https://www.twitch.tv/example',
            customState: process.env.PRESENCE_CUSTOM_STATE || '🚀 discobase!'
        },
        commandStats: {
            enabled: process.env.COMMAND_STATS_ENABLED !== 'false', // default true
            trackUsage: process.env.COMMAND_STATS_TRACK_USAGE !== 'false',
            trackServers: process.env.COMMAND_STATS_TRACK_SERVERS !== 'false',
            trackUsers: process.env.COMMAND_STATS_TRACK_USERS !== 'false'
        },
        activityTracker: {
            enabled: process.env.ACTIVITY_TRACKER_ENABLED !== 'false', // default true
            ignoredPaths: process.env.ACTIVITY_TRACKER_IGNORED_PATHS 
                ? process.env.ACTIVITY_TRACKER_IGNORED_PATHS.split(',').map(p => p.trim())
                : ['**/node_modules/**', '.git', '.gitignore', 'discobase.json']
        }
    }
};

module.exports = config;
