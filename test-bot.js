// SIMPLE BOT TEST - This will show the exact error
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

console.log('=== BOT CONNECTION TEST ===');
console.log('Token exists:', !!process.env.BOT_TOKEN);
console.log('Token starts with:', process.env.BOT_TOKEN?.substring(0, 20) + '...');
console.log('Attempting to connect...\n');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.on('ready', () => {
    console.log('✅ SUCCESS! Bot logged in as:', client.user.tag);
    console.log('Bot ID:', client.user.id);
    console.log('Guilds:', client.guilds.cache.size);
    process.exit(0);
});

client.on('error', (error) => {
    console.error('❌ CLIENT ERROR:', error.message);
    process.exit(1);
});

client.login(process.env.BOT_TOKEN)
    .then(() => {
        console.log('Login call successful, waiting for ready event...');
    })
    .catch((error) => {
        console.error('\n❌ LOGIN FAILED!');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('\nPossible causes:');
        console.error('1. Invalid bot token - regenerate in Discord Developer Portal');
        console.error('2. Bot was deleted from Discord Developer Portal');
        console.error('3. Token not set in Render environment variables');
        console.error('\nFix: Go to https://discord.com/developers/applications');
        console.error('     → Select your bot → Bot → Reset Token → Copy new token');
        console.error('     → Update BOT_TOKEN in Render environment variables');
        process.exit(1);
    });

// Timeout after 30 seconds
setTimeout(() => {
    console.error('\n❌ TIMEOUT: Bot did not connect within 30 seconds');
    console.error('This usually means:');
    console.error('1. Invalid token (Discord silently rejects it)');
    console.error('2. Network issues (unlikely on Render)');
    console.error('3. Discord API is down (very rare)');
    process.exit(1);
}, 30000);
