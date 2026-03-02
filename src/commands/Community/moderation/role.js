const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('role')
        .setDescription('» Advanced role management system')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a role to a user')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('User to add role to')
                        .setRequired(true)
                )
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('Role to add')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('reason')
                        .setDescription('Reason for adding role')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a role from a user')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('User to remove role from')
                        .setRequired(true)
                )
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('Role to remove')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('reason')
                        .setDescription('Reason for removing role')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('addall')
                .setDescription('Add a role to all members')
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('Role to add to all members')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('reason')
                        .setDescription('Reason for mass role add')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('removeall')
                .setDescription('Remove a role from all members')
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('Role to remove from all members')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('reason')
                        .setDescription('Reason for mass role removal')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('Get detailed information about a role')
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('Role to get information about')
                        .setRequired(true)
                )
        ),

    userPermissions: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.ManageRoles],

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const subcommand = interaction.options.getSubcommand();

            switch (subcommand) {
                case 'add':
                    await handleAddRole(interaction);
                    break;
                case 'remove':
                    await handleRemoveRole(interaction);
                    break;
                case 'addall':
                    await handleAddAllRole(interaction);
                    break;
                case 'removeall':
                    await handleRemoveAllRole(interaction);
                    break;
                case 'info':
                    await handleRoleInfo(interaction);
                    break;
            }

        } catch (error) {
            console.error('Role command error:', error);
            await interaction.editReply('❌ Failed to execute role command. Please check my permissions and try again.');
        }
    }
};

async function handleAddRole(interaction) {
    const targetUser = interaction.options.getUser('user');
    const role = interaction.options.getRole('role');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (!member) {
        return interaction.editReply('❌ User is not in this server!');
    }

    // Role hierarchy check
    if (role.position >= interaction.guild.members.me.roles.highest.position) {
        return interaction.editReply('❌ I cannot manage this role as it is higher than or equal to my highest role!');
    }

    if (role.position >= interaction.member.roles.highest.position) {
        return interaction.editReply('❌ You cannot manage this role as it is higher than or equal to your highest role!');
    }

    if (member.roles.cache.has(role.id)) {
        return interaction.editReply('❌ User already has this role!');
    }

    await member.roles.add(role, `${reason} | Added by ${interaction.user.tag}`);

    const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('✅ Role Added')
        .addFields(
            { name: '👤 User', value: `${targetUser.tag}`, inline: true },
            { name: '🎭 Role', value: `${role.name}`, inline: true },
            { name: '👮 Moderator', value: interaction.user.tag, inline: true },
            { name: '📋 Reason', value: reason }
        )
        .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
}

async function handleRemoveRole(interaction) {
    const targetUser = interaction.options.getUser('user');
    const role = interaction.options.getRole('role');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (!member) {
        return interaction.editReply('❌ User is not in this server!');
    }

    if (role.position >= interaction.guild.members.me.roles.highest.position) {
        return interaction.editReply('❌ I cannot manage this role as it is higher than or equal to my highest role!');
    }

    if (role.position >= interaction.member.roles.highest.position) {
        return interaction.editReply('❌ You cannot manage this role as it is higher than or equal to your highest role!');
    }

    if (!member.roles.cache.has(role.id)) {
        return interaction.editReply('❌ User does not have this role!');
    }

    await member.roles.remove(role, `${reason} | Removed by ${interaction.user.tag}`);

    const embed = new EmbedBuilder()
        .setColor(0xFF6600)
        .setTitle('✅ Role Removed')
        .addFields(
            { name: '👤 User', value: `${targetUser.tag}`, inline: true },
            { name: '🎭 Role', value: `${role.name}`, inline: true },
            { name: '👮 Moderator', value: interaction.user.tag, inline: true },
            { name: '📋 Reason', value: reason }
        )
        .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
}

async function handleAddAllRole(interaction) {
    const role = interaction.options.getRole('role');
    const reason = interaction.options.getString('reason') || 'Mass role assignment';

    if (role.position >= interaction.guild.members.me.roles.highest.position) {
        return interaction.editReply('❌ I cannot manage this role as it is higher than or equal to my highest role!');
    }

    await interaction.editReply('🔄 Adding role to all members... This may take a while.');

    const members = await interaction.guild.members.fetch();
    let added = 0;
    let skipped = 0;

    for (const [, member] of members) {
        if (member.roles.cache.has(role.id) || member.user.bot) {
            skipped++;
            continue;
        }

        try {
            await member.roles.add(role, `${reason} | Mass add by ${interaction.user.tag}`);
            added++;
        } catch (err) {
            skipped++;
        }
    }

    const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('✅ Mass Role Assignment Complete')
        .addFields(
            { name: '🎭 Role', value: role.name, inline: true },
            { name: '✅ Added', value: `${added}`, inline: true },
            { name: '⏭️ Skipped', value: `${skipped}`, inline: true },
            { name: '👮 Moderator', value: interaction.user.tag },
            { name: '📋 Reason', value: reason }
        )
        .setTimestamp();

    await interaction.editReply({ content: '', embeds: [embed] });
}

async function handleRemoveAllRole(interaction) {
    const role = interaction.options.getRole('role');
    const reason = interaction.options.getString('reason') || 'Mass role removal';

    if (role.position >= interaction.guild.members.me.roles.highest.position) {
        return interaction.editReply('❌ I cannot manage this role as it is higher than or equal to my highest role!');
    }

    await interaction.editReply('🔄 Removing role from all members... This may take a while.');

    const members = await interaction.guild.members.fetch();
    let removed = 0;
    let skipped = 0;

    for (const [, member] of members) {
        if (!member.roles.cache.has(role.id)) {
            skipped++;
            continue;
        }

        try {
            await member.roles.remove(role, `${reason} | Mass remove by ${interaction.user.tag}`);
            removed++;
        } catch (err) {
            skipped++;
        }
    }

    const embed = new EmbedBuilder()
        .setColor(0xFF6600)
        .setTitle('✅ Mass Role Removal Complete')
        .addFields(
            { name: '🎭 Role', value: role.name, inline: true },
            { name: '✅ Removed', value: `${removed}`, inline: true },
            { name: '⏭️ Skipped', value: `${skipped}`, inline: true },
            { name: '👮 Moderator', value: interaction.user.tag },
            { name: '📋 Reason', value: reason }
        )
        .setTimestamp();

    await interaction.editReply({ content: '', embeds: [embed] });
}

async function handleRoleInfo(interaction) {
    const role = interaction.options.getRole('role');

    const members = await interaction.guild.members.fetch();
    const memberCount = members.filter(m => m.roles.cache.has(role.id)).size;

    const permissions = role.permissions.toArray();
    const keyPerms = permissions.filter(perm => 
        ['Administrator', 'ManageGuild', 'ManageRoles', 'ManageChannels', 'BanMembers', 'KickMembers', 'ManageMessages'].includes(perm)
    );

    const embed = new EmbedBuilder()
        .setColor(role.color || 0x99AAB5)
        .setTitle(`🎭 Role Information: ${role.name}`)
        .addFields(
            { name: '🆔 Role ID', value: role.id, inline: true },
            { name: '🎨 Color', value: role.hexColor, inline: true },
            { name: '👥 Members', value: `${memberCount}`, inline: true },
            { name: '📊 Position', value: `${role.position}`, inline: true },
            { name: '🔔 Mentionable', value: role.mentionable ? 'Yes' : 'No', inline: true },
            { name: '🎯 Hoisted', value: role.hoist ? 'Yes' : 'No', inline: true },
            { name: '🤖 Managed', value: role.managed ? 'Yes (Bot/Integration)' : 'No', inline: true },
            { name: '📅 Created', value: `<t:${Math.floor(role.createdTimestamp / 1000)}:R>`, inline: true }
        )
        .setTimestamp();

    if (keyPerms.length > 0) {
        embed.addFields({
            name: '🔑 Key Permissions',
            value: keyPerms.join(', ')
        });
    }

    if (permissions.length > 0) {
        embed.setFooter({ text: `Total Permissions: ${permissions.length}` });
    }

    await interaction.editReply({ embeds: [embed] });
}
