const crypto = require('crypto');

// Simple authentication middleware
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Basic ')) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Dashboard"');
        return res.status(401).json({ error: 'Authentication required' });
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');

    const validUsername = process.env.DASHBOARD_USERNAME || 'admin';
    const validPassword = process.env.DASHBOARD_PASSWORD || 'admin';

    if (username === validUsername && password === validPassword) {
        next();
    } else {
        res.setHeader('WWW-Authenticate', 'Basic realm="Dashboard"');
        return res.status(401).json({ error: 'Invalid credentials' });
    }
}

// Session-based auth for browser
function sessionAuth(req, res, next) {
    // Check if already authenticated in session
    if (req.session && req.session.authenticated) {
        return next();
    }

    // Check credentials
    const { username, password } = req.body || {};
    const validUsername = process.env.DASHBOARD_USERNAME || 'admin';
    const validPassword = process.env.DASHBOARD_PASSWORD || 'admin';

    if (username === validUsername && password === validPassword) {
        if (req.session) {
            req.session.authenticated = true;
        }
        next();
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
}

module.exports = { authenticate, sessionAuth };
