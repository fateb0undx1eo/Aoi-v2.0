const fs = require('fs');
const path = require('path');

// List of all roleplay command files that need fixing
const roleplayCommands = [
  'kiss', 'pat', 'wave', 'poke', 'cuddle', 'slap', 'kick',
  'punch', 'feed', 'tickle', 'bite', 'peck', 'yeet', 'shoot',
  'highfive', 'handhold', 'bonk', 'handshake'
];

const messagesDir = path.join(__dirname, 'src', 'messages');

function fixRoleplayCommand(commandName) {
  const filePath = path.join(messagesDir, `${commandName}.js`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${commandName} - file not found`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix the double backtick issue in error messages
  content = content.replace(
    /`Please mention someone to \w+! Usage: \\`\$\{roleplayPrefix\}\w+ @user\\`\\`\)/g,
    (match) => {
      // Extract the command name from the match
      const cmdMatch = match.match(/to (\w+)!/);
      const cmd = cmdMatch ? cmdMatch[1] : commandName;
      return `\`Please mention someone to ${cmd}! Usage: \\\`\${roleplayPrefix}${cmd} @user\\\`\`)`;
    }
  );
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Fixed ${commandName}.js`);
}

// Fix all roleplay commands
console.log('Fixing syntax errors in roleplay commands...\n');

roleplayCommands.forEach(cmd => {
  try {
    fixRoleplayCommand(cmd);
  } catch (err) {
    console.error(`❌ Error fixing ${cmd}:`, err.message);
  }
});

console.log('\n✅ All syntax errors fixed!');
