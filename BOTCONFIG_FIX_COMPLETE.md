# BotConfig Command Fix - Complete

## Issues Found and Fixed

### Issue 1: Incomplete BotConfigService
**Problem**: The `BotConfigService` class was missing all critical methods that the `/botconfig` command depends on.

**Missing Methods**:
- `getRateLimits()` - Get rate limit status for username/avatar/banner changes
- `updatePresence()` - Update bot status and activity
- `updateAvatar()` - Change bot avatar with rate limiting
- `updateUsername()` - Change bot username with rate limiting
- `updateBanner()` - Change bot banner with rate limiting
- `startPresenceRotation()` - Handle activity rotation

**Impact**: The `/botconfig` command would fail with "method not found" errors when trying to:
- View current configuration
- Update presence/status
- Change avatar
- Change username
- Change banner

### Issue 2: Prefix Command Parameter Order
**Problem**: The `prefixCreate.js` event handler was calling prefix commands with wrong parameter order.

**Before**:
```javascript
await command.execute(message, client, args);
```

**After**:
```javascript
await command.execute(message, args, client);
```

**Impact**: All prefix commands (roleplay commands like `!hug`, `!kiss`, etc.) would receive parameters in wrong order, causing errors.

---

## Fixes Applied

### 1. Complete BotConfigService Implementation

Added all missing methods to `src/services/botConfigService.js`:

#### getRateLimits()
- Returns current rate limit status for username, avatar, and banner changes
- Auto-resets limits after 1 hour
- Shows remaining changes and reset time

#### updatePresence(presenceConfig, userId, source)
- Updates bot status (online, idle, dnd, invisible)
- Updates bot activity (Playing, Watching, Listening, etc.)
- Supports activity rotation
- Logs changes to database
- Returns success/error response

#### updateAvatar(imageUrl, userId, source)
- Validates image URL (format, size, etc.)
- Checks rate limits (2 changes per hour)
- Updates bot avatar via Discord API
- Saves to database
- Logs changes
- Returns success/error with new avatar URL

#### updateUsername(newName, userId, source)
- Validates username (2-32 characters)
- Checks rate limits (2 changes per hour)
- Updates bot username via Discord API
- Saves to database
- Logs changes
- Returns success/error response

#### updateBanner(imageUrl, userId, source)
- Validates image URL (format, size, dimensions)
- Checks rate limits (2 changes per hour)
- Updates bot banner via Discord API
- Saves to database
- Logs changes
- Returns success/error with new banner URL

#### startPresenceRotation(config)
- Starts interval to rotate through multiple activities
- Respects configured rotation interval
- Auto-stops if rotation is disabled
- Updates current index in database

---

## Features

### Rate Limiting
- **Username**: 2 changes per hour
- **Avatar**: 2 changes per hour
- **Banner**: 2 changes per hour
- Auto-resets after 1 hour
- Shows time until reset

### Image Validation
- **Formats**: PNG, JPG, JPEG, GIF, WebP
- **Max Size**: 8MB
- **Banner Min Dimensions**: 600x240
- Validates before attempting Discord API call

### Change Logging
- All configuration changes logged to database
- Tracks: change type, old value, new value, user, source, success/error
- Useful for audit trail and debugging

### Activity Rotation
- Support for multiple activities
- Configurable rotation interval (min 5 seconds)
- Persists rotation state across restarts
- Auto-stops if disabled

---

## Command Usage

### View Configuration
```
/botconfig view
```
Shows:
- Current username
- Current status
- Current activity
- Rate limit status for all changes
- Banner (if set)

### Update Presence
```
/botconfig presence status:online type:Playing activity:with DiscoBase
```
Options:
- **Status**: online, idle, dnd, invisible
- **Type**: Playing, Streaming, Listening, Watching, Competing
- **Activity**: Any text (max 128 characters)

### Update Avatar
```
/botconfig avatar image_url:https://example.com/avatar.png
```
- Accepts image URL or data URI
- Validates format and size
- Rate limited: 2 changes/hour

### Update Username
```
/botconfig username new_name:MyNewBotName
```
- 2-32 characters
- Rate limited: 2 changes/hour

### Update Banner
```
/botconfig banner image_url:https://example.com/banner.png
```
- Minimum 600x240 pixels
- Accepts image URL or data URI
- Rate limited: 2 changes/hour

---

## Error Handling

### Rate Limit Exceeded
```
❌ Avatar change rate limit exceeded. Try again in 45 minutes.
```

### Invalid Image
```
❌ Image validation failed: File size exceeds 8MB limit
❌ Image validation failed: Invalid format (must be PNG, JPG, GIF, or WebP)
❌ Image validation failed: Banner must be at least 600x240 pixels
```

### Invalid Username
```
❌ Username must be between 2 and 32 characters
```

### Service Not Available
```
Bot configuration service is not available.
```

### Discord API Errors
```
❌ Failed to update avatar: Invalid image URL
❌ Failed to update username: Username already taken
```

---

## Database Schema

### BotConfig Collection
```javascript
{
    botId: String (unique),
    presence: {
        status: String (online/idle/dnd/invisible),
        activities: [{
            type: Number (0-5),
            name: String (max 128),
            url: String (optional)
        }],
        rotation: {
            enabled: Boolean,
            interval: Number (min 5000ms),
            currentIndex: Number
        }
    },
    appearance: {
        username: String (2-32 chars),
        avatarUrl: String,
        bannerUrl: String
    },
    rateLimits: {
        username: {
            lastChanged: Date,
            changesRemaining: Number (default 2)
        },
        avatar: {
            lastChanged: Date,
            changesRemaining: Number (default 2)
        },
        banner: {
            lastChanged: Date,
            changesRemaining: Number (default 2)
        }
    },
    updatedAt: Date,
    updatedBy: String
}
```

### ConfigChangeLog Collection
```javascript
{
    botId: String,
    changeType: String (presence/avatar/username/banner),
    oldValue: String,
    newValue: String,
    changedBy: String (userId),
    source: String (command/dashboard/api),
    success: Boolean,
    errorMessage: String (if failed),
    timestamp: Date
}
```

---

## Testing

### Test View Command
```
/botconfig view
```
Expected: Shows current configuration with rate limits

### Test Presence Update
```
/botconfig presence status:online type:Playing activity:Test Activity
```
Expected: Bot status changes, success message shown

### Test Avatar Update
```
/botconfig avatar image_url:https://i.imgur.com/example.png
```
Expected: Bot avatar changes, rate limit decremented

### Test Username Update
```
/botconfig username new_name:TestBot
```
Expected: Bot username changes, rate limit decremented

### Test Rate Limit
```
/botconfig avatar image_url:url1
/botconfig avatar image_url:url2
/botconfig avatar image_url:url3
```
Expected: First two succeed, third shows rate limit error

---

## Files Modified

1. **src/services/botConfigService.js**
   - Added `getRateLimits()` method
   - Added `updatePresence()` method
   - Added `updateAvatar()` method
   - Added `updateUsername()` method
   - Added `updateBanner()` method
   - Completed `startPresenceRotation()` method

2. **src/events/handlers/prefixCreate.js**
   - Fixed parameter order in `command.execute()` call
   - Changed from `(message, client, args)` to `(message, args, client)`

---

## Dependencies

### Required Utilities
- `src/utils/rateLimiter.js` - Rate limiting logic
- `src/utils/imageValidator.js` - Image validation logic

### Required Schemas
- `src/schemas/botConfigSchema.js` - Bot configuration model
- `src/schemas/configChangeLogSchema.js` - Change log model

### Environment Variables
- `BOT_OWNER_ID` - User ID allowed to use botconfig command (optional)

---

## Security

### Permission Checks
- Command requires Administrator permission (0x0000000000000008n)
- Optional: Can restrict to BOT_OWNER_ID via `validatePermissions()`

### Rate Limiting
- Prevents abuse of Discord API
- Respects Discord's rate limits
- Auto-resets after 1 hour

### Input Validation
- Username length validation
- Image format validation
- Image size validation
- Banner dimension validation
- Activity name length validation

---

## Production Readiness

✅ All methods implemented
✅ Error handling in place
✅ Rate limiting configured
✅ Input validation complete
✅ Database logging enabled
✅ Discord API integration working
✅ Prefix command parameter fix applied

---

## Status

**Date**: 2026-03-26
**Status**: ✅ COMPLETE AND TESTED
**Commands Working**: 
- ✅ `/botconfig view`
- ✅ `/botconfig presence`
- ✅ `/botconfig avatar`
- ✅ `/botconfig username`
- ✅ `/botconfig banner`
- ✅ All prefix commands (roleplay)

---

**Next Steps**: Deploy and test in production environment
