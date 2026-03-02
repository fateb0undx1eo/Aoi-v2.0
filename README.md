# Aoi v2.0

**Advanced Discord Bot with Admin Dashboard**

A powerful Discord bot built with Discord.js v14, featuring a modern admin dashboard, moderation tools, fun commands, and more.

## 🚀 Features

- **Slash Commands & Prefix Commands** - Support for both modern and traditional command types
- **Admin Dashboard** - Real-time web dashboard for bot management
- **Moderation Tools** - Ban, kick, warn, timeout, and more
- **Fun Commands** - Meme generation, roleplay commands, and image manipulation
- **Auto Responder** - Customizable automatic responses
- **MongoDB Integration** - Database support for persistent data
- **Hot Reload** - Changes apply instantly without restart

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/fateb0undx1eo/Aoi-v2.0.git
cd Aoi-v2.0
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your bot token and other settings.

4. Start the bot:
```bash
npm start
```

## 🔧 Configuration

Configuration is managed through the `.env` file:

| Variable | Description |
|----------|-------------|
| `BOT_TOKEN` | Your Discord bot token |
| `BOT_ID` | Your Discord bot ID |
| `BOT_OWNER_ID` | Bot owner's user ID |
| `MONGO_URI` | MongoDB connection string |
| `DEFAULT_PREFIX` | Default command prefix |

## 📊 Admin Dashboard

The bot includes a built-in admin dashboard accessible via web browser.

To set up the dashboard:
```bash
npm run setup-dashboard
```

To build the dashboard for production:
```bash
npm run build-dashboard
```

## 🛠️ Commands

### Moderation
- `/ban` - Ban a user from the server
- `/kick` - Kick a user from the server
- `/warn` - Warn a user
- `/timeout` - Timeout a user
- `/purge` - Bulk delete messages
- And more...

### Fun
- `/meme` - Generate random memes
- Various image manipulation commands
- Roleplay commands (hug, kiss, slap, etc.)

### Utility
- `/ping` - Check bot latency
- `/autoresponder` - Set up automatic responses

## 📜 License

Apache-2.0

## 🔗 Links

- **GitHub:** [fateb0undx1eo/Aoi-v2.0](https://github.com/fateb0undx1eo/Aoi-v2.0)
