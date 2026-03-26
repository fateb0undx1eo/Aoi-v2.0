require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');
const mongoose = require('mongoose');
const express = require('express');
const http = require('http');

// Create Express server for dashboard
const app = express();
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

app.get('/', (req, res) => {
    res.send('Bot is running');
});

server.listen(PORT, () => {
    console.log(`✅ Express server listening on port ${PORT}`);
});

// Create Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
    ],
    partials: [Partials.Channel],
});

// Initialize collections
client.commands = new Collection();
client.prefixCommands = new Collection();
client.cooldowns = new Collection();

// Export for dashboard
module.exports = { client, server, app };

// Load handlers
require('./src/handlers/commands')(client);
require('./src/handlers/events')(client);
require('./src/handlers/prefix')(client);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });

// Login to Discord
client.login(process.env.BOT_TOKEN)
    .then(() => console.log('✅ Logging in to Discord...'))
    .catch(err => {
        console.error('❌ Discord login error:', err);
        process.exit(1);
    });

// Error handling
process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
    console.error('Uncaught exception:', error);
});
