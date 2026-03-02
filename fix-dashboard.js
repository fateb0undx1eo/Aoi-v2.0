#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔧 Fixing dashboard issues...');

function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  // Change to admin-react directory
  process.chdir(path.join(__dirname, 'admin-react'));
  
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  console.log('🏗️  Building dashboard...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('📁 Copying build files...');
  // Copy build files to admin folder using Node.js
  const distPath = path.join(process.cwd(), 'dist');
  const adminPath = path.join(__dirname, 'admin');
  
  if (fs.existsSync(distPath)) {
    copyDirectory(distPath, adminPath);
    console.log('✅ Build files copied successfully!');
  } else {
    throw new Error('Build directory not found');
  }
  
  console.log('✅ Dashboard fixed and rebuilt successfully!');
  console.log('\n🚀 Changes made:');
  console.log('  • Fixed authentication headers in API calls');
  console.log('  • Added error handling for undefined responses');
  console.log('  • Improved WebSocket connection with auth token');
  console.log('  • Fixed THREE.js deprecation warnings');
  console.log('  • Added WebGL context loss handling');
  console.log('  • Enhanced error handling for HTTP responses');
  
} catch (error) {
  console.error('❌ Error fixing dashboard:', error.message);
  process.exit(1);
}