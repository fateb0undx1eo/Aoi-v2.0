require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const mongoose = require('mongoose');
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
    console.log(`✅ Express server listening on port ${PORT}`);
});

// Create Discord client with proper intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ]
});

// Initialize collections
client.commands = new Collection();
client.prefixCommands = new Collection();
client.cooldowns = new Collection();

// Export for dashboard
module.exports = { client, server, app };

// Load handlers
console.log('🔄 Loading handlers...');
require('./handlers/commands')(client);
require('./handlers/events')(client);
require('./handlers/prefix')(client);

// Connect to MongoDB
console.log('🔄 Connecting to MongoDB...');
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });

// Initialize Bot Configuration Service
const BotConfigService = require('./services/botConfigService');

// Login to Discord
console.log('🔄 Logging in to Discord...');
client.login(process.env.BOT_TOKEN)
    .then(() => {
        console.log('✅ Bot logged in successfully');
    })
    .catch(err => {
        console.error('❌ Login error:', err);
        process.exit(1);
    });

// Initialize bot config service when ready
client.once('ready', () => {
    client.botConfigService = new BotConfigService(client);
    console.log('✅ Bot Configuration Service initialized');
    
    // Load dashboard after bot is ready
    const dashboardPath = require('path').join(__dirname, '../admin/dashboard.js');
    if (require('fs').existsSync(dashboardPath)) {
        require(dashboardPath);
        console.log('✅ Admin dashboard loaded');
    }
});

// Error handling
process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught exception:', error);
});
