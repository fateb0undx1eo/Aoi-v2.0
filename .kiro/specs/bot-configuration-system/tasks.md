# Implementation Plan: Bot Configuration System

## Overview

This implementation plan breaks down the Bot Configuration System into discrete coding tasks. The system enables real-time modification of Discord bot appearance and presence without requiring restarts, providing both slash command and web dashboard interfaces. Implementation follows existing codebase patterns and integrates with current systems (Socket.IO, authentication, MongoDB schemas).

## Tasks

- [x] 1. Create MongoDB schemas for bot configuration
  - Create `src/schemas/botConfigSchema.js` following existing schema patterns
  - Create `src/schemas/configChangeLogSchema.js` for audit logging
  - Add indexes for botId, changeType, and changedAt fields
  - Include validation rules for status, activity types, and string lengths
  - _Requirements: 3.1.1, 3.1.2, 3.1.3, 3.1.4, 3.1.5, 3.2.1, 3.2.2, 3.2.3, 3.2.4_

- [ ] 2. Implement core configuration service
  - [-] 2.1 Create BotConfigService class in `src/services/botConfigService.js`
    - Implement `updatePresence()` method with validation and Discord API integration
    - Implement `updateAvatar()` method with image validation
    - Implement `updateUsername()` method with Discord restrictions
    - Implement `updateBanner()` method with premium check
    - Implement `getConfig()` method with default creation
    - Implement `validatePermissions()` helper using BOT_OWNER_ID
    - _Requirements: 1.1.1, 1.1.2, 1.1.5, 1.2.1, 1.2.5, 1.3.1, 1.3.4, 1.4.1, 1.4.5, 1.7.1, 1.7.2_

  - [ ]* 2.2 Write property test for configuration atomicity
    - **Property 8: Atomic Updates** - For all config updates, success means both Discord and database are updated (or both fail)
    - **Validates: Requirements 1.10.3, 2.2.2**

- [ ] 3. Implement rate limiting system
  - [ ] 3.1 Create RateLimiter class in `src/utils/rateLimiter.js`
    - Implement `checkLimit()` method with time window calculations
    - Implement `recordOperation()` method for tracking usage
    - Implement `getRemainingAttempts()` method for user feedback
    - Implement `resetLimits()` method for automatic cleanup
    - Use in-memory Map for fast access with periodic database sync
    - _Requirements: 1.8.1, 1.8.2, 1.8.3, 1.8.4, 1.8.5, 1.8.6, 2.1.2_

  - [ ]* 3.2 Write property test for rate limit monotonicity
    - **Property 1: Rate Limit Enforcement** - For any sequence of operations, remaining attempts never increase without time passing
    - **Validates: Requirements 1.8.1, 1.8.6**

  - [ ]* 3.3 Write unit tests for rate limiter
    - Test limit enforcement for each operation type (username, avatar, banner, presence)
    - Test cooldown period calculation accuracy
    - Test concurrent requests from same user
    - Test rate limit reset after time window expires
    - _Requirements: 1.8.1, 1.8.2, 1.8.6_

- [ ] 4. Implement image validation system
  - [ ] 4.1 Create ImageValidator class in `src/utils/imageValidator.js`
    - Implement `validateImage()` method with magic number detection
    - Implement `checkFileSize()` method with 8MB limit
    - Implement `checkFormat()` method for PNG, JPG, GIF, WebP
    - Implement `downloadAndBuffer()` method with 10-second timeout
    - Add SSRF protection by blocking internal IP addresses
    - _Requirements: 1.2.2, 1.2.4, 1.4.2, 1.9.1, 1.9.2, 1.9.3, 1.9.4, 1.9.5_

  - [ ]* 4.2 Write property test for image validation idempotency
    - **Property 2: Image Validation** - Validating the same image multiple times produces same result
    - **Validates: Requirements 1.9.1, 1.9.6**

  - [ ]* 4.3 Write unit tests for image validator
    - Test valid image formats (PNG, JPG, GIF, WebP)
    - Test invalid format rejection
    - Test file size limits (under/over 8MB)
    - Test malformed data URIs
    - Test network errors during download
    - Test magic number validation accuracy
    - _Requirements: 1.9.1, 1.9.2, 1.9.3_

- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement slash command handler
  - [ ] 6.1 Create `/botconfig` command in `src/commands/Admin/botconfig.js`
    - Follow existing command pattern from `setroleplayprefix.js`
    - Add subcommands: presence, avatar, username, banner, view
    - Implement presence subcommand with status, type, and activity options
    - Implement avatar subcommand with image_url option
    - Implement username subcommand with new_name option
    - Implement banner subcommand with image_url option
    - Implement view subcommand to display current configuration
    - Set default permissions to Administrator
    - _Requirements: 1.5.1, 1.5.2, 1.5.3, 1.5.4, 1.5.5, 4.1.1, 4.1.2, 4.1.3, 4.1.4, 4.1.5, 4.1.6, 4.1.7, 4.1.8_

  - [ ] 6.2 Integrate command with BotConfigService
    - Call service methods from command handler
    - Handle rate limit errors with retry-after display
    - Handle permission errors with ephemeral messages
    - Create color-coded embeds (green for success, red for error)
    - Display remaining rate limit attempts in responses
    - _Requirements: 1.5.3, 1.5.4, 1.8.3, 2.6.1, 2.6.2, 2.6.3, 2.6.4_

  - [ ]* 6.3 Write unit tests for slash command handler
    - Test successful presence update flow
    - Test rate limit exceeded response
    - Test permission denied response
    - Test invalid input validation
    - Test embed formatting
    - _Requirements: 1.5.1, 1.5.3, 1.5.4_

- [ ] 7. Implement dashboard API endpoints
  - [ ] 7.1 Add bot config routes to `admin/dashboard.js`
    - Add GET `/api/bot-config` endpoint to return current configuration
    - Add POST `/api/bot-config/presence` endpoint
    - Add POST `/api/bot-config/avatar` endpoint
    - Add POST `/api/bot-config/username` endpoint
    - Add POST `/api/bot-config/banner` endpoint
    - Add GET `/api/bot-config/rate-limits` endpoint
    - Use existing `requireAuth` middleware for authentication
    - _Requirements: 1.6.1, 1.6.2, 1.6.3, 1.6.4, 4.2.1, 4.2.2, 4.2.3, 4.2.4, 4.2.5, 4.2.6, 4.2.7, 4.2.8_

  - [ ] 7.2 Integrate API endpoints with BotConfigService
    - Call service methods from API handlers
    - Return JSON responses with success, message, and error fields
    - Emit Socket.IO events after successful updates
    - Throttle Socket.IO emissions to 1 per second per type
    - Handle errors with appropriate HTTP status codes
    - _Requirements: 1.6.5, 1.11.1, 1.11.2, 1.11.3, 2.2.3_

  - [ ]* 7.3 Write integration tests for dashboard API
    - Test GET /api/bot-config returns current configuration
    - Test POST endpoints update configuration successfully
    - Test authentication requirement (401 for unauthenticated)
    - Test Socket.IO event emission after updates
    - Test rate limit status endpoint
    - _Requirements: 1.6.1, 1.6.2, 1.6.5_

- [ ] 8. Implement presence rotation system
  - [ ] 8.1 Add presence rotation logic to BotConfigService
    - Implement rotation interval timer using setInterval
    - Implement index progression with modulo arithmetic
    - Persist current index to database on changes
    - Clear interval when rotation disabled
    - Restore rotation state on bot restart
    - _Requirements: 1.1.3, 1.1.4, 1.1.6_

  - [ ]* 8.2 Write property test for rotation bounds
    - **Property 6: Rotation Integrity** - For all rotation configs, if enabled, current index is always within valid bounds
    - **Validates: Requirements 1.1.3**

  - [ ]* 8.3 Write integration tests for presence rotation
    - Test rotation timing accuracy
    - Test index progression through all activities
    - Test database persistence of current index
    - Test rotation stop/start behavior
    - Test restoration after bot restart
    - _Requirements: 1.1.3, 1.1.4_

- [ ] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Implement migration from discobase.json
  - [ ] 10.1 Create migration script in `src/utils/migratePresenceConfig.js`
    - Read presence configuration from discobase.json
    - Create BotConfigSchema document with migrated data
    - Preserve existing presence rotation settings
    - Log migration success/failure
    - _Requirements: 1.1.6, 2.5.2, 2.5.3, 2.5.4_

  - [ ] 10.2 Integrate migration into ready.js
    - Check if BotConfigSchema exists for bot
    - If not, run migration from discobase.json
    - Fall back to .env variables if discobase.json doesn't exist
    - Maintain backward compatibility with existing presence logic
    - _Requirements: 1.1.6, 2.5.2, 2.5.5_

  - [ ]* 10.3 Write unit tests for migration script
    - Test successful migration from discobase.json
    - Test fallback to .env variables
    - Test handling of missing configuration files
    - Test preservation of rotation settings
    - _Requirements: 2.5.3, 2.5.4_

- [ ] 11. Implement error handling and logging
  - [ ] 11.1 Add error handling to all service methods
    - Implement try-catch blocks with specific error messages
    - Log errors using existing error logging system
    - Implement rollback logic for failed Discord API updates
    - Add exponential backoff for Discord API failures
    - _Requirements: 2.2.1, 2.2.2, 2.2.3, 2.2.4_

  - [ ] 11.2 Implement ConfigChangeLog persistence
    - Log all configuration change attempts
    - Include timestamp, user ID, source (command/dashboard), and success status
    - Store old and new values for audit trail
    - Never log sensitive data (tokens, passwords)
    - _Requirements: 1.10.4, 1.10.5, 2.3.3_

  - [ ]* 11.3 Write unit tests for error handling
    - Test Discord API failure rollback
    - Test database connection loss handling
    - Test error logging with full context
    - Test exponential backoff behavior
    - _Requirements: 2.2.1, 2.2.2, 2.2.5_

- [ ] 12. Implement security measures
  - [ ] 12.1 Add input sanitization to all service methods
    - Sanitize username input (remove special characters)
    - Validate URLs against SSRF attacks
    - Validate image magic numbers to prevent spoofing
    - Implement CORS restrictions on dashboard API
    - _Requirements: 2.3.1, 2.3.2, 2.3.4, 2.3.5_

  - [ ] 12.2 Implement abuse prevention
    - Block users after 5 consecutive permission denials
    - Add IP-based rate limiting for dashboard API
    - Implement request timeout for image downloads
    - Log all permission denial attempts with user ID
    - _Requirements: 1.7.4, 2.3.6_

  - [ ]* 12.3 Write security tests
    - Test SSRF protection blocks internal IPs
    - Test magic number validation prevents spoofing
    - Test user blocking after repeated denials
    - Test sensitive data is never logged
    - _Requirements: 2.3.1, 2.3.2, 2.3.3, 2.3.6_

- [ ] 13. Add JSDoc documentation
  - [ ] 13.1 Document all public APIs with JSDoc comments
    - Document BotConfigService methods with parameters and return types
    - Document RateLimiter methods with examples
    - Document ImageValidator methods with validation rules
    - Document slash command options and responses
    - Document dashboard API endpoints with request/response schemas
    - _Requirements: 2.4.4_

- [ ] 14. Final integration and testing
  - [ ] 14.1 Wire all components together
    - Ensure BotConfigService is instantiated in index.js
    - Ensure slash command is registered with Discord
    - Ensure dashboard API routes are mounted
    - Ensure Socket.IO events are properly emitted
    - Ensure migration runs on first bot startup
    - _Requirements: 1.1.5, 1.5.1, 1.6.1, 1.11.1_

  - [ ]* 14.2 Write end-to-end integration tests
    - Test complete slash command flow from execution to database update
    - Test complete dashboard API flow from request to Socket.IO emission
    - Test presence rotation integration with timing and persistence
    - Test rate limit recovery after cooldown period
    - Test error recovery flow with Discord API failures
    - _Requirements: 6.1.1, 6.2.1, 6.5.2, 6.7.1, 6.9.1_

  - [ ]* 14.3 Verify code coverage meets 80% minimum
    - Run coverage report with Jest
    - Identify uncovered code paths
    - Add tests for uncovered areas if needed
    - _Requirements: 2.4.5, 7.1.5_

- [ ] 15. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties from design document
- Unit tests validate specific examples and edge cases
- Integration tests verify end-to-end flows across components
- All code follows existing patterns from `src/schemas/prefixSchema.js`, `src/commands/Admin/setroleplayprefix.js`, and `admin/dashboard.js`
- Implementation uses JavaScript (Node.js) with Discord.js v14, Express, Mongoose, and Socket.IO
