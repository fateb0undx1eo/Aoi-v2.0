const chalk = require('chalk');

function log(message, type = 'INFO') {
    const timestamp = new Date().toLocaleTimeString();
    let icon, color;

    switch (type.toUpperCase()) {
        case 'SUCCESS':
            icon = '✓';
            color = chalk.green.bold(`${icon} ${type}`);
            break;
        case 'INFO':
            icon = 'ℹ';
            color = chalk.blue.bold(`${icon} ${type}`);
            break;
        case 'WARNING':
            icon = '⚠';
            color = chalk.yellow.bold(`${icon} ${type}`);
            break;
        case 'ERROR':
            icon = '✖';
            color = chalk.red.bold(`${icon} ${type}`);
            break;
        case 'SYSTEM':
            icon = '⚙';
            color = chalk.cyan.bold(`${icon} ${type}`);
            break;
        default:
            icon = '•';
            color = chalk.white.bold(`${icon} ${type}`);
    }

    const timeBox = chalk.gray(`[${timestamp}]`);
    const messageText = chalk.white(message);
    console.log(`${timeBox} ${color} ${chalk.white('│')} ${messageText}`);
}

module.exports = { log };
