# ✅ Pre-Deployment Checklist

Complete this checklist before deploying to Render and Netlify.

## 🔒 Security

- [ ] `.env` file is in `.gitignore`
- [ ] All sensitive credentials are removed from code
- [ ] Strong `DASHBOARD_PASSWORD` set (min 12 characters)
- [ ] Random `SESSION_SECRET` generated (32+ characters)
- [ ] Bot token is valid and not exposed publicly
- [ ] MongoDB connection string is correct

## 📦 Code Preparation

- [ ] All development documentation files removed
- [ ] `errors/` folder deleted
- [ ] `node_modules/` not committed to git
- [ ] All code pushed to GitHub repository
- [ ] `package.json` has correct start script: `"start": "node ."`

## 🎨 Frontend Configuration

- [ ] `admin-react/.env.production` created
- [ ] `VITE_API_URL` set to your Render URL
- [ ] All React components import `API_URL` from `config.js`
- [ ] React app builds successfully: `cd admin-react && npm run build`
- [ ] `admin-react/dist` folder generated

## 🚀 Backend Configuration

- [ ] `admin/dashboard.js` uses `process.env.PORT`
- [ ] CORS configured with `ALLOWED_ORIGINS` environment variable
- [ ] Socket.IO configured to accept connections from Netlify
- [ ] MongoDB connection uses environment variable

## 📝 Environment Variables Ready

Prepare these for Render:

```
BOT_TOKEN=
BOT_ID=
MONGO_URI=
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
REDDIT_USER_AGENT=
SRA_TOKEN=
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=
SESSION_SECRET=
NODE_ENV=production
ALLOWED_ORIGINS=https://your-app.netlify.app
PORT=3000
```

## 🧪 Local Testing

- [ ] Bot starts locally: `npm start`
- [ ] Dashboard accessible at `http://localhost:3000`
- [ ] Login works
- [ ] All pages load correctly
- [ ] Commands can be toggled
- [ ] Embed messages can be sent
- [ ] AutoResponder works

## 📚 Documentation

- [ ] `DEPLOYMENT_GUIDE.md` reviewed
- [ ] Render deployment steps understood
- [ ] Netlify deployment steps understood
- [ ] Know how to check logs on Render

## 🔄 Post-Deployment

After deploying, verify:

- [ ] Bot shows as online in Discord
- [ ] Render service is running (check dashboard)
- [ ] Netlify site is live
- [ ] Dashboard login works
- [ ] WebSocket connection established
- [ ] All API endpoints responding
- [ ] Commands work in Discord
- [ ] AutoResponder triggers work

## 🆘 Troubleshooting Resources

- Render Logs: Dashboard → Your Service → Logs
- Browser Console: F12 → Console tab
- Network Tab: F12 → Network tab (check API calls)
- Discord Bot Status: Check if bot is online in server

## 📞 Support

If you encounter issues:
1. Check Render logs for backend errors
2. Check browser console for frontend errors
3. Verify all environment variables are set
4. Ensure CORS is configured correctly
5. Check MongoDB connection status

---

**Ready to deploy?** Follow the `DEPLOYMENT_GUIDE.md` step by step!
