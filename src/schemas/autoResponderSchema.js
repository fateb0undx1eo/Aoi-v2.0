const mongoose = require('mongoose');

const autoResponderSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    triggers: [{
        id: { type: String, required: true },
        type: { type: String, enum: ['keyword', 'exact', 'mention', 'regex', 'startsWith', 'endsWith'], required: true },
        pattern: { type: String, required: true },
        response: { type: String, required: true },
        embed: {
            enabled: { type: Boolean, default: false },
            title: String,
            description: String,
            color: String,
            footer: String,
            thumbnail: String,
            image: String
        },
        enabled: { type: Boolean, default: true },
        caseSensitive: { type: Boolean, default: false },
        deleteOriginal: { type: Boolean, default: false },
        deleteResponse: { type: Boolean, default: false },
        deleteResponseAfter: { type: Number, default: 0 },
        cooldown: { type: Number, default: 0 },
        channelWhitelist: [String],
        channelBlacklist: [String],
        roleWhitelist: [String],
        roleBlacklist: [String],
        createdAt: { type: Date, default: Date.now },
        lastTriggered: Date,
        triggerCount: { type: Number, default: 0 }
    }]
});

// Check if model exists before compiling to avoid OverwriteModelError
module.exports = mongoose.models.AutoResponder || mongoose.model('AutoResponder', autoResponderSchema);
