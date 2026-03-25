const mongoose = require('mongoose');

const afkSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    reason: { type: String, default: "No reason provided" },
    timestamp: { type: Date, default: Date.now },
    dmNotify: { type: Boolean, default: false }
});

// Add compound index for efficient queries
afkSchema.index({ userId: 1, guildId: 1 }, { unique: true });
afkSchema.index({ guildId: 1 }); // For guild-wide queries
afkSchema.index({ timestamp: 1 }); // For time-based queries

// Prevent model overwrite error in development (important)
module.exports = mongoose.models.premium_afk || mongoose.model('premium_afk', afkSchema);
