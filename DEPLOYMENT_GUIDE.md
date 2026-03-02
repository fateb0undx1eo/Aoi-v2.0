# 🚀 Deployment Guide - Render + Netlify

This guide will help you deploy your Discord bot on **Render** (backend) and **Netlify** (frontend dashboard) using their free tiers.

## 📋 Prerequisites

- GitHub account
- Render account (sign up at [render.com](https://render.com))
- Netlify account (sign up at [netlify.com](https://netlify.com))
- Your bot code pushed to a GitHub repository

---

## 🔧 Part 1: Deploy Backend to Render

### Step 1: Prepare Your Repository

1. Make sure your code is pushed to GitHub
2. Ensure `.gitignore` includes:
   ```
   .env
   node_modules/
   errors/
   ```

### Step 2: Create Render Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure the service:

   **Basic Settings:**
   - **Name:** `your-discord-bot` (or any name)
   - **Region:** Choose closest to you
   - **Branch:** `main` (or your default branch)
   - **Root Directory:** Leave empty
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

   **Instance Type:**
   - Select **"Free"** tier

### Step 3: Add Environment Variables

In the Render dashboard, scroll to **"Environment Variables"** and add:

```
BOT_TOKEN=your_bot_token_here
BOT_ID=your_bot_id_here
MONGO_URI=your_mongodb_connection_string
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_USER_AGENT=discord:yourbot:1.0
SRA_TOKEN=your_sra_token
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=your_secure_password
SESSION_SECRET=generate_random_32_char_string
NODE_ENV=production
ALLOWED_ORIGINS=https://your-app-name.netlify.app
PORT=3000
```

**Important Notes:**
- Replace all placeholder values with your actual credentials
- For `SESSION_SECRET`, generate a random string (32+ characters)
- For `ALLOWED_ORIGINS`, you'll update this after deploying to Netlify
- Keep `PORT=3000` (Render will use this)

### Step 4: Deploy

1. Click **"Create Web Service"**
2. Wait for the build to complete (5-10 minutes)
3. Once deployed, copy your Render URL: `https://your-discord-bot.onrender.com`

### Step 5: Keep Bot Alive (Free Tier Limitation)

Render's free tier spins down after 15 minutes of inactivity. To keep it alive:

**Option A: Use a Cron Job Service**
- Use [cron-job.org](https://cron-job.org) (free)
- Create a job that pings `https://your-discord-bot.onrender.com/api/bot-info` every 10 minutes

**Option B: UptimeRobot**
- Sign up at [uptimerobot.com](https://uptimerobot.com) (free)
- Add your Render URL as a monitor
- Set interval to 5 minutes

---

## 🎨 Part 2: Deploy Frontend to Netlify

### Step 1: Build the React App

Before deploying, you need to configure the API endpoint:

1. Create `admin-react/.env.production`:
   ```
   VITE_API_URL=https://your-discord-bot.onrender.com
   ```
   Replace with your actual Render URL from Part 1.

2. Update `admin-react/src/App.jsx` to use the environment variable:
   ```javascript
   const API_URL = import.meta.env.VITE_API_URL || '';
   
   // Use API_URL in all fetch calls:
   fetch(`${API_URL}/api/login`, ...)
   ```

3. Build the React app locally:
   ```bash
   cd admin-react
   npm install
   npm run build
   ```

### Step 2: Deploy to Netlify

**Method A: Drag & Drop (Easiest)**

1. Go to [Netlify](https://app.netlify.com/)
2. Click **"Add new site"** → **"Deploy manually"**
3. Drag the `admin-react/dist` folder into the upload area
4. Wait for deployment to complete
5. Your site will be live at `https://random-name.netlify.app`

**Method B: GitHub Integration (Recommended)**

1. Go to [Netlify](https://app.netlify.com/)
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect to GitHub and select your repository
4. Configure build settings:
   - **Base directory:** `admin-react`
   - **Build command:** `npm run build`
   - **Publish directory:** `admin-react/dist`
5. Add environment variable:
   - Key: `VITE_API_URL`
   - Value: `https://your-discord-bot.onrender.com`
6. Click **"Deploy site"**

### Step 3: Update Render Environment Variables

1. Go back to your Render dashboard
2. Update the `ALLOWED_ORIGINS` environment variable:
   ```
   ALLOWED_ORIGINS=https://your-app-name.netlify.app
   ```
3. Save changes (Render will automatically redeploy)

### Step 4: Custom Domain (Optional)

1. In Netlify, go to **"Domain settings"**
2. Click **"Add custom domain"**
3. Follow instructions to configure your domain
4. Update `ALLOWED_ORIGINS` in Render with your custom domain

---

## ✅ Verification Checklist

After deployment, verify everything works:

- [ ] Bot is online in Discord
- [ ] Dashboard loads at your Netlify URL
- [ ] Login works with your credentials
- [ ] Overview page shows bot statistics
- [ ] Commands page loads all commands
- [ ] WebSocket connection is stable (check browser console)
- [ ] Embed messages can be sent
- [ ] AutoResponder triggers work

---

## 🐛 Troubleshooting

### Bot Not Starting on Render

1. Check Render logs: Dashboard → Your Service → Logs
2. Common issues:
   - Invalid `BOT_TOKEN`
   - MongoDB connection failed (check `MONGO_URI`)
   - Missing environment variables

### Dashboard Can't Connect to Backend

1. Check CORS settings:
   - Verify `ALLOWED_ORIGINS` in Render includes your Netlify URL
   - Check browser console for CORS errors

2. Check API URL:
   - Verify `VITE_API_URL` in Netlify environment variables
   - Ensure it points to your Render URL (with https://)

### WebSocket Connection Failed

1. Render's free tier may have WebSocket limitations
2. Check if Socket.IO is falling back to polling (check browser console)
3. Ensure your Render service is not sleeping

### Bot Keeps Sleeping (Render Free Tier)

1. Set up a ping service (UptimeRobot or cron-job.org)
2. Ping your Render URL every 10 minutes
3. Consider upgrading to Render's paid tier for 24/7 uptime

---

## 💰 Cost Breakdown

**Free Tier Limits:**

**Render Free:**
- ✅ 750 hours/month (enough for 1 service 24/7)
- ⚠️ Spins down after 15 minutes of inactivity
- ⚠️ 512 MB RAM
- ⚠️ Shared CPU

**Netlify Free:**
- ✅ 100 GB bandwidth/month
- ✅ 300 build minutes/month
- ✅ Unlimited sites
- ✅ Automatic HTTPS

**MongoDB Atlas Free:**
- ✅ 512 MB storage
- ✅ Shared cluster
- ✅ No credit card required

---

## 🔒 Security Best Practices

1. **Never commit `.env` file** - It's in `.gitignore`
2. **Use strong passwords** - For `DASHBOARD_PASSWORD` and `SESSION_SECRET`
3. **Regenerate bot token** - If you accidentally exposed it
4. **Limit CORS origins** - Only allow your Netlify domain
5. **Enable 2FA** - On Discord, GitHub, Render, and Netlify accounts

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Netlify Documentation](https://docs.netlify.com)
- [Discord.js Guide](https://discordjs.guide)
- [MongoDB Atlas Setup](https://www.mongodb.com/docs/atlas/getting-started/)

---

## 🆘 Need Help?

If you encounter issues:
1. Check the logs in Render dashboard
2. Check browser console for frontend errors
3. Verify all environment variables are set correctly
4. Join the Discord.js community for support

---

**Congratulations! Your Discord bot is now live! 🎉**
