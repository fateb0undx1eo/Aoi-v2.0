const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, 'src', 'messages');

// Template for roleplay commands
const getCommandTemplate = (name, description, requiresTarget) => `const { EmbedBuilder } = require("discord.js");
const { getRoleplayGIF } = require("../utils/roleplayAPI");
const logger = require("../utils/winstonLogger");

const getRandomColor = () => Math.floor(Math.random() * 0xFFFFFF);

module.exports = {
  name: "${name}",
  description: "${description}",
  usage: "${name}${requiresTarget ? ' <@user>' : ''}",
  category: "roleplay",
  prefixOnly: true,
  requiresTarget: ${requiresTarget},

  async execute(message, args, client) {
    // Delete user's command
    try {
      await message.delete();
    } catch (err) {}

${requiresTarget ? `    const target = message.mentions.users.first();
    
    if (!target) {
      const errorMsg = await message.channel.send(\`Please mention someone to ${name}! Usage: \\\`r!${name} @user\\\`\`);
      setTimeout(() => errorMsg.delete().catch(() => {}), 5000);
      return;
    }

    if (target.id === message.author.id) {
      const errorMsg = await message.channel.send("You can't ${name} yourself!");
      setTimeout(() => errorMsg.delete().catch(() => {}), 5000);
      return;
    }

    if (target.bot) {
      const errorMsg = await message.channel.send("You can't ${name} bots!");
      setTimeout(() => errorMsg.delete().catch(() => {}), 5000);
      return;
    }
` : ''}
    try {
      const gifUrl = await getRoleplayGIF('${name}');

      const embed = new EmbedBuilder()
        .setDescription(\`\${message.author}${requiresTarget ? ` ${name}s \${target}` : ` ${name}s`}\`)
        .setImage(gifUrl)
        .setColor(getRandomColor());

      await message.channel.send({ embeds: [embed] });
      
      logger.command('${name}', message.author.id, message.guild.id, true);
    } catch (err) {
      logger.error("${name.charAt(0).toUpperCase() + name.slice(1)} command error:", err);
      await message.channel.send("Failed to fetch ${name} image.");
    }
  },
};
`;

// Commands that require a target
const targetCommands = [
  { name: 'pat', desc: 'Pat someone!' },
  { name: 'wave', desc: 'Wave at someone!' },
  { name: 'poke', desc: 'Poke someone!' },
  { name: 'cuddle', desc: 'Cuddle with someone!' },
  { name: 'slap', desc: 'Slap someone!' },
  { name: 'kick', desc: 'Kick someone!' },
  { name: 'punch', desc: 'Punch someone!' },
  { name: 'feed', desc: 'Feed someone!' },
  { name: 'tickle', desc: 'Tickle someone!' },
  { name: 'bite', desc: 'Bite someone!' },
  { name: 'peck', desc: 'Peck someone!' },
  { name: 'yeet', desc: 'Yeet someone!' },
  { name: 'shoot', desc: 'Shoot someone!' },
  { name: 'highfive', desc: 'High five someone!' },
  { name: 'handhold', desc: 'Hold hands with someone!' },
  { name: 'bonk', desc: 'Bonk someone!' },
  { name: 'handshake', desc: 'Handshake with someone!' }
];

// Solo commands
const soloCommands = [
  { name: 'cry', desc: 'Cry' },
  { name: 'smile', desc: 'Smile' },
  { name: 'dance', desc: 'Dance' },
  { name: 'happy', desc: 'Be happy' },
  { name: 'blush', desc: 'Blush' },
  { name: 'wink', desc: 'Wink' },
  { name: 'pout', desc: 'Pout' },
  { name: 'think', desc: 'Think' },
  { name: 'nope', desc: 'Nope' },
  { name: 'bored', desc: 'Be bored' },
  { name: 'nod', desc: 'Nod' },
  { name: 'sleep', desc: 'Sleep' },
  { name: 'shrug', desc: 'Shrug' },
  { name: 'laugh', desc: 'Laugh' },
  { name: 'lurk', desc: 'Lurk' },
  { name: 'run', desc: 'Run' },
  { name: 'facepalm', desc: 'Facepalm' },
  { name: 'tableflip', desc: 'Flip a table' },
  { name: 'thumbsup', desc: 'Thumbs up' },
  { name: 'smug', desc: 'Be smug' },
  { name: 'yawn', desc: 'Yawn' },
  { name: 'baka', desc: 'Baka' },
  { name: 'angry', desc: 'Be angry' },
  { name: 'stare', desc: 'Stare' },
  { name: 'nom', desc: 'Nom' }
];

console.log('Updating roleplay commands...\n');

let updated = 0;
let skipped = 0;

// Update target commands
targetCommands.forEach(({ name, desc }) => {
  const filePath = path.join(messagesDir, `${name}.js`);
  if (fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, getCommandTemplate(name, desc, true));
    console.log(`✓ Updated: ${name}.js`);
    updated++;
  } else {
    console.log(`⚠ Skipped: ${name}.js (file not found)`);
    skipped++;
  }
});

// Update solo commands
soloCommands.forEach(({ name, desc }) => {
  const filePath = path.join(messagesDir, `${name}.js`);
  if (fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, getCommandTemplate(name, desc, false));
    console.log(`✓ Updated: ${name}.js`);
    updated++;
  } else {
    console.log(`⚠ Skipped: ${name}.js (file not found)`);
    skipped++;
  }
});

console.log(`\nDone! Updated: ${updated}, Skipped: ${skipped}`);
console.log('\nAll roleplay commands now use:');
console.log('- New waifu.pics API (better quality)');
console.log('- Winston logger');
console.log('- Caching system');
console.log('- Prefix: r!');
console.log('- No emojis in messages');
