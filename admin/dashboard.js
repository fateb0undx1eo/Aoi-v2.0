const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const chalk = require('chalk');
const cors = require('cors');

// Get the Express app and server from index.js
const { client, server, app } = require('../src/index');

// Initialize Socket.IO
const SocketServer = require('../src/services/socketServer');
let socketServer;

client.once('ready', () => {
    socketServer = new SocketServer(server, client);
    console.log(chalk.green('[Dashboard] Socket.IO initialized'));
});

// CORS configuration using cors package
const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:3000', 'http://localhost:5173', 'https://aoisenpai.netlify.app'];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'discobase-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    }
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve React build - DISABLED: Dashboard is deployed on Netlify
// const reactBuildPath = path.join(__dirname, '../admin-react/dist');
// app.use(express.static(reactBuildPath));

// ==================== AUTHENTICATION ====================

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const validUsername = process.env.DASHBOARD_USERNAME || 'admin';
    const validPassword = process.env.DASHBOARD_PASSWORD || 'admin';

    if (username === validUsername && password === validPassword) {
        // Generate a simple token (in production, use JWT)
        const token = Buffer.from(`${username}:${password}`).toString('base64');
        res.json({ success: true, message: 'Logged in successfully', token });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

app.post('/api/logout', (req, res) => {
    res.json({ success: true, message: 'Logged out successfully' });
});

app.get('/api/auth/status', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const authenticated = validateToken(token);
    res.json({ authenticated });
});

app.get('/api/check-auth', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const authenticated = validateToken(token);
    res.json({ authenticated });
});

// Token validation helper
function validateToken(token) {
    if (!token) return false;
    try {
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const [username, password] = decoded.split(':');
        const validUsername = process.env.DASHBOARD_USERNAME || 'admin';
        const validPassword = process.env.DASHBOARD_PASSWORD || 'admin';
        return username === validUsername && password === validPassword;
    } catch {
        return false;
    }
}

// Auth middleware
function requireAuth(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (validateToken(token)) {
        next();
    } else {
        res.status(401).json({ error: 'Authentication required' });
    }
}

// Apply auth to all API routes except login
app.use('/api', (req, res, next) => {
    if (req.path === '/login' || req.path === '/auth/status') {
        return next();
    }
    requireAuth(req, res, next);
});

// ==================== PREFIX MANAGEMENT ====================

const PrefixSchema = require('../src/schemas/prefixSchema');

// Get prefix (global or per guild)
app.get('/api/prefix', async (req, res) => {
    try {
        // Get the first guild's prefix or create a default one
        const firstGuild = client.guilds.cache.first();
        const guildId = firstGuild ? firstGuild.id : 'global';
        
        let prefixDoc = await PrefixSchema.findOne({ guildId });
        
        if (!prefixDoc) {
            prefixDoc = await PrefixSchema.create({
                guildId,
                prefix: '!'
            });
        }
        
        res.json({ prefix: prefixDoc.prefix, guildId });
    } catch (error) {
        console.error('Error fetching prefix:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update prefix (global or per guild)
app.post('/api/prefix', async (req, res) => {
    try {
        const { prefix, guildId } = req.body;
        
        if (!prefix || prefix.length > 5) {
            return res.status(400).json({ success: false, message: 'Invalid prefix (max 5 characters)' });
        }

        // Use provided guildId or first guild
        const targetGuildId = guildId || (client.guilds.cache.first()?.id || 'global');

        const prefixDoc = await PrefixSchema.findOneAndUpdate(
            { guildId: targetGuildId },
            { prefix, updatedAt: new Date() },
            { upsert: true, new: true }
        );

        if (socketServer) {
            socketServer.io.emit('prefixUpdate', {
                guildId: targetGuildId,
                prefix: prefixDoc.prefix
            });
        }

        res.json({ success: true, prefix: prefixDoc.prefix, message: 'Prefix updated successfully' });
    } catch (error) {
        console.error('Error updating prefix:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Legacy endpoints for backward compatibility
app.get('/api/prefix/:guildId', async (req, res) => {
    try {
        let prefixDoc = await PrefixSchema.findOne({ guildId: req.params.guildId });
        
        if (!prefixDoc) {
            prefixDoc = await PrefixSchema.create({
                guildId: req.params.guildId,
                prefix: '!'
            });
        }
        
        res.json({ prefix: prefixDoc.prefix });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/prefix/:guildId', async (req, res) => {
    try {
        const { prefix } = req.body;
        
        if (!prefix || prefix.length > 5) {
            return res.status(400).json({ error: 'Invalid prefix' });
        }

        const prefixDoc = await PrefixSchema.findOneAndUpdate(
            { guildId: req.params.guildId },
            { prefix, updatedAt: new Date() },
            { upsert: true, new: true }
        );

        if (socketServer) {
            socketServer.io.emit('prefixUpdate', {
                guildId: req.params.guildId,
                prefix: prefixDoc.prefix
            });
        }

        res.json({ success: true, prefix: prefixDoc.prefix });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== BOT INFO ====================

app.get('/api/bot-info', async (req, res) => {
    try {
        const fetchedUser = await client.users.fetch(client.user.id, { force: true });
        const botStatus = client.presence.status;
        const botName = client.user.username;
        const botAvatar = `https://cdn.discordapp.com/avatars/${client.user.id}/${client.user.avatar}.png`;
        const botId = client.user.id;
        const botBanner = fetchedUser.banner ? `https://cdn.discordapp.com/banners/${client.user.id}/${fetchedUser.banner}.png` : null;

        res.json({
            botStatus,
            botName,
            botId,
            botBanner,
            botAvatar
        });
    } catch (err) {
        console.error('Error fetching bot info:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/bot-stats', async (req, res) => {
    try {
        const totalServers = client.guilds.cache.size;
        const totalCommands = (client.commands ? client.commands.size : 0) + (client.prefix ? client.prefix.size : 0);
        const botName = client.user.username;
        const botIcon = `https://cdn.discordapp.com/avatars/${client.user.id}/${client.user.avatar}.png`;
        let totalUsers = 0;
        client.guilds.cache.forEach(guild => {
            totalUsers += guild.memberCount;
        });

        res.json({
            totalServers,
            totalUsers,
            totalCommands,
            botName,
            botIcon
        });
    } catch (err) {
        console.error('Error fetching bot stats:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/overview-stats', async (req, res) => {
    try {
        const guilds = client.guilds.cache;
        let totalMembers = 0;
        let totalChannels = 0;
        
        guilds.forEach(guild => {
            totalMembers += guild.memberCount;
            totalChannels += guild.channels.cache.size;
        });

        res.json({
            guilds: guilds.size,
            members: totalMembers,
            channels: totalChannels,
            commands: (client.commands?.size || 0) + (client.prefix?.size || 0),
            uptime: process.uptime(),
            commandUsageToday: 0 // You can track this in your bot
        });
    } catch (error) {
        console.error('Error fetching overview stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

app.get('/api/bot-data2', async (req, res) => {
    try {
        const memUsage = process.memoryUsage();
        const totalMem = Math.round(memUsage.heapTotal / 1024 / 1024);
        const usedMem = Math.round(memUsage.heapUsed / 1024 / 1024);
        
        // Check MongoDB connection
        const mongoose = require('mongoose');
        const dbStatus = mongoose.connection.readyState === 1 ? 'Active' : 'Inactive';
        
        res.json({
            connections: {
                database: {
                    status: dbStatus
                },
                websocket: {
                    status: socketServer ? 'Stable' : 'Inactive'
                }
            },
            memory: {
                used: usedMem,
                total: totalMem
            },
            systemStatus: {
                operational: dbStatus === 'Active' && client.isReady(),
                message: dbStatus === 'Active' && client.isReady() 
                    ? 'All systems operational' 
                    : 'System degraded - check connections'
            }
        });
    } catch (error) {
        console.error('Error fetching system data:', error);
        res.status(500).json({ error: 'Failed to fetch system data' });
    }
});

// ==================== GUILDS ====================

app.get('/api/guilds', async (req, res) => {
    const guildsData = client.guilds.cache.map(guild => ({
        id: guild.id,
        name: guild.name,
        icon: guild.iconURL(),
        memberCount: guild.memberCount,
    }));

    res.json(guildsData);
});

// ==================== CHANNELS ====================

app.get('/api/channels/:guildId', async (req, res) => {
    try {
        const guild = await client.guilds.fetch(req.params.guildId);
        const channels = guild.channels.cache
            .filter(channel => channel.isTextBased())
            .map(channel => ({
                id: channel.id,
                name: channel.name,
                type: channel.type
            }));
        
        res.json(channels);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== COMMANDS ====================

function getDisabledCommands() {
    const discobasePath = path.join(__dirname, '../discobase.json');
    if (fs.existsSync(discobasePath)) {
        const config = JSON.parse(fs.readFileSync(discobasePath, 'utf-8'));
        return config.disabledCommands || [];
    }
    return [];
}

function saveDisabledCommands(disabledCommands) {
    const discobasePath = path.join(__dirname, '../discobase.json');
    let config = {};
    if (fs.existsSync(discobasePath)) {
        config = JSON.parse(fs.readFileSync(discobasePath, 'utf-8'));
    }
    config.disabledCommands = disabledCommands;
    fs.writeFileSync(discobasePath, JSON.stringify(config, null, 2));
}

app.get('/api/commands', (req, res) => {
    const slashCommandsDir = path.join(__dirname, '../src/commands');
    const prefixCommandsDir = path.join(__dirname, '../src/messages');
    const commands = {
        slash: [],
        prefix: []
    };
    const disabledCommands = getDisabledCommands();

    function readCommands(dir, commandArray, type, category = null) {
        return new Promise((resolve, reject) => {
            fs.readdir(dir, (err, files) => {
                if (err) {
                    return reject(`Error reading ${type} commands`);
                }

                const promises = files.map(file => {
                    const filePath = path.join(dir, file);
                    return new Promise((resolveFile, rejectFile) => {
                        fs.stat(filePath, (err, stats) => {
                            if (err) {
                                return rejectFile('Error reading file stats');
                            }

                            if (stats.isDirectory()) {
                                const folderCategory = file.charAt(0).toUpperCase() + file.slice(1);
                                readCommands(filePath, commandArray, type, folderCategory).then(resolveFile).catch(rejectFile);
                            } else if (path.extname(file) === '.js') {
                                const command = require(filePath);
                                const commandName = type === 'slash' ? command.data?.name : command.name;
                                if (commandName) {
                                    commandArray.push({
                                        name: commandName,
                                        description: type === 'slash' ? command.data?.description : command.description,
                                        category: category || 'General',
                                        disabled: disabledCommands.includes(commandName)
                                    });
                                }
                                resolveFile();
                            } else {
                                resolveFile();
                            }
                        });
                    });
                });

                Promise.all(promises).then(resolve).catch(reject);
            });
        });
    }

    readCommands(slashCommandsDir, commands.slash, 'slash')
        .then(() => readCommands(prefixCommandsDir, commands.prefix, 'prefix'))
        .then(() => {
            res.json(commands);
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: err });
        });
});

app.post('/api/commands/toggle', (req, res) => {
    const { commandName, disabled } = req.body;
    
    if (!commandName) {
        return res.status(400).json({ success: false, message: 'Command name is required' });
    }

    try {
        let disabledCommands = getDisabledCommands();
        
        if (disabled && !disabledCommands.includes(commandName)) {
            disabledCommands.push(commandName);
        } else if (!disabled) {
            disabledCommands = disabledCommands.filter(cmd => cmd !== commandName);
        }
        
        saveDisabledCommands(disabledCommands);
        
        res.json({ success: true, message: `Command ${disabled ? 'disabled' : 'enabled'} successfully` });
    } catch (error) {
        console.error('Error toggling command:', error);
        res.status(500).json({ success: false, message: 'Failed to toggle command' });
    }
});

// ==================== EMBED MESSAGES ====================

app.post('/api/send-embed', async (req, res) => {
    try {
        const { channelId, embed } = req.body;
        
        if (!channelId || !embed) {
            return res.status(400).json({ success: false, message: 'Channel ID and embed data required' });
        }
        
        const channel = await client.channels.fetch(channelId);
        if (!channel || !channel.isTextBased()) {
            return res.status(404).json({ success: false, message: 'Channel not found or not text-based' });
        }
        
        await channel.send({ embeds: [embed] });
        res.json({ success: true, message: 'Embed sent successfully' });
    } catch (error) {
        console.error('Error sending embed:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==================== WAIFU/HUSBANDO CONFIG ====================

// Get waifu/husbando config for a guild
app.get('/api/waifu-config', async (req, res) => {
    try {
        const firstGuild = client.guilds.cache.first();
        if (!firstGuild) {
            return res.status(404).json({ error: 'No guilds found' });
        }

        const WaifuConfig = require('../src/schemas/waifuConfigSchema');
        let config = await WaifuConfig.findOne({ guildId: firstGuild.id });
        
        if (!config) {
            config = await WaifuConfig.create({ guildId: firstGuild.id });
        }

        res.json({
            success: true,
            config: {
                claimDisplayTime: config.claimDisplayTime,
                cardLifetime: config.cardLifetime,
                collectorTime: config.collectorTime,
                globalCooldown: config.globalCooldown,
                userCooldown: config.userCooldown
            }
        });
    } catch (error) {
        console.error('Error fetching waifu config:', error);
        res.status(500).json({ error: 'Failed to fetch waifu config' });
    }
});

// Update waifu/husbando config
app.post('/api/waifu-config', async (req, res) => {
    try {
        const firstGuild = client.guilds.cache.first();
        if (!firstGuild) {
            return res.status(404).json({ error: 'No guilds found' });
        }

        const { claimDisplayTime, cardLifetime, collectorTime, globalCooldown, userCooldown } = req.body;

        const WaifuConfig = require('../src/schemas/waifuConfigSchema');
        let config = await WaifuConfig.findOne({ guildId: firstGuild.id });
        
        if (!config) {
            config = new WaifuConfig({ guildId: firstGuild.id });
        }

        if (claimDisplayTime !== undefined) config.claimDisplayTime = claimDisplayTime;
        if (cardLifetime !== undefined) config.cardLifetime = cardLifetime;
        if (collectorTime !== undefined) config.collectorTime = collectorTime;
        if (globalCooldown !== undefined) config.globalCooldown = globalCooldown;
        if (userCooldown !== undefined) config.userCooldown = userCooldown;
        config.updatedAt = Date.now();

        await config.save();

        res.json({
            success: true,
            message: 'Waifu config updated successfully',
            config: {
                claimDisplayTime: config.claimDisplayTime,
                cardLifetime: config.cardLifetime,
                collectorTime: config.collectorTime,
                globalCooldown: config.globalCooldown,
                userCooldown: config.userCooldown
            }
        });
    } catch (error) {
        console.error('Error updating waifu config:', error);
        res.status(500).json({ error: 'Failed to update waifu config' });
    }
});

// ==================== DISCOBASE CONFIG ====================

app.get('/api/discobase-config', (req, res) => {
    const discobasePath = path.join(__dirname, '../discobase.json');
    if (fs.existsSync(discobasePath)) {
        const config = JSON.parse(fs.readFileSync(discobasePath, 'utf-8'));
        res.json(config);
    } else {
        res.status(404).json({ error: 'Configuration not found' });
    }
});

app.post('/api/discobase-config', (req, res) => {
    const discobasePath = path.join(__dirname, '../discobase.json');
    try {
        const currentConfig = fs.existsSync(discobasePath) 
            ? JSON.parse(fs.readFileSync(discobasePath, 'utf-8'))
            : {};
        
        const updatedConfig = { ...currentConfig, ...req.body };
        fs.writeFileSync(discobasePath, JSON.stringify(updatedConfig, null, 2));
        
        res.json({ success: true, message: 'Configuration updated successfully' });
    } catch (error) {
        console.error('Error updating configuration:', error);
        res.status(500).json({ success: false, message: 'Failed to update configuration' });
    }
});

// Catch-all route - Return simple message since dashboard is on Netlify
app.get(/.*/, (req, res) => {
    if (req.originalUrl.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.json({ 
        message: 'Aoi Bot API is running',
        dashboard: 'Dashboard is deployed separately on Netlify',
        status: 'online'
    });
});

// Start the server (already started in index.js)
console.log(chalk.green('[Dashboard] API routes registered'));
