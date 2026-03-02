#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Pre-deployment checklist...\n');

const checks = [];

// Check if .env exists and has required variables
const envPath = '.env';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'BOT_TOKEN', 'BOT_ID', 'MONGO_URI', 'DASHBOARD_USERNAME', 
    'DASHBOARD_PASSWORD', 'SESSION_SECRET'
  ];
  
  const missingVars = requiredVars.filter(varName => 
    !envContent.includes(`${varName}=`) || envContent.includes(`${varName}=your_`)
  );
  
  if (missingVars.length === 0) {
    checks.push({ name: 'Environment variables', status: '✅', note: 'All required variables set' });
  } else {
    checks.push({ name: 'Environment variables', status: '❌', note: `Missing: ${missingVars.join(', ')}` });
  }
} else {
  checks.push({ name: 'Environment variables', status: '❌', note: '.env file not found' });
}

// Check if production env is configured
const prodEnvPath = 'admin-react/.env.production';
if (fs.existsSync(prodEnvPath)) {
  const prodEnvContent = fs.readFileSync(prodEnvPath, 'utf8');
  if (prodEnvContent.includes('VITE_API_URL=https://')) {
    checks.push({ name: 'Production API URL', status: '✅', note: 'Configured for production' });
  } else {
    checks.push({ name: 'Production API URL', status: '❌', note: 'VITE_API_URL not set properly' });
  }
} else {
  checks.push({ name: 'Production API URL', status: '❌', note: '.env.production not found' });
}

// Check if package.json has correct scripts
const packagePath = 'package.json';
if (fs.existsSync(packagePath)) {
  const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  if (packageContent.scripts && packageContent.scripts.start) {
    checks.push({ name: 'Start script', status: '✅', note: 'npm start configured' });
  } else {
    checks.push({ name: 'Start script', status: '❌', note: 'No start script in package.json' });
  }
} else {
  checks.push({ name: 'Package.json', status: '❌', note: 'package.json not found' });
}

// Check if render.yaml exists
if (fs.existsSync('render.yaml')) {
  checks.push({ name: 'Render config', status: '✅', note: 'render.yaml found' });
} else {
  checks.push({ name: 'Render config', status: '⚠️', note: 'render.yaml not found (manual setup needed)' });
}

// Check if netlify config exists
if (fs.existsSync('admin-react/netlify.toml')) {
  checks.push({ name: 'Netlify config', status: '✅', note: 'netlify.toml configured' });
} else {
  checks.push({ name: 'Netlify config', status: '⚠️', note: 'netlify.toml not found' });
}

// Check if _redirects exists
if (fs.existsSync('admin-react/public/_redirects')) {
  checks.push({ name: 'SPA redirects', status: '✅', note: '_redirects file configured' });
} else {
  checks.push({ name: 'SPA redirects', status: '❌', note: '_redirects file missing' });
}

// Display results
console.log('📋 Deployment Readiness Report:\n');
checks.forEach(check => {
  console.log(`${check.status} ${check.name}: ${check.note}`);
});

const failedChecks = checks.filter(check => check.status === '❌').length;
const warningChecks = checks.filter(check => check.status === '⚠️').length;

console.log('\n' + '='.repeat(50));

if (failedChecks === 0 && warningChecks === 0) {
  console.log('🎉 All checks passed! Ready for deployment.');
} else if (failedChecks === 0) {
  console.log(`⚠️  ${warningChecks} warning(s). Deployment possible but review warnings.`);
} else {
  console.log(`❌ ${failedChecks} critical issue(s) found. Fix before deploying.`);
}

console.log('\n🚀 Deployment commands:');
console.log('  Test build: node deploy-test.js');
console.log('  Deploy to Render: git push (if connected to GitHub)');
console.log('  Deploy to Netlify: netlify deploy --prod --dir=admin-react/dist');