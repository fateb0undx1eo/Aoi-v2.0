# Render Deployment Guide - Quick Start

## 🚀 Deploy in 5 Minutes

### Step 1: Create Render Web Service
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `aoi-discord-bot` (or your choice)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free or Starter

### Step 2: Add Environment Variables
Click "Environment" tab and add these variables:

#### Required Variables
```bash
BOT_TOKEN=your_discord_bot_token_here
BOT_ID=your_bot_application_id_here
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=your_secure_password_here
SESSION_SECRET=generate_random_32_char_string_here
NODE_ENV=production
```

#### Optional Variables
```bash
DEVELOPER_GUILD_IDS=guild_id_1,guild_id_2
BOT_OWNER_ID=your_discord_user_id
ALLOWED_ORIGINS=https://your-dashboard.netlify.app
PORT=3000
```

### Step 3: Deploy
1. Click "Create Web Service"
2. Wait for build to complete (2-3 minutes)
3. Check logs for successful startup

---

## 📋 Pre-Deployment Checklist

### MongoDB Setup
- [ ] MongoDB Atlas cluster created
- [ ] Database user created with read/write permissions
- [ ] Network access configured (allow all IPs: `0.0.0.0/0`)
- [ ] Connection string copied (format: `mongodb+srv://...`)

### Discord Bot Setup
- [ ] Bot created in Discord Developer Portal
- [ ] Bot token copied
- [ ] Application ID copied
- [ ] Bot invited to your Discord server(s)
- [ ] Required intents enabled:
  - Guilds
  - Guild Members
  - Guild Messages
  - Message Content
  - Guild Presences (optional)

### Dashboard Setup
- [ ] Admin username decided
- [ ] Strong password generated
- [ ] Session secret generated (use: `openssl rand -base64 32`)
- [ ] Dashboard deployed on Netlify (if using)
- [ ] Dashboard URL added to ALLOWED_ORIGINS

---

## 🔍 Verify Deployment

### Check Logs
After deployment, you should see:
```
✓ SUCCESS │ Loaded 75 slash commands
✓ SUCCESS │ Successfully reloaded global commands!
ℹ INFO │ Logged in as YourBot#1234
ℹ INFO │ Connected to MongoDB
[Dashboard] MongoDB session store initialized
[Dashboard] Socket.IO initialized
[Dashboard] API routes registered
```

### Test Bot
1. Go to your Discord server
2. Type `/botconfig view` - should show bot configuration
3. Try a roleplay command: `!hug @user`
4. Test autopost: `/autopost`

### Test Dashboard
1. Open your dashboard URL
2. Login with credentials
3. Check bot statistics
4. Try updating bot presence

---

## 🐛 Common Issues & Solutions

### Issue: Bot Not Starting
**Symptoms**: Logs show "Invalid token" or connection errors

**Solutions**:
1. Verify `BOT_TOKEN` is correct (no extra spaces)
2. Check bot token hasn't been regenerated
3. Ensure `MONGO_URI` is accessible
4. Verify all required env vars are set

### Issue: Commands Not Loading
**Symptoms**: "Failed to load command" errors

**Solutions**:
1. Check `BOT_ID` matches your application ID
2. Verify bot has proper permissions in Discord
3. Check for syntax errors in logs
4. Ensure all dependencies installed

### Issue: MongoDB Connection Failed
**Symptoms**: "MongoServerError" or connection timeout

**Solutions**:
1. Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0`
2. Check database user has correct permissions
3. Verify connection string format
4. Test connection string locally first

### Issue: Session Store Not Working
**Symptoms**: Dashboard login doesn't persist

**Solutions**:
1. Verify `SESSION_SECRET` is set
2. Check `MONGO_URI` is accessible
3. Ensure `connect-mongo` is installed
4. Check session cookie settings

### Issue: Dashboard CORS Errors
**Symptoms**: "Not allowed by CORS" in browser console

**Solutions**:
1. Add dashboard URL to `ALLOWED_ORIGINS`
2. Verify URL format (no trailing slash)
3. Check CORS configuration in `admin/dashboard.js`
4. Clear browser cache and cookies

---

## 📊 Monitoring

### Render Dashboard
- Check "Logs" tab for real-time output
- Monitor "Metrics" for CPU/memory usage
- Set up "Alerts" for downtime notifications

### Health Checks
Add this endpoint to your bot (optional):
```javascript
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        bot: client.isReady() ? 'ready' : 'not ready'
    });
});
```

---

## 🔄 Updates & Maintenance

### Deploy Updates
1. Push changes to GitHub
2. Render auto-deploys from main branch
3. Monitor logs during deployment
4. Verify bot restarts successfully

### Manual Restart
1. Go to Render dashboard
2. Click "Manual Deploy" → "Clear build cache & deploy"
3. Or use "Restart" button for quick restart

### Rollback
1. Go to "Events" tab
2. Find previous successful deploy
3. Click "Rollback to this version"

---

## 💡 Pro Tips

### Performance
- Use Render's Starter plan for better performance
- Enable auto-scaling if traffic increases
- Monitor memory usage regularly

### Security
- Rotate `SESSION_SECRET` periodically
- Use strong passwords for dashboard
- Keep dependencies updated
- Monitor error logs for suspicious activity

### Reliability
- Set up health check endpoint
- Configure auto-restart on failure
- Use MongoDB Atlas M10+ for production
- Enable backups in MongoDB Atlas

---

## 📞 Support

### Resources
- [Render Documentation](https://render.com/docs)
- [Discord.js Guide](https://discordjs.guide/)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)

### Troubleshooting
1. Check Render logs first
2. Verify environment variables
3. Test MongoDB connection
4. Check Discord bot permissions
5. Review error stack traces

---

## ✅ Post-Deployment Checklist

- [ ] Bot is online in Discord
- [ ] All commands loading (75 total)
- [ ] MongoDB connected
- [ ] Session store working
- [ ] Dashboard accessible
- [ ] No error warnings in logs
- [ ] Test major features
- [ ] Set up monitoring alerts
- [ ] Document any issues

---

**Deployment Time**: ~5 minutes  
**First-Time Setup**: ~15 minutes  
**Difficulty**: Easy

🎉 **You're ready to deploy!**
