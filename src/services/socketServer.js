const { Server } = require('socket.io');

class SocketServer {
    constructor(httpServer, client) {
        this.io = new Server(httpServer, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST']
            }
        });
        this.client = client;
        this.connectedClients = new Set();

        this.initialize();
    }

    initialize() {
        this.io.on('connection', (socket) => {
            console.log('[SocketServer] Client connected:', socket.id);
            this.connectedClients.add(socket.id);

            // Send initial data
            this.sendBotStats(socket);

            socket.on('disconnect', () => {
                console.log('[SocketServer] Client disconnected:', socket.id);
                this.connectedClients.delete(socket.id);
            });

            socket.on('requestUpdate', (type) => {
                this.handleUpdateRequest(socket, type);
            });
        });

        // Auto-update every 5 seconds
        setInterval(() => {
            this.broadcastBotStats();
        }, 5000);

        console.log('[SocketServer] Initialized successfully');
    }

    async sendBotStats(socket) {
        try {
            const stats = await this.getBotStats();
            socket.emit('botStats', stats);
        } catch (error) {
            console.error('[SocketServer] Error sending stats:', error);
        }
    }

    async broadcastBotStats() {
        try {
            const stats = await this.getBotStats();
            this.io.emit('botStats', stats);
        } catch (error) {
            console.error('[SocketServer] Error broadcasting stats:', error);
        }
    }

    async getBotStats() {
        const guilds = this.client.guilds.cache;
        let totalMembers = 0;
        let totalChannels = 0;

        guilds.forEach(guild => {
            totalMembers += guild.memberCount;
            totalChannels += guild.channels.cache.size;
        });

        return {
            guilds: guilds.size,
            members: totalMembers,
            channels: totalChannels,
            commands: (this.client.commands?.size || 0) + (this.client.prefix?.size || 0),
            uptime: process.uptime(),
            memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            timestamp: Date.now()
        };
    }

    // Emit events
    emitPresenceUpdate(presence) {
        this.io.emit('presenceUpdate', presence);
    }

    emitGuildChange(type, guild) {
        this.io.emit('guildChange', { type, guild });
    }

    emitRoleUpdate(guildId, role) {
        this.io.emit('roleUpdate', { guildId, role });
    }

    emitCommandRun(commandName, userId, guildId) {
        this.io.emit('commandRun', { commandName, userId, guildId, timestamp: Date.now() });
    }

    handleUpdateRequest(socket, type) {
        switch (type) {
            case 'stats':
                this.sendBotStats(socket);
                break;
            default:
                console.log('[SocketServer] Unknown update request:', type);
        }
    }
}

module.exports = SocketServer;
