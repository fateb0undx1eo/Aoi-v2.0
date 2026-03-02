const ChessWebAPI = require("chess-web-api");

const chessAPI = new ChessWebAPI();

async function getProfile(username) {
    try {
        const response = await chessAPI.getPlayer(username);
        return response.body;
    } catch (err) {
        console.error("Profile Error:", err.message);
        return null;
    }
}

async function getStats(username) {
    try {
        const response = await chessAPI.getPlayerStats(username);
        return response.body;
    } catch (err) {
        console.error("Stats Error:", err.message);
        return null;
    }
}

async function getLeaderboard(mode) {
    try {
        const response = await fetch("https://api.chess.com/pub/leaderboards");
        const data = await response.json();
        return data[mode] || null;
    } catch (err) {
        console.error("Leaderboard Error:", err.message);
        return null;
    }
}

module.exports = {
    getProfile,
    getStats,
    getLeaderboard
};
