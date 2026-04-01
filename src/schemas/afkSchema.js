const mongoose = require('mongoose');

const afkSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    reason: { type: String, default: "No reason provided" },
    timestamp: { type: Date, default: Date.now },
    dmNotify: { type: Boolean, default: false }
});

// Prevent model overwrite error in development (important)
module.exports = mongoose.models.premium_afk || mongoose.model('premium_afk', afkSchema);
