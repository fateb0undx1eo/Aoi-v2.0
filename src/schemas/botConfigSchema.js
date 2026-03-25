const { Schema, model, models } = require('mongoose');

const botConfigSchema = new Schema({
    botId: {
        type: String,
        required: true,
        unique: true
    },
    presence: {
        status: {
            type: String,
            enum: ['online', 'idle', 'dnd', 'invisible'],
            default: 'online'
        },
        activities: [{
            type: {
                type: Number,
                enum: [0, 1, 2, 3, 4, 5], // Playing, Streaming, Listening, Watching, Custom, Competing
                default: 0
            },
            name: {
                type: String,
                required: true,
                maxlength: 128
            },
            url: String // For streaming
        }],
        rotation: {
            enabled: {
                type: Boolean,
                default: false
            },
            interval: {
                type: Number,
                default: 10000,
                min: 5000 // Minimum 5 seconds
            },
            currentIndex: {
                type: Number,
                default: 0
            }
        }
    },
    appearance: {
        username: {
            type: String,
            minlength: 2,
            maxlength: 32
        },
        avatarUrl: String,
        bannerUrl: String
    },
    rateLimits: {
        username: {
            lastChanged: Date,
            changesRemaining: {
                type: Number,
                default: 2
            }
        },
        avatar: {
            lastChanged: Date,
            changesRemaining: {
                type: Number,
                default: 2
            }
        },
        banner: {
            lastChanged: Date,
            changesRemaining: {
                type: Number,
                default: 2
            }
        }
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    updatedBy: String
});

module.exports = models.BotConfig || model('BotConfig', botConfigSchema);
