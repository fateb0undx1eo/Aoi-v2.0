const { Schema, model, models } = require('mongoose');

const configChangeLogSchema = new Schema({
    botId: {
        type: String,
        required: true,
        index: true
    },
    changeType: {
        type: String,
        enum: ['presence', 'avatar', 'username', 'banner'],
        required: true,
        index: true
    },
    oldValue: Schema.Types.Mixed,
    newValue: Schema.Types.Mixed,
    changedBy: {
        type: String,
        required: true
    },
    changedAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    source: {
        type: String,
        enum: ['command', 'dashboard'],
        required: true
    },
    success: {
        type: Boolean,
        required: true
    },
    errorMessage: String
});

// Compound index for audit queries
configChangeLogSchema.index({ botId: 1, changeType: 1, changedAt: -1 });

module.exports = models.ConfigChangeLog || model('ConfigChangeLog', configChangeLogSchema);
