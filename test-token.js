require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

console.log('='.repeat(60));
console.log('DISCORD BOT TOKEN DIAGNOSTIC TEST');
console.log('='.repeat(60));

// Check if token exists
const token = process.env.BOT_TOKEN;
console.log('\n1. TOKEN CHECK:');
console.log('   Token exists:', !!token);
console.log('   Token length:', token ? token.length : 0);
console.log('   Token starts with:', token ? token.substring(0, 20) + '...' : 'N/A');

// Check token format
if (token) {
    const parts = token.split('.');
    console.log('   Token parts:', parts.length, '(should be 3)');
    if (parts.length !== 3) {
        console.log('   ❌ INVALID TOKEN FORMAT! Discord tokens have 3 parts separated by dots.');
    }
}

console.log('\n2. ATTEMPTING CONNECTION:');
console.log('   Creating Discord client...');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.on('ready', () => {
    console.log('\n✅ SUCCESS! Bot connected!');
    console.log('   Bot username:', client.user.tag);
    console.log('   Bot ID:', client.user.id);
    console.log('   Guilds:', client.guilds.cache.size);
    console.log('\n='.repeat(60));
    console.log('THE BOT CODE IS WORKING PERFECTLY!');
    console.log('='.repeat(60));
    process.exit(0);
});

client.on('error', (error) => {
    console.log('\n❌ CLIENT ERROR:');
    console.log('   Error:', error.message);
    console.log('   Code:', error.code);
});

console.log('   Logging in...');
client.login(token).catch(error => {
    console.log('\n❌ LOGIN FAILED!');
    console.log('   Error:', error.message);
    console.log('   Code:', error.code);
    
    if (error.code === 'TokenInvalid') {
        console.log('\n🔧 FIX:');
        console.log('   1. Go to https://discord.com/developers/applications');
        console.log('   2. Select your bot');
        console.log('   3. Go to Bot section');
        console.log('   4. Click "Reset Token"');
        console.log('   5. Copy the NEW token');
        console.log('   6. Update BOT_TOKEN in Render environment variables');
    } else if (error.code === 'DisallowedIntents') {
        console.log('\n🔧 FIX:');
        console.log('   1. Go to https://discord.com/developers/applications');
        console.log('   2. Select your bot');
        console.log('   3. Go to Bot section');
        console.log('   4. Enable these Privileged Gateway Intents:');
        console.log('      ✅ PRESENCE INTENT');
        console.log('      ✅ SERVER MEMBERS INTENT');
        console.log('      ✅ MESSAGE CONTENT INTENT');
        console.log('   5. Click Save Changes');
    }
    
    console.log('\n='.repeat(60));
    process.exit(1);
});

// Timeout after 30 seconds
setTimeout(() => {
    console.log('\n⏱️ TIMEOUT: Bot did not connect within 30 seconds');
    console.log('   This usually means:');
    console.log('   - Token is invalid');
    console.log('   - Network issues');
    console.log('   - Discord API is down');
    process.exit(1);
}, 30000);
