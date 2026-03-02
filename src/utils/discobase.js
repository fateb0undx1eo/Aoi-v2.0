/**
 * DiscoBase utility for managing runtime configuration
 * Static config comes from environment variables via src/config
 * Dynamic config (like disabled commands) is stored in discobase.json
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');

const discobasePath = path.join(process.cwd(), 'discobase.json');

/**
 * Get the full discobase configuration
 * Merges static config from env with dynamic config from file
 */
function getDiscobaseConfig() {
    let dynamicConfig = { disabledCommands: [] };
    
    if (fs.existsSync(discobasePath)) {
        try {
            dynamicConfig = JSON.parse(fs.readFileSync(discobasePath, 'utf-8'));
        } catch (error) {
            console.error('Error reading discobase.json:', error);
        }
    }
    
    // Merge with static config from environment variables
    return {
        ...config.discobase,
        disabledCommands: dynamicConfig.disabledCommands || []
    };
}

/**
 * Get disabled commands list
 */
function getDisabledCommands() {
    if (fs.existsSync(discobasePath)) {
        try {
            const data = JSON.parse(fs.readFileSync(discobasePath, 'utf-8'));
            return data.disabledCommands || [];
        } catch (error) {
            console.error('Error reading disabled commands:', error);
        }
    }
    return [];
}

/**
 * Save disabled commands list
 */
function saveDisabledCommands(disabledCommands) {
    let currentConfig = { disabledCommands: [] };
    
    if (fs.existsSync(discobasePath)) {
        try {
            currentConfig = JSON.parse(fs.readFileSync(discobasePath, 'utf-8'));
        } catch (error) {
            console.error('Error reading current config:', error);
        }
    }
    
    currentConfig.disabledCommands = disabledCommands;
    
    try {
        fs.writeFileSync(discobasePath, JSON.stringify(currentConfig, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving disabled commands:', error);
        return false;
    }
}

/**
 * Check if error logging is enabled
 */
function isErrorLoggingEnabled() {
    return config.discobase.errorLogging.enabled;
}

/**
 * Check if command stats tracking is enabled
 */
function isCommandStatsEnabled() {
    return config.discobase.commandStats.enabled;
}

module.exports = {
    getDiscobaseConfig,
    getDisabledCommands,
    saveDisabledCommands,
    isErrorLoggingEnabled,
    isCommandStatsEnabled
};
