const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const { getProfile, getStats, getLeaderboard } = require("../../functions/handlers/chessService");

// ✅ Your Custom Emojis
const EMOJIS = {
    rapid: "<:rapid:1471929632256164067>",
    blitz: "<:blitz:1471929575138267266>",
    bullet: "<:bullet:1471929458565845062>",
    chess: "<:chess:1471929379989885111>",
    default: "<:brilliant:1471929526320631960>"
};

const getFlagEmoji = (countryUrl) => {
    if (!countryUrl) return "🌍";
    const code = countryUrl.split("/").pop();
    if (!code || code.length !== 2) return "🌍";
    return String.fromCodePoint(...[...code.toUpperCase()].map(c => 127397 + c.charCodeAt()));
};

module.exports = {
    disabled: false,

    data: new SlashCommandBuilder()
        .setName("chess")
        .setDescription("Chess.com profile commands")
        .setDMPermission(false) // Server only

        .addSubcommand(sub =>
            sub.setName("profile")
                .setDescription("View a player's profile")
                .addStringOption(option =>
                    option.setName("username")
                        .setDescription("Chess.com username")
                        .setRequired(true)
                        .setAutocomplete(true) // Enable autocomplete
                )
        )

        .addSubcommand(sub =>
            sub.setName("compare")
                .setDescription("Compare two players")
                .addStringOption(option =>
                    option.setName("user1")
                        .setDescription("First username")
                        .setRequired(true)
                        .setAutocomplete(true) // Enable autocomplete
                )
                .addStringOption(option =>
                    option.setName("user2")
                        .setDescription("Second username")
                        .setRequired(true)
                        .setAutocomplete(true) // Enable autocomplete
                )
                .addStringOption(option =>
                    option.setName("mode")
                        .setDescription("Game mode")
                        .addChoices(
                            { name: "Rapid", value: "rapid" },
                            { name: "Blitz", value: "blitz" },
                            { name: "Bullet", value: "bullet" }
                        )
                )
        )

        // ✅ FIXED LEADERBOARD
        .addSubcommand(sub =>
            sub.setName("leaderboard")
                .setDescription("View official Chess.com leaderboard")
        ),

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused().toLowerCase();
        
        // Popular chess players for suggestions
        const popularPlayers = [
            { name: 'Magnus Carlsen (2847)', value: 'magnuscarlsen' },
            { name: 'Hikaru Nakamura (2835)', value: 'hikaru' },
            { name: 'Fabiano Caruana (2820)', value: 'fabianocaruana' },
            { name: 'Ding Liren (2799)', value: 'dingliren' },
            { name: 'Ian Nepomniachtchi (2795)', value: 'lachesisq' },
            { name: 'Alireza Firouzja (2785)', value: 'firouzja2003' },
            { name: 'Wesley So (2770)', value: 'gmwso' },
            { name: 'Levon Aronian (2765)', value: 'levon' },
            { name: 'Anish Giri (2760)', value: 'anishgiri' },
            { name: 'Maxime Vachier-Lagrave (2755)', value: 'mvl' }
        ];

        // Filter based on input
        const filtered = popularPlayers.filter(player =>
            player.name.toLowerCase().includes(focusedValue) ||
            player.value.toLowerCase().includes(focusedValue)
        );

        // If user typed something specific, add it as first option
        if (focusedValue.length >= 3) {
            filtered.unshift({
                name: `Search: ${focusedValue}`,
                value: focusedValue
            });
        }

        await interaction.respond(
            filtered.slice(0, 25).map(player => ({
                name: player.name,
                value: player.value
            }))
        );
    },

    async execute(interaction) {
        try {
            const subcommand = interaction.options.getSubcommand();

            // ================= PROFILE =================
            if (subcommand === "profile") {
                await interaction.deferReply();

                const username = interaction.options.getString("username");

                const profile = await getProfile(username);
                const stats = await getStats(username);

                if (!profile || !stats)
                    return interaction.editReply({ content: "User not found." });

                const flag = getFlagEmoji(profile.country);

                const embed = new EmbedBuilder()
                    .setColor("#2b2d31")
                    .setTitle(`${EMOJIS.chess} ${flag} ${profile.username}`)
                    .setURL(`https://www.chess.com/member/${profile.username}`)
                    .addFields(
                        {
                            name: `${EMOJIS.rapid} Rapid`,
                            value: stats.chess_rapid?.last?.rating?.toString() || "Unrated",
                            inline: true
                        },
                        {
                            name: `${EMOJIS.blitz} Blitz`,
                            value: stats.chess_blitz?.last?.rating?.toString() || "Unrated",
                            inline: true
                        },
                        {
                            name: `${EMOJIS.bullet} Bullet`,
                            value: stats.chess_bullet?.last?.rating?.toString() || "Unrated",
                            inline: true
                        }
                    );

                return interaction.editReply({ embeds: [embed] });
            }

            // ================= COMPARE =================
            if (subcommand === "compare") {
                await interaction.deferReply();

                const user1 = interaction.options.getString("user1");
                const user2 = interaction.options.getString("user2");
                const mode = interaction.options.getString("mode");

                const stats1 = await getStats(user1);
                const stats2 = await getStats(user2);

                if (!stats1 || !stats2)
                    return interaction.editReply({ content: "One or both users not found." });

                const modes = {
                    rapid: "chess_rapid",
                    blitz: "chess_blitz",
                    bullet: "chess_bullet"
                };

                const embed = new EmbedBuilder()
                    .setColor("#2b2d31")
                    .setTitle(`${EMOJIS.chess} ${user1} vs ${user2}`);

                const selectedModes = mode ? [mode] : Object.keys(modes);

                selectedModes.forEach(m => {
                    const key = modes[m];
                    const rating1 = stats1[key]?.last?.rating || "Unrated";
                    const rating2 = stats2[key]?.last?.rating || "Unrated";

                    embed.addFields({
                        name: `${EMOJIS[m]} ${m.toUpperCase()}`,
                        value: `**${user1}**: ${rating1}\n**${user2}**: ${rating2}`,
                        inline: false
                    });
                });

                return interaction.editReply({ embeds: [embed] });
            }

            // ================= NEW LEADERBOARD =================
            if (subcommand === "leaderboard") {

                const row = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId("chess_leaderboard_mode")
                        .setPlaceholder("Select a mode")
                        .addOptions([
                            { label: "Rapid", value: "live_rapid", emoji: "1471929632256164067" },
                            { label: "Blitz", value: "live_blitz", emoji: "1471929575138267266" },
                            { label: "Bullet", value: "live_bullet", emoji: "1471929458565845062" }
                        ])
                );

                return interaction.reply({
                    content: "Choose leaderboard mode:",
                    components: [row]
                });
            }

        } catch (error) {
            console.error("Chess command error:", error);

            if (interaction.deferred || interaction.replied) {
                return interaction.editReply({ content: "Something went wrong." });
            } else {
                return interaction.reply({ content: "Something went wrong.", ephemeral: true });
            }
        }
    }
};
