# Roleplay Prefix Database Integration - Complete

## Overview
Successfully migrated roleplay commands from hardcoded `r!` prefix to database-driven configuration, allowing per-server customization.

## Changes Made

### 1. Database Schema Update
- **File**: `src/schemas/prefixSchema.js`
- **Change**: Added `roleplayPrefix` field (default: `r!`)
- **Impact**: All guilds can now have custom roleplay prefixes

### 2. Prefix Helper Utility
- **File**: `src/utils/prefixHelper.js` (NEW)
- **Functions**:
  - `getPrefix(guildId)` - Get regular command prefix
  - `getRoleplayPrefix(guildId)` - Get roleplay command prefix
  - `getBothPrefixes(guildId)` - Get both prefixes at once
- **Purpose**: Centralized prefix fetching with fallback handling

### 3. Prefix Handler Update
- **File**: `src/events/handlers/prefixCreate.js`
- **Change**: Now fetches both prefixes from database and checks them independently
- **Behavior**: 
  - Checks roleplay prefix first
  - Falls back to regular prefix
  - Uses config.json as ultimate fallback

### 4. Roleplay Commands Update
- **Files**: All 45 roleplay command files in `src/messages/`
- **Commands Updated**:
  - Target commands (19): hug, kiss, pat, wave, poke, cuddle, slap, kick, punch, feed, tickle, bite, peck, yeet, shoot, highfive, handhold, bonk, handshake
  - Solo commands (24): cry, smile, dance, happy, blush, wink, pout, think, nope, bored, nod, sleep, shrug, laugh, lurk, run, facepalm, tableflip, thumbsup, smug, yawn, baka, angry, stare, nom
  - Special commands (2): waifu, husbando
- **Changes**:
  - Added `getRoleplayPrefix` import
  - Fetch prefix from database in execute function
  - Use dynamic prefix in error messages

### 5. Roleplay Info Command Update
- **File**: `src/commands/Community/fun/roleplay.js`
- **Change**: Fetches roleplay prefix from database instead of hardcoding
- **Impact**: Shows correct prefix for each server

### 6. New Admin Commands

#### `/setroleplayprefix`
- **File**: `src/commands/Admin/setroleplayprefix.js` (NEW)
- **Permission**: Administrator
- **Usage**: `/setroleplayprefix prefix:r!`
- **Purpose**: Set custom roleplay prefix per server
- **Validation**: 
  - Max 5 characters
  - Cannot be empty
- **Response**: Shows both regular and roleplay prefixes

#### `/viewprefixes`
- **File**: `src/commands/Admin/viewprefixes.js` (NEW)
- **Permission**: None (public)
- **Usage**: `/viewprefixes`
- **Purpose**: View current regular and roleplay prefixes
- **Response**: Shows both prefixes with examples

### 7. Migration Script
- **File**: `migrate-roleplay-prefix.js` (NEW)
- **Purpose**: Add `roleplayPrefix` field to existing guild documents
- **Usage**: `node migrate-roleplay-prefix.js`
- **Behavior**:
  - Connects to MongoDB
  - Finds all prefix documents
  - Adds `roleplayPrefix: 'r!'` to documents that don't have it
  - Skips documents that already have the field
  - Shows summary of updates

## How It Works

### Prefix Resolution Flow
1. User sends message with prefix
2. `prefixCreate.js` handler fetches both prefixes from database
3. Checks if message starts with roleplay prefix
4. If not, checks if message starts with regular prefix
5. If neither, ignores message
6. Executes appropriate command

### Roleplay Command Flow
1. User sends `r!hug @user` (or custom prefix)
2. Handler identifies it as roleplay command
3. Command executes
4. If error (no target), fetches roleplay prefix from DB
5. Shows error message with correct prefix

### Database Fallback Chain
```
Database → Config.json → Hardcoded Default
```

## Testing Checklist

- [ ] Run migration script: `node migrate-roleplay-prefix.js`
- [ ] Test default prefix (`r!hug @user`)
- [ ] Test `/setroleplayprefix prefix:rp!`
- [ ] Test custom prefix (`rp!hug @user`)
- [ ] Test `/viewprefixes` command
- [ ] Test error messages show correct prefix
- [ ] Test `/roleplay` command shows correct prefix
- [ ] Test regular prefix still works independently
- [ ] Test in multiple servers with different prefixes
- [ ] Verify database documents have `roleplayPrefix` field

## Configuration

### Default Values
- Regular Prefix: `!` (from config.json)
- Roleplay Prefix: `r!` (from schema default)

### Per-Server Configuration
Admins can customize using:
```
/setroleplayprefix prefix:custom!
```

### Database Structure
```javascript
{
  guildId: "123456789",
  prefix: "!",
  roleplayPrefix: "r!",
  updatedAt: Date
}
```

## Benefits

1. **Flexibility**: Each server can have custom roleplay prefix
2. **No Hardcoding**: All prefixes come from database
3. **Backward Compatible**: Defaults to `r!` if not set
4. **Centralized**: Single source of truth (database)
5. **User-Friendly**: Admin commands for easy configuration
6. **Fallback Safe**: Multiple fallback layers prevent errors

## Files Modified

### Core Files
- `src/schemas/prefixSchema.js` - Added roleplayPrefix field
- `src/events/handlers/prefixCreate.js` - Dual prefix support
- `src/commands/Community/fun/roleplay.js` - Dynamic prefix display

### New Files
- `src/utils/prefixHelper.js` - Prefix utility functions
- `src/commands/Admin/setroleplayprefix.js` - Set roleplay prefix
- `src/commands/Admin/viewprefixes.js` - View prefixes
- `migrate-roleplay-prefix.js` - Database migration
- `update-roleplay-prefix-db.js` - Batch update script
- `fix-roleplay-syntax.js` - Syntax fix script

### Roleplay Commands (45 files)
All files in `src/messages/` updated to use database prefix

## Next Steps

1. Run migration script to update existing guilds
2. Test all roleplay commands with default prefix
3. Test prefix customization in test server
4. Add prefix management to dashboard (optional)
5. Document new commands in help system
6. Clean up temporary scripts (update-roleplay-prefix-db.js, fix-roleplay-syntax.js)

## Notes

- Both prefixes work independently
- Roleplay prefix only affects roleplay commands
- Regular prefix only affects regular commands
- No conflicts between the two systems
- Database is single source of truth
- Config.json is fallback only
