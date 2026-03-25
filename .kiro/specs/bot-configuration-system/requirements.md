# Requirements Document: Bot Configuration System

## 1. Functional Requirements

### 1.1 Presence Configuration

**1.1.1** The system SHALL allow authorized users to change the bot's presence status to one of: online, idle, dnd, or invisible.

**1.1.2** The system SHALL allow authorized users to set bot activity with type (Playing, Streaming, Listening, Watching, Custom, Competing) and activity name (max 128 characters).

**1.1.3** The system SHALL support presence rotation with multiple activities and configurable interval (minimum 5 seconds).

**1.1.4** The system SHALL persist presence configuration to MongoDB for restoration after bot restart.

**1.1.5** The system SHALL apply presence changes immediately without requiring bot restart.

**1.1.6** The system SHALL maintain backward compatibility with existing presence rotation from discobase.json.

### 1.2 Avatar Configuration

**1.2.1** The system SHALL allow authorized users to change the bot's avatar by providing an image URL or data URI.

**1.2.2** The system SHALL validate avatar images for format (PNG, JPG, GIF, WebP), size (max 8MB), and dimensions (min 128x128).

**1.2.3** The system SHALL enforce Discord API rate limits for avatar changes (maximum 2 changes per hour).

**1.2.4** The system SHALL download and buffer images before uploading to Discord API.

**1.2.5** The system SHALL persist avatar URL to database after successful update.

### 1.3 Username Configuration

**1.3.1** The system SHALL allow authorized users to change the bot's username.

**1.3.2** The system SHALL validate usernames for length (2-32 characters) and restricted terms (discord, clyde, @).

**1.3.3** The system SHALL enforce Discord API rate limits for username changes (maximum 2 changes per hour).

**1.3.4** The system SHALL persist username to database after successful update.

### 1.4 Banner Configuration

**1.4.1** The system SHALL allow authorized users to change the bot's banner by providing an image URL or data URI.

**1.4.2** The system SHALL validate banner images for format (PNG, JPG, GIF, WebP), size (max 8MB), and dimensions (min 600x240).

**1.4.3** The system SHALL enforce Discord API rate limits for banner changes (maximum 2 changes per hour).

**1.4.4** The system SHALL check for premium features before allowing banner updates.

**1.4.5** The system SHALL persist banner URL to database after successful update.

### 1.5 Slash Command Interface

**1.5.1** The system SHALL provide a `/botconfig` slash command with subcommands for presence, avatar, username, banner, and view.

**1.5.2** The system SHALL validate command inputs at the command level before processing.

**1.5.3** The system SHALL respond with user-friendly embed messages for successful operations.

**1.5.4** The system SHALL respond with ephemeral error messages for failed operations.

**1.5.5** The system SHALL display current configuration when `/botconfig view` is executed.

### 1.6 Dashboard API Interface

**1.6.1** The system SHALL provide REST API endpoints for bot configuration: GET /api/bot-config, POST /api/bot-config/presence, POST /api/bot-config/avatar, POST /api/bot-config/username, POST /api/bot-config/banner.

**1.6.2** The system SHALL authenticate all dashboard API requests using existing authentication middleware.

**1.6.3** The system SHALL return current bot configuration including presence, avatar, username, and banner.

**1.6.4** The system SHALL return rate limit status for each operation type (remaining attempts, retry-after time).

**1.6.5** The system SHALL emit Socket.IO events for real-time dashboard updates after successful configuration changes.

### 1.7 Permission Management

**1.7.1** The system SHALL restrict all configuration changes to the bot owner (defined in BOT_OWNER_ID environment variable).

**1.7.2** The system SHALL verify user permissions before processing any configuration change.

**1.7.3** The system SHALL return 403 Forbidden with descriptive message when unauthorized users attempt changes.

**1.7.4** The system SHALL log all permission denial attempts with user ID for security audit.

### 1.8 Rate Limiting

**1.8.1** The system SHALL enforce Discord API rate limits: username (2/hour), avatar (2/hour), banner (2/hour), presence (5/minute).

**1.8.2** The system SHALL check rate limits before making Discord API calls.

**1.8.3** The system SHALL return error with retry-after time in seconds when rate limit exceeded.

**1.8.4** The system SHALL store rate limit state in memory for fast access.

**1.8.5** The system SHALL persist rate limit state to database periodically (every 5 minutes).

**1.8.6** The system SHALL reset rate limits automatically after time window expires.

### 1.9 Image Validation

**1.9.1** The system SHALL validate image format using magic number detection (PNG, JPG, GIF, WebP).

**1.9.2** The system SHALL reject images exceeding 8MB file size with descriptive error message.

**1.9.3** The system SHALL support both URL and data URI image sources.

**1.9.4** The system SHALL validate URLs against SSRF attacks by blocking internal IP addresses.

**1.9.5** The system SHALL implement 10-second timeout for image downloads.

**1.9.6** The system SHALL cache image validation results for 5 minutes to improve performance.

### 1.10 Data Persistence

**1.10.1** The system SHALL store bot configuration in MongoDB using BotConfigSchema.

**1.10.2** The system SHALL create default configuration if none exists for the bot.

**1.10.3** The system SHALL update configuration atomically (both Discord and database or neither).

**1.10.4** The system SHALL store configuration change history in ConfigChangeLog schema.

**1.10.5** The system SHALL log all configuration change attempts with timestamp, user ID, source (command/dashboard), and success status.

### 1.11 Real-time Updates

**1.11.1** The system SHALL emit Socket.IO events to connected dashboard clients after successful configuration changes.

**1.11.2** The system SHALL include change type and new value in Socket.IO event payload.

**1.11.3** The system SHALL throttle Socket.IO emissions to maximum 1 per second per event type.

**1.11.4** The system SHALL use existing Socket.IO server from src/services/socketServer.js.

## 2. Non-Functional Requirements

### 2.1 Performance

**2.1.1** The system SHALL respond to configuration requests within 2 seconds under normal conditions.

**2.1.2** The system SHALL cache rate limit checks in memory to avoid database queries on every request.

**2.1.3** The system SHALL use database connection pooling with minimum 10 connections.

**2.1.4** The system SHALL stream large images instead of loading entirely into memory.

**2.1.5** The system SHALL use lean() queries when full Mongoose documents are not needed.

### 2.2 Reliability

**2.2.1** The system SHALL implement error recovery for Discord API failures with exponential backoff.

**2.2.2** The system SHALL rollback database changes if Discord API update fails.

**2.2.3** The system SHALL log all errors to error logging system with full context.

**2.2.4** The system SHALL maintain configuration consistency between Discord and database.

**2.2.5** The system SHALL handle database connection loss gracefully without crashing.

### 2.3 Security

**2.3.1** The system SHALL sanitize all user inputs before processing.

**2.3.2** The system SHALL validate image magic numbers to prevent file type spoofing.

**2.3.3** The system SHALL never log sensitive data (tokens, passwords) in change logs.

**2.3.4** The system SHALL use HTTPS for all image downloads.

**2.3.5** The system SHALL implement CORS restrictions on dashboard API endpoints.

**2.3.6** The system SHALL block users after 5 consecutive permission denials to prevent abuse.

### 2.4 Maintainability

**2.4.1** The system SHALL follow existing codebase patterns and conventions.

**2.4.2** The system SHALL use existing schema pattern from src/schemas/prefixSchema.js.

**2.4.3** The system SHALL integrate with existing config system in src/config/index.js.

**2.4.4** The system SHALL document all public APIs with JSDoc comments.

**2.4.5** The system SHALL maintain 80% minimum code coverage with unit tests.

### 2.5 Compatibility

**2.5.1** The system SHALL be compatible with Discord.js v14.x.

**2.5.2** The system SHALL maintain backward compatibility with existing presence rotation system.

**2.5.3** The system SHALL support migration from discobase.json presence config to database.

**2.5.4** The system SHALL preserve existing .env variables (PRESENCE_*) as fallback defaults.

**2.5.5** The system SHALL not break existing ready.js presence logic during migration.

### 2.6 Usability

**2.6.1** The system SHALL provide clear error messages indicating the specific validation failure.

**2.6.2** The system SHALL display retry-after time in human-readable format (minutes/seconds).

**2.6.3** The system SHALL show remaining rate limit attempts in command responses.

**2.6.4** The system SHALL use color-coded embeds (green for success, red for error).

**2.6.5** The system SHALL provide examples of valid inputs in error messages.

## 3. Data Requirements

### 3.1 BotConfigSchema

**3.1.1** The schema SHALL store botId as unique indexed string.

**3.1.2** The schema SHALL store presence with status, activities array, and rotation configuration.

**3.1.3** The schema SHALL store appearance with username, avatarUrl, and bannerUrl.

**3.1.4** The schema SHALL store rate limit state for username, avatar, and banner operations.

**3.1.5** The schema SHALL store updatedAt timestamp and updatedBy user ID.

### 3.2 ConfigChangeLog

**3.2.1** The schema SHALL store botId, changeType, oldValue, and newValue.

**3.2.2** The schema SHALL store changedBy user ID and changedAt timestamp.

**3.2.3** The schema SHALL store source (command or dashboard).

**3.2.4** The schema SHALL store success boolean and errorMessage if failed.

**3.2.5** The schema SHALL support querying by changeType and date range for audit reports.

## 4. Interface Requirements

### 4.1 Slash Command Interface

**4.1.1** Command name SHALL be `/botconfig`.

**4.1.2** Subcommands SHALL include: presence, avatar, username, banner, view.

**4.1.3** Presence subcommand SHALL accept options: status (choice), type (choice), activity (string).

**4.1.4** Avatar subcommand SHALL accept option: image_url (string).

**4.1.5** Username subcommand SHALL accept option: new_name (string, 2-32 chars).

**4.1.6** Banner subcommand SHALL accept option: image_url (string).

**4.1.7** View subcommand SHALL display current configuration in embed format.

**4.1.8** All subcommands SHALL require administrator permissions by default.

### 4.2 Dashboard API Interface

**4.2.1** GET /api/bot-config SHALL return current bot configuration including presence, appearance, and rate limits.

**4.2.2** POST /api/bot-config/presence SHALL accept JSON body with status and activities array.

**4.2.3** POST /api/bot-config/avatar SHALL accept JSON body with imageUrl string.

**4.2.4** POST /api/bot-config/username SHALL accept JSON body with newName string.

**4.2.5** POST /api/bot-config/banner SHALL accept JSON body with imageUrl string.

**4.2.6** GET /api/bot-config/rate-limits SHALL return remaining attempts and retry-after time for each operation.

**4.2.7** All POST endpoints SHALL return JSON with success boolean, message string, and optional error string.

**4.2.8** All endpoints SHALL require authentication using existing auth middleware.

### 4.3 Socket.IO Events

**4.3.1** Event name SHALL be `botConfigUpdate`.

**4.3.2** Event payload SHALL include type (string), value (any), and timestamp (Date).

**4.3.3** Events SHALL be emitted after successful Discord API updates.

**4.3.4** Events SHALL be throttled to maximum 1 per second per type.

## 5. Constraint Requirements

### 5.1 Discord API Constraints

**5.1.1** Username changes SHALL be limited to 2 per hour per Discord API limits.

**5.1.2** Avatar changes SHALL be limited to 2 per hour per Discord API limits.

**5.1.3** Banner changes SHALL be limited to 2 per hour per Discord API limits.

**5.1.4** Presence changes SHALL be limited to 5 per minute to avoid rate limiting.

**5.1.5** Image uploads SHALL not exceed 8MB per Discord API limits.

**5.1.6** Usernames SHALL be 2-32 characters per Discord requirements.

**5.1.7** Usernames SHALL not contain 'discord', 'clyde', or '@' per Discord restrictions.

**5.1.8** Banner updates SHALL require bot to have premium features enabled.

### 5.2 System Constraints

**5.2.1** The system SHALL require MongoDB connection for data persistence.

**5.2.2** The system SHALL require BOT_OWNER_ID environment variable for permission checks.

**5.2.3** The system SHALL require existing Socket.IO server for real-time updates.

**5.2.4** The system SHALL require existing authentication middleware for dashboard API.

**5.2.5** The system SHALL be compatible with Node.js v16 or higher.

## 6. Acceptance Criteria

### 6.1 Presence Configuration Acceptance

**6.1.1** GIVEN an authorized user executes `/botconfig presence status:dnd type:Playing activity:with fire`, WHEN the command is processed, THEN the bot's presence SHALL change to "Do Not Disturb" with activity "Playing with fire" within 2 seconds.

**6.1.2** GIVEN presence rotation is enabled with 3 activities and 10-second interval, WHEN 30 seconds pass, THEN the bot SHALL cycle through all 3 activities in order.

**6.1.3** GIVEN the bot restarts, WHEN the ready event fires, THEN the bot SHALL restore the last saved presence configuration from database.

### 6.2 Avatar Configuration Acceptance

**6.2.1** GIVEN an authorized user provides a valid PNG image URL under 8MB, WHEN the avatar update is requested, THEN the bot's avatar SHALL change to the new image within 5 seconds.

**6.2.2** GIVEN a user has changed the avatar 2 times in the past hour, WHEN they attempt a third change, THEN the system SHALL reject with error message including retry-after time.

**6.2.3** GIVEN a user provides an image URL exceeding 8MB, WHEN the avatar update is requested, THEN the system SHALL reject with error message showing file size and limit.

### 6.3 Username Configuration Acceptance

**6.3.1** GIVEN an authorized user provides a valid username "CoolBot123", WHEN the username update is requested, THEN the bot's username SHALL change to "CoolBot123" within 2 seconds.

**6.3.2** GIVEN a user provides username "a" (1 character), WHEN the username update is requested, THEN the system SHALL reject with error "Username must be 2-32 characters".

**6.3.3** GIVEN a user provides username "discord_bot", WHEN the username update is requested, THEN the system SHALL reject with error about restricted terms.

### 6.4 Banner Configuration Acceptance

**6.4.1** GIVEN an authorized user provides a valid banner image URL (600x240, under 8MB), WHEN the banner update is requested, THEN the bot's banner SHALL change to the new image within 5 seconds.

**6.4.2** GIVEN the bot does not have premium features, WHEN a banner update is requested, THEN the system SHALL reject with error about premium requirement.

### 6.5 Dashboard API Acceptance

**6.5.1** GIVEN an authenticated dashboard user requests GET /api/bot-config, WHEN the request is processed, THEN the response SHALL include current presence, avatar URL, username, and banner URL.

**6.5.2** GIVEN an authenticated dashboard user posts to /api/bot-config/presence with valid data, WHEN the request is processed, THEN the bot's presence SHALL update AND a Socket.IO event SHALL be emitted to all connected clients.

**6.5.3** GIVEN an unauthenticated user requests any /api/bot-config endpoint, WHEN the request is processed, THEN the system SHALL return 401 Unauthorized.

### 6.6 Permission Management Acceptance

**6.6.1** GIVEN a user with ID matching BOT_OWNER_ID executes a config command, WHEN permission check runs, THEN the command SHALL be allowed to proceed.

**6.6.2** GIVEN a user with ID NOT matching BOT_OWNER_ID executes a config command, WHEN permission check runs, THEN the system SHALL reject with "Permission denied. Only the bot owner can modify bot configuration."

**6.6.3** GIVEN a user attempts 5 consecutive unauthorized config changes, WHEN the 5th attempt is made, THEN the system SHALL block further attempts from that user for 1 hour.

### 6.7 Rate Limiting Acceptance

**6.7.1** GIVEN a user changes username twice in 30 minutes, WHEN they attempt a third change, THEN the system SHALL reject with message "Rate limit exceeded. Try again in X minutes."

**6.7.2** GIVEN a user's rate limit window expires (1 hour passes), WHEN they attempt a username change, THEN the system SHALL allow the operation and reset the counter.

**6.7.3** GIVEN a user requests GET /api/bot-config/rate-limits, WHEN the request is processed, THEN the response SHALL show remaining attempts and retry-after time for each operation type.

### 6.8 Image Validation Acceptance

**6.8.1** GIVEN a user provides a BMP image URL, WHEN image validation runs, THEN the system SHALL reject with error "Invalid image format. Supported formats: PNG, JPG, GIF, WebP".

**6.8.2** GIVEN a user provides a valid PNG data URI, WHEN image validation runs, THEN the system SHALL accept and decode the image successfully.

**6.8.3** GIVEN a user provides an image URL that times out after 10 seconds, WHEN image download is attempted, THEN the system SHALL abort and return timeout error.

### 6.9 Data Persistence Acceptance

**6.9.1** GIVEN a successful presence update, WHEN the database is queried, THEN the BotConfigSchema document SHALL contain the new presence configuration.

**6.9.2** GIVEN a failed avatar update (Discord API error), WHEN the database is queried, THEN the BotConfigSchema document SHALL NOT contain the new avatar URL.

**6.9.3** GIVEN any configuration change attempt, WHEN the operation completes, THEN a ConfigChangeLog entry SHALL exist with correct changeType, success status, and timestamp.

### 6.10 Real-time Updates Acceptance

**6.10.1** GIVEN a dashboard client is connected via Socket.IO, WHEN a presence update succeeds, THEN the client SHALL receive a `botConfigUpdate` event with type "presence" within 1 second.

**6.10.2** GIVEN multiple config changes occur within 1 second, WHEN Socket.IO emissions are processed, THEN events SHALL be throttled to maximum 1 per second per type.

### 6.11 Error Handling Acceptance

**6.11.1** GIVEN the Discord API returns a 500 error, WHEN a config update is attempted, THEN the system SHALL log the error, return user-friendly message, and NOT update the database.

**6.11.2** GIVEN the MongoDB connection is lost, WHEN a config update is attempted, THEN the system SHALL return error "Configuration update failed due to database error" and NOT update Discord.

**6.11.3** GIVEN an invalid presence status "away" is provided, WHEN validation runs, THEN the system SHALL reject with error "Invalid status 'away'. Valid options: online, idle, dnd, invisible".

### 6.12 Backward Compatibility Acceptance

**6.12.1** GIVEN existing presence configuration in discobase.json, WHEN the bot starts for the first time with new system, THEN the configuration SHALL be migrated to BotConfigSchema automatically.

**6.12.2** GIVEN PRESENCE_NAMES environment variable is set, WHEN no database configuration exists, THEN the system SHALL use environment variable values as defaults.

**6.12.3** GIVEN existing presence rotation is running from ready.js, WHEN new system is deployed, THEN the existing rotation SHALL continue working until migration is complete.

## 7. Testing Requirements

### 7.1 Unit Testing

**7.1.1** Rate limiter SHALL have tests for limit enforcement, cooldown calculation, and concurrent requests.

**7.1.2** Image validator SHALL have tests for all supported formats, size limits, and malformed inputs.

**7.1.3** Permission checker SHALL have tests for owner check, admin check, and unauthorized rejection.

**7.1.4** Configuration service SHALL have tests for all update operations, database persistence, and rollback on failure.

**7.1.5** Overall code coverage SHALL be minimum 80%.

### 7.2 Property-Based Testing

**7.2.1** Rate limit monotonicity property SHALL be tested: remaining attempts never increase without time passing.

**7.2.2** Image validation idempotency property SHALL be tested: same image produces same validation result.

**7.2.3** Username validation consistency property SHALL be tested: valid usernames always pass, invalid always fail.

**7.2.4** Presence rotation bounds property SHALL be tested: current index always within array bounds.

**7.2.5** Config update atomicity property SHALL be tested: Discord and database states always match after update.

### 7.3 Integration Testing

**7.3.1** End-to-end slash command flow SHALL be tested from command execution to database update.

**7.3.2** End-to-end dashboard API flow SHALL be tested from HTTP request to Socket.IO emission.

**7.3.3** Presence rotation integration SHALL be tested for timing, index progression, and persistence.

**7.3.4** Rate limit recovery SHALL be tested by triggering limit and verifying reset after cooldown.

**7.3.5** Error recovery flow SHALL be tested by simulating Discord API failures and verifying rollback.

## 8. Documentation Requirements

**8.1** All public APIs SHALL be documented with JSDoc comments including parameters, return types, and examples.

**8.2** README SHALL include setup instructions for new configuration system.

**8.3** Migration guide SHALL document steps to migrate from discobase.json to database configuration.

**8.4** API documentation SHALL list all dashboard endpoints with request/response examples.

**8.5** Slash command documentation SHALL include usage examples for each subcommand.

**8.6** Rate limit documentation SHALL explain Discord API limits and system enforcement.

**8.7** Troubleshooting guide SHALL cover common errors and resolution steps.
