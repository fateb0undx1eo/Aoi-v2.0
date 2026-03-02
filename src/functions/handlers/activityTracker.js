const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const micromatch = require('micromatch'); // 🟢 npm install micromatch
const chalk = require('chalk');

const config = require('../../config');
const { getDiscobaseConfig } = require('../../utils/discobase');

let activities = [];
const MAX_ACTIVITIES = 100;

const addActivity = (type, filePath, details = '') => {
    const timestamp = new Date().toLocaleTimeString();
    const relativePath = path.relative(process.cwd(), filePath);

    const activity = {
        id: Date.now().toString(),
        type,
        filePath: relativePath,
        details,
        timestamp,
        fileName: path.basename(filePath)
    };

    activities.unshift(activity);

    if (activities.length > MAX_ACTIVITIES) {
        activities = activities.slice(0, MAX_ACTIVITIES);
    }

    const typeColors = {
        add: chalk.green,
        change: chalk.blue,
        delete: chalk.red,
        rename: chalk.yellow
    };

    const icon = type === 'add' ? '✚' : type === 'change' ? '✎' : type === 'delete' ? '✖' : type === 'rename' ? '↪' : '•';
    console.log(
        `${chalk.gray(`[${timestamp}]`)} ${typeColors[type] ? typeColors[type](`${icon} ${type.toUpperCase()}`) : type} ${chalk.white('│')} ${chalk.cyan(relativePath)} ${details ? chalk.gray(details) : ''}`
    );
};

const getActivities = () => {
    return activities;
};

const initActivityTracker = (rootDir = process.cwd()) => {
    const discobaseConfig = getDiscobaseConfig();
    
    if (!discobaseConfig.activityTracker?.enabled) {
        console.log(`${chalk.yellow.bold('⚠ SKIPPED')} ${chalk.white('│')} Activity tracker is disabled in config`);
        return null;
    }

   
    const allIgnored = discobaseConfig.activityTracker.ignoredPaths || [];

    const watcher = chokidar.watch(rootDir, {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
            stabilityThreshold: 300,
            pollInterval: 100
        },
        ignored: (filePath) => {
            const relative = path.relative(rootDir, filePath).replace(/\\/g, '/');
            return micromatch.isMatch(relative, allIgnored);
        }
    });

    watcher
        .on('add', (filePath) => addActivity('add', filePath, 'File created'))
        .on('change', (filePath) => addActivity('change', filePath, 'File modified'))
        .on('unlink', (filePath) => addActivity('delete', filePath, 'File deleted'))
        .on('addDir', (dirPath) => addActivity('add', dirPath, 'Directory created'))
        .on('unlinkDir', (dirPath) => addActivity('delete', dirPath, 'Directory deleted'))
        .on('error', (error) => console.error(`Watcher error: ${error}`));

    const timestamp = new Date().toLocaleTimeString();
    console.log(`${chalk.gray(`[${timestamp}]`)} ${chalk.green.bold('✓ SUCCESS')} ${chalk.white('│')} Activity tracker initialized`);

    return watcher;
};

module.exports = {
    initActivityTracker,
    getFileActivities: getActivities,
    addActivity
};
