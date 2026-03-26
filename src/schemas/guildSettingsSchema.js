const { Schema, model } = require('mongoose');

const guildSettingsSchema = new Schema({
    guildId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    rateIntelligence: {
        type: Boolean,
        default: true
    },
    selfHealing: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

guildSettingsSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = model('GuildSettings', guildSettingsSchema);
