const fs = require('fs');
const path = require('path');

const errorsDir = path.join(process.cwd(), 'errors');

function ensureErrorDirectoryExists() {
    if (!fs.existsSync(errorsDir)) {
        fs.mkdirSync(errorsDir, { recursive: true });
    }
}

function logErrorToFile(error) {
    try {
        const discobasePath = path.join(process.cwd(), 'discobase.json');
        if (fs.existsSync(discobasePath)) {
            const discobaseConfig = JSON.parse(fs.readFileSync(discobasePath, 'utf8'));
            if (discobaseConfig.errorLogging?.enabled === false) {
                return;
            }
        }
        
        ensureErrorDirectoryExists();

        const errorMessage = typeof error === 'string' 
            ? error 
            : `${error.name}: ${error.message}\n${error.stack}`;
        
        const fileName = `${new Date().toISOString().replace(/:/g, '-')}.txt`;
        const filePath = path.join(errorsDir, fileName);

        fs.writeFileSync(filePath, errorMessage, 'utf8');
    } catch (err) {
        // Silent fail to prevent error logging from causing more issues
    }
}

module.exports = { ensureErrorDirectoryExists, logErrorToFile };
