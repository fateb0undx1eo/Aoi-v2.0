const { Schema, model, models } = require('mongoose');

const waifuConfigSchema = new Schema({
    guildId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    // Timing Settings (in milliseconds)
    claimDisplayTime: {
        type: Number,
        default: 10000  // 10 seconds
    },
    cardLifetime: {
        type: Number,
        default: 15000  // 15 seconds
    },
    collectorTime: {
        type: Number,
        default: 30000  // 30 seconds
    },
    // Cooldown Settings (in milliseconds)
    globalCooldown: {
        type: Number,
        default: 30000  // 30 seconds
    },
    userCooldown: {
        type: Number,
        default: 60000  // 60 seconds
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = models.WaifuConfig || model('WaifuConfig', waifuConfigSchema);
