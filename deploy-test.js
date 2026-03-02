#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Testing deployment build...');

try {
  // Change to admin-react directory
  process.chdir(path.join(__dirname, 'admin-react'));
  
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  console.log('🏗️  Building for production...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('📊 Analyzing build...');
  const distPath = path.join(process.cwd(), 'dist');
  
  if (fs.existsSync(distPath)) {
    const files = fs.readdirSync(distPath, { recursive: true });
    console.log('\n📁 Build output:');
    files.forEach(file => {
      const filePath = path.join(distPath, file);
      const stats = fs.statSync(filePath);
      if (stats.isFile()) {
        const size = (stats.size / 1024).toFixed(2);
        console.log(`  ${file} (${size} KB)`);
      }
    });
    
    // Check if index.html exists and contains the app
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      const indexContent = fs.readFileSync(indexPath, 'utf8');
      if (indexContent.includes('root') && indexContent.includes('.js')) {
        console.log('\n✅ Build successful! Ready for deployment.');
        console.log('\n🌐 Next steps:');
        console.log('  1. Deploy to Netlify: Drag the dist/ folder to netlify.com');
        console.log('  2. Or use Netlify CLI: netlify deploy --prod --dir=dist');
        console.log('  3. Update ALLOWED_ORIGINS in Render with your Netlify URL');
      } else {
        console.log('⚠️  Warning: index.html may be incomplete');
      }
    } else {
      console.log('❌ Error: index.html not found in build output');
    }
  } else {
    throw new Error('Build directory not found');
  }
  
} catch (error) {
  console.error('❌ Deployment test failed:', error.message);
  process.exit(1);
}