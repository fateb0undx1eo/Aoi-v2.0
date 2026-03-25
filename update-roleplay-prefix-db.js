const fs = require('fs');
const path = require('path');

// List of all roleplay command files
const roleplayCommands = [
  'hug', 'kiss', 'pat', 'wave', 'poke', 'cuddle', 'slap', 'kick',
  'punch', 'feed', 'tickle', 'bite', 'peck', 'yeet', 'shoot',
  'highfive', 'handhold', 'bonk', 'handshake', 'cry', 'smile',
  'dance', 'happy', 'blush', 'wink', 'pout', 'think', 'nope',
  'bored', 'nod', 'sleep', 'shrug', 'laugh', 'lurk', 'run',
  'facepalm', 'tableflip', 'thumbsup', 'smug', 'yawn', 'baka',
  'angry', 'stare', 'nom', 'waifu', 'husbando'
];

const messagesDir = path.join(__dirname, 'src', 'messages');

// Commands that require target
const targetCommands = [
  'hug', 'kiss', 'pat', 'wave', 'poke', 'cuddle', 'slap', 'kick',
  'punch', 'feed', 'tickle', 'bite', 'peck', 'yeet', 'shoot',
  'highfive', 'handhold', 'bonk', 'handshake'
];

// Solo commands
const soloCommands = [
  'cry', 'smile', 'dance', 'happy', 'blush', 'wink', 'pout', 'think',
  'nope', 'bored', 'nod', 'sleep', 'shrug', 'laugh', 'lurk', 'run',
  'facepalm', 'tableflip', 'thumbsup', 'smug', 'yawn', 'baka',
  'angry', 'stare', 'nom'
];

function updateRoleplayCommand(commandName) {
  const filePath = path.join(messagesDir, `${commandName}.js`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${commandName} - file not found`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Add import for prefixHelper if not present
  if (!content.includes('getRoleplayPrefix')) {
    content = content.replace(
      'const { getRoleplayGIF } = require("../utils/roleplayAPI");',
      'const { getRoleplayGIF } = require("../utils/roleplayAPI");\nconst { getRoleplayPrefix } = require("../utils/prefixHelper");'
    );
  }
  
  // Update error messages that have hardcoded r! prefix
  // Pattern 1: Usage messages with r!commandName
  content = content.replace(
    /`Please mention someone to \w+! Usage: \\`r!(\w+) @user\\`\`/g,
    (match, cmd) => {
      return '`Please mention someone to ' + cmd + '! Usage: \\`${roleplayPrefix}' + cmd + ' @user\\`\\`';
    }
  );
  
  // For commands that require target, update the execute function
  if (targetCommands.includes(commandName)) {
    // Replace the error message section
    content = content.replace(
      /if \(!target\) \{\s+const errorMsg = await message\.channel\.send\(`Please mention someone to \w+! Usage: \\`\$\{roleplayPrefix\}\w+ @user\\`\`\);/g,
      (match) => {
        return `const roleplayPrefix = await getRoleplayPrefix(message.guild?.id);\n    \n    if (!target) {\n      const errorMsg = await message.channel.send(\`Please mention someone to ${commandName}! Usage: \\\`\${roleplayPrefix}${commandName} @user\\\`\`);`;
      }
    );
    
    // If the above didn't match, try the original pattern
    if (!content.includes('getRoleplayPrefix(message.guild?.id)')) {
      content = content.replace(
        /const target = message\.mentions\.users\.first\(\);\s+if \(!target\) \{/,
        `const target = message.mentions.users.first();\n    const roleplayPrefix = await getRoleplayPrefix(message.guild?.id);\n    \n    if (!target) {`
      );
    }
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Updated ${commandName}.js`);
}

// Update all roleplay commands
console.log('Updating roleplay commands to use database prefix...\n');

roleplayCommands.forEach(cmd => {
  try {
    updateRoleplayCommand(cmd);
  } catch (err) {
    console.error(`❌ Error updating ${cmd}:`, err.message);
  }
});

console.log('\n✅ All roleplay commands updated!');
console.log('\nNext steps:');
console.log('1. Test the commands with different prefixes');
console.log('2. Create a dashboard UI or command to set roleplayPrefix per server');
console.log('3. Run migration to add roleplayPrefix field to existing guild documents');
