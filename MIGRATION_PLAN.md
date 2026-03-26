# Migration Plan: DiscoBase → Pure Discord.js

## Why Migrate?

**Current Issues**:
- ❌ Frequent crashes
- ❌ Button interactions timing out too quickly
- ❌ Roleplay commands not responding
- ❌ Presence updates not working
- ❌ Complex framework causing instability
- ❌ Hard to debug and maintain

**Benefits of Pure Discord.js**:
- ✅ Direct control over all functionality
- ✅ Simpler, more maintainable code
- ✅ Better error handling
- ✅ Longer interaction timeouts
- ✅ More stable and reliable
- ✅ Easier to debug
- ✅ Standard Discord.js patterns

---

## What We'll Keep

### Features to Preserve
1. ✅ All slash commands (75 commands)
2. ✅ All prefix commands (48+ roleplay commands)
3. ✅ Roleplay system with 3 APIs (waifu.pics, nekos.best, PurrBot)
4. ✅ Bot configuration (/botconfig)
5. ✅ AFK system
6. ✅ Autopost system
7. ✅ Chess integration
8. ✅ Admin dashboard (Express + React)
9. ✅ MongoDB integration
10. ✅ All existing commands and features

### What We'll Remove
- ❌ DiscoBase framework
- ❌ Complex handler system
- ❌ Unnecessary abstractions
- ❌ Framework-specific utilities

---

## New Structure

```
src/
├── index.js                    # Main bot file (clean Discord.js)
├── commands/                   # Slash commands
│   ├── admin/
│   │   ├── botconfig.js
│   │   ├── setroleplayprefix.js
│   │   └── viewprefixes.js
│   ├── community/
│   │   ├── afk.js
│   │   ├── autopost.js
│   │   └── fun/
│   └── index.js               # Command loader
├── events/                     # Discord events
│   ├── ready.js
│   ├── interactionCreate.js
│   └── messageCreate.js       # Prefix commands
├── handlers/                   # Simple handlers
│   ├── commands.js            # Load slash commands
│   ├── events.js              # Load events
│   └── prefix.js              # Load prefix commands
├── utils/                      # Utilities
│   ├── roleplayAPI.js
│   ├── roleplayHandler.js
│   ├── apiClient.js
│   └── logger.js
├── services/                   # Services
│   ├── botConfigService.js
│   └── socketServer.js
└── schemas/                    # MongoDB schemas
    ├── prefixSchema.js
    ├── afkSchema.js
    └── botConfigSchema.js
```

---

## Migration Steps

### Phase 1: Create New Bot Core (30 minutes)
1. Create new `src/bot.js` with pure Discord.js
2. Implement simple command handler
3. Implement simple event handler
4. Test basic functionality

### Phase 2: Migrate Commands (1 hour)
1. Convert slash commands to standard format
2. Convert prefix commands to standard format
3. Test each command category
4. Fix any issues

### Phase 3: Migrate Features (1 hour)
1. Migrate roleplay system
2. Migrate AFK system
3. Migrate autopost system
4. Migrate bot config system
5. Test all features

### Phase 4: Dashboard Integration (30 minutes)
1. Update dashboard to work with new bot
2. Test API endpoints
3. Test WebSocket connections

### Phase 5: Testing & Deployment (30 minutes)
1. Full system test
2. Fix any remaining issues
3. Deploy to Render
4. Monitor for 24 hours

**Total Time**: ~3-4 hours

---

## Implementation Plan

### Step 1: New Bot Core

**File**: `src/bot.js`
```javascript
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const mongoose = require('mongoose');

// Create client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

// Collections
client.commands = new Collection();
client.prefixCommands = new Collection();
client.cooldowns = new Collection();

// Load handlers
require('./handlers/commands')(client);
require('./handlers/events')(client);
require('./handlers/prefix')(client);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error('❌ MongoDB error:', err));

// Login
client.login(process.env.BOT_TOKEN);

module.exports = client;
```

### Step 2: Simple Command Handler

**File**: `src/handlers/commands.js`
```javascript
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = (client) => {
    const commands = [];
    const commandsPath = path.join(__dirname, '../commands');
    
    // Load all command files recursively
    function loadCommands(dir) {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
                loadCommands(filePath);
            } else if (file.endsWith('.js')) {
                const command = require(filePath);
                if (command.data && command.execute) {
                    client.commands.set(command.data.name, command);
                    commands.push(command.data.toJSON());
                    console.log(`✅ Loaded command: ${command.data.name}`);
                }
            }
        }
    }
    
    loadCommands(commandsPath);
    
    // Register commands with Discord
    const rest = new REST().setToken(process.env.BOT_TOKEN);
    
    (async () => {
        try {
            console.log('🔄 Registering slash commands...');
            await rest.put(
                Routes.applicationCommands(process.env.BOT_ID),
                { body: commands }
            );
            console.log(`✅ Registered ${commands.length} slash commands`);
        } catch (error) {
            console.error('❌ Error registering commands:', error);
        }
    })();
};
```

### Step 3: Simple Event Handler

**File**: `src/handlers/events.js`
```javascript
const fs = require('fs');
const path = require('path');

module.exports = (client) => {
    const eventsPath = path.join(__dirname, '../events');
    const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));
    
    for (const file of eventFiles) {
        const event = require(path.join(eventsPath, file));
        
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
        
        console.log(`✅ Loaded event: ${event.name}`);
    }
};
```

### Step 4: Interaction Handler

**File**: `src/events/interactionCreate.js`
```javascript
module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        // Handle slash commands
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            
            if (!command) return;
            
            try {
                await command.execute(interaction, client);
            } catch (error) {
                console.error('Command error:', error);
                const reply = { 
                    content: 'There was an error executing this command!', 
                    ephemeral: true 
                };
                
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(reply);
                } else {
                    await interaction.reply(reply);
                }
            }
        }
        
        // Handle buttons
        if (interaction.isButton()) {
            // Route to appropriate handler
            if (interaction.customId.startsWith('afk_')) {
                const { handleAfkButton } = require('../features/afk');
                await handleAfkButton(interaction);
            }
            else if (interaction.customId.startsWith('autopost_')) {
                const { handleAutopostButton } = require('../features/autopost');
                await handleAutopostButton(interaction);
            }
            // Add more button handlers as needed
        }
        
        // Handle select menus
        if (interaction.isStringSelectMenu()) {
            // Route to appropriate handler
        }
    }
};
```

### Step 5: Message Handler (Prefix Commands)

**File**: `src/events/messageCreate.js`
```javascript
const PrefixSchema = require('../schemas/prefixSchema');

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (message.author.bot) return;
        
        // Get prefix from database
        let prefix = '!';
        let roleplayPrefix = 'r!';
        
        try {
            const guildId = message.guild?.id || 'global';
            const prefixDoc = await PrefixSchema.findOne({ guildId });
            if (prefixDoc) {
                prefix = prefixDoc.prefix;
                roleplayPrefix = prefixDoc.roleplayPrefix || 'r!';
            }
        } catch (error) {
            console.error('Error fetching prefix:', error);
        }
        
        // Check which prefix is used
        let usedPrefix = null;
        if (message.content.startsWith(roleplayPrefix)) {
            usedPrefix = roleplayPrefix;
        } else if (message.content.startsWith(prefix)) {
            usedPrefix = prefix;
        } else {
            return;
        }
        
        // Parse command
        const args = message.content.slice(usedPrefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        
        // Get command
        const command = client.prefixCommands.get(commandName);
        if (!command) return;
        
        // Execute command
        try {
            await command.execute(message, args, client);
        } catch (error) {
            console.error('Prefix command error:', error);
            message.reply('There was an error executing this command!');
        }
    }
};
```

---

## Key Improvements

### 1. Longer Interaction Timeouts
```javascript
// Buttons now have 15 minute timeout instead of 5 minutes
const collector = message.createMessageComponentCollector({ 
    time: 900000  // 15 minutes
});
```

### 2. Better Error Handling
```javascript
try {
    await command.execute(interaction, client);
} catch (error) {
    console.error('Error:', error);
    // Proper error response
}
```

### 3. Simpler Code Structure
- No complex framework abstractions
- Direct Discord.js API usage
- Easy to understand and modify
- Standard patterns

### 4. Better Stability
- No framework overhead
- Direct control over all features
- Easier to debug
- More reliable

---

## Testing Checklist

### Basic Functionality
- [ ] Bot starts without errors
- [ ] Connects to Discord
- [ ] Connects to MongoDB
- [ ] Loads all commands
- [ ] Loads all events

### Slash Commands
- [ ] /botconfig view
- [ ] /botconfig presence
- [ ] /afk
- [ ] /autopost
- [ ] All other slash commands

### Prefix Commands
- [ ] !hug @user
- [ ] !kiss @user
- [ ] !waifu
- [ ] All other roleplay commands

### Interactions
- [ ] Buttons work (don't timeout)
- [ ] Select menus work
- [ ] Modals work
- [ ] Collectors work properly

### Dashboard
- [ ] API endpoints work
- [ ] WebSocket connections stable
- [ ] Real-time updates work

---

## Rollback Plan

If migration fails:
1. Revert to previous commit: `git reset --hard f87f5a5`
2. Redeploy old version
3. Investigate issues
4. Try again with fixes

---

## Timeline

- **Preparation**: 30 minutes
- **Core Migration**: 1 hour
- **Feature Migration**: 1.5 hours
- **Testing**: 1 hour
- **Deployment**: 30 minutes

**Total**: ~4-5 hours

---

## Decision

**Proceed with migration?**
- ✅ Yes - Start migration now
- ❌ No - Try to fix DiscoBase issues

**Recommendation**: Proceed with migration. The current framework is causing too many issues and a clean Discord.js implementation will be much more stable and maintainable.

---

**Ready to start?** I can begin creating the new bot structure immediately.
