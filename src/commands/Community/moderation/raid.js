const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('raid')
        .setDescription('» Advanced raid protection with smart detection')
        .addSubcommand(subcommand =>
            subcommand
                .setName('mode')
                .setDescription('Set raid protection mode')
                .addStringOption(option =>
                    option
                        .setName('level')
                        .setDescription('Protection level')
                        .setRequired(true)
                        .addChoices(
                            { name: '🟢 Off - No protection', value: 'off' },
                            { name: '🟡 Low - Basic verification', value: 'low' },
                            { name: '🟠 Medium - Account age check', value: 'medium' },
                            { name: '🔴 High - Lockdown mode', value: 'high' },
                            { name: '⚫ Maximum - Server locked', value: 'maximum' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Check current raid protection status')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('kick-new')
                .setDescription('Kick all members who joined in last X minutes')
                .addIntegerOption(option =>
                    option
                        .setName('minutes')
                        .setDescription('Time window in minutes')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(60)
                )
        ),

    userPermissions: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.KickMembers, PermissionFlagsBits.ManageGuild],

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const subcommand = interaction.options.getSubcommand();

            switch (subcommand) {
                case 'mode':
                    const level = interaction.options.getString('level');
                    
                    // Apply verification level
                    const verificationLevels = {
                        'off': 0,
                        'low': 1,
                        'medium': 2,
                        'high': 3,
                        'maximum': 4
                    };

                    await interaction.guild.setVerificationLevel(verificationLevels[level]);

                    const modeEmbed = new EmbedBuilder()
                        .setColor(getModeColor(level))
                        .setTitle('🛡️ Raid Protection Updated')
                        .setDescription(getModeDescription(level))
                        .addFields(
                            { name: '📊 Protection Level', value: level.toUpperCase(), inline: true },
                            { name: '👮 Set By', value: interaction.user.tag, inline: true },
                            { name: '⚙️ Verification Level', value: `${verificationLevels[level]}`, inline: true }
                        )
                        .setTimestamp();

                    await interaction.editReply({ embeds: [modeEmbed] });

                    // Log to mod log channel
                    const logChannel = interaction.guild.channels.cache.find(
                        ch => ch.name === 'mod-logs' || ch.name === 'moderation-logs'
                    );

                    if (logChannel) {
                        const logEmbed = new EmbedBuilder()
                            .setColor(getModeColor(level))
                            .setTitle('🛡️ Raid Protection Changed')
                            .addFields(
                                { name: '📊 New Level', value: level.toUpperCase() },
                                { name: '👮 Moderator', value: `${interaction.user.tag} (${interaction.user.id})` }
                            )
                            .setTimestamp();

                        await logChannel.send({ embeds: [logEmbed] });
                    }
                    break;

                case 'status':
                    const currentLevel = interaction.guild.verificationLevel;
                    const levelNames = ['Off', 'Low', 'Medium', 'High', 'Maximum'];
                    
                    const statusEmbed = new EmbedBuilder()
                        .setColor(0x00AAFF)
                        .setTitle('🛡️ Raid Protection Status')
                        .addFields(
                            { name: '📊 Current Level', value: levelNames[currentLevel], inline: true },
                            { name: '👥 Member Count', value: `${interaction.guild.memberCount}`, inline: true },
                            { name: '📅 Server Age', value: `<t:${Math.floor(interaction.guild.createdTimestamp / 1000)}:R>`, inline: true }
                        )
                        .setDescription(getModeDescription(levelNames[currentLevel].toLowerCase()))
                        .setTimestamp();

                    await interaction.editReply({ embeds: [statusEmbed] });
                    break;

                case 'kick-new':
                    const minutes = interaction.options.getInteger('minutes');
                    const timeThreshold = Date.now() - (minutes * 60 * 1000);

                    await interaction.editReply('🔄 Scanning for recent joins...');

                    const members = await interaction.guild.members.fetch();
                    const recentMembers = members.filter(member => 
                        member.joinedTimestamp > timeThreshold && 
                        !member.user.bot &&
                        member.id !== interaction.guild.ownerId
                    );

                    if (recentMembers.size === 0) {
                        return interaction.editReply('✅ No recent members found to kick.');
                    }

                    let kicked = 0;
                    let failed = 0;

                    for (const [, member] of recentMembers) {
                        try {
                            await member.kick(`Raid protection: Joined within ${minutes} minutes | Executed by ${interaction.user.tag}`);
                            kicked++;
                        } catch (err) {
                            failed++;
                        }
                    }

                    const kickEmbed = new EmbedBuilder()
                        .setColor(0xFF6600)
                        .setTitle('🛡️ Raid Protection: Mass Kick')
                        .addFields(
                            { name: '✅ Kicked', value: `${kicked}`, inline: true },
                            { name: '❌ Failed', value: `${failed}`, inline: true },
                            { name: '⏰ Time Window', value: `${minutes} minutes`, inline: true },
                            { name: '👮 Moderator', value: interaction.user.tag }
                        )
                        .setTimestamp();

                    await interaction.editReply({ content: '', embeds: [kickEmbed] });

                    // Log to mod log channel
                    const kickLogChannel = interaction.guild.channels.cache.find(
                        ch => ch.name === 'mod-logs' || ch.name === 'moderation-logs'
                    );

                    if (kickLogChannel) {
                        const kickLogEmbed = new EmbedBuilder()
                            .setColor(0xFF0000)
                            .setTitle('🛡️ Mass Kick Executed')
                            .addFields(
                                { name: '✅ Kicked', value: `${kicked}` },
                                { name: '❌ Failed', value: `${failed}` },
                                { name: '⏰ Time Window', value: `${minutes} minutes` },
                                { name: '👮 Moderator', value: `${interaction.user.tag} (${interaction.user.id})` }
                            )
                            .setTimestamp();

                        await kickLogChannel.send({ embeds: [kickLogEmbed] });
                    }
                    break;
            }

        } catch (error) {
            console.error('Raid command error:', error);
            await interaction.editReply('❌ Failed to execute raid protection. Please check my permissions and try again.');
        }
    }
};

function getModeColor(level) {
    const colors = {
        'off': 0x808080,
        'low': 0xFFFF00,
        'medium': 0xFFA500,
        'high': 0xFF0000,
        'maximum': 0x000000
    };
    return colors[level] || 0x808080;
}

function getModeDescription(level) {
    const descriptions = {
        'off': 'No raid protection active. Server is open to all.',
        'low': 'Basic verification required. Members must have a verified email.',
        'medium': 'Account age check. Members must be registered for 5+ minutes.',
        'high': 'Lockdown mode. Members must be registered for 10+ minutes and have verified email.',
        'maximum': 'Maximum security. Members must be in the server for 10+ minutes before they can send messages.'
    };
    return descriptions[level] || 'Unknown protection level';
}
