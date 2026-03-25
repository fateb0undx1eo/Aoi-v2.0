const { EmbedBuilder } = require('discord.js');
const logger = require('./winstonLogger');
const { v4: uuidv4 } = require('uuid');

/**
 * Custom error class for command errors
 */
class CommandError extends Error {
  constructor(message, userMessage, ephemeral = true, logLevel = 'error') {
    super(message);
    this.name = 'CommandError';
    this.userMessage = userMessage;
    this.ephemeral = ephemeral;
    this.logLevel = logLevel;
    this.errorId = uuidv4().split('-')[0]; // Short error ID
  }
}

/**
 * Custom error class for validation errors
 */
class ValidationError extends CommandError {
  constructor(message, userMessage) {
    super(message, userMessage, true, 'warn');
    this.name = 'ValidationError';
  }
}

/**
 * Custom error class for permission errors
 */
class PermissionError extends CommandError {
  constructor(message, userMessage) {
    super(message, userMessage, true, 'info');
    this.name = 'PermissionError';
  }
}

/**
 * Custom error class for API errors
 */
class APIError extends CommandError {
  constructor(message, userMessage, apiName) {
    super(message, userMessage, false, 'error');
    this.name = 'APIError';
    this.apiName = apiName;
  }
}

/**
 * Handle command errors with user-friendly messages
 * @param {Interaction} interaction - Discord interaction
 * @param {Error} error - Error object
 * @returns {Promise<void>}
 */
async function handleCommandError(interaction, error) {
  // Log error with appropriate level
  const logLevel = error.logLevel || 'error';
  const errorId = error.errorId || uuidv4().split('-')[0];
  
  logger[logLevel](`Command error [${errorId}]:`, {
    error: error.message,
    stack: error.stack,
    command: interaction.commandName || interaction.customId,
    user: interaction.user.tag,
    guild: interaction.guild?.name,
    errorType: error.name
  });

  // Determine user message
  let userMessage = error.userMessage || 'An unexpected error occurred. Please try again later.';
  
  // Add error ID for non-validation errors
  if (!(error instanceof ValidationError)) {
    userMessage += `\n\nError ID: \`${errorId}\``;
  }

  // Create error embed
  const embed = new EmbedBuilder()
    .setColor(getErrorColor(error))
    .setTitle(getErrorTitle(error))
    .setDescription(userMessage)
    .setTimestamp();

  // Add footer for serious errors
  if (error instanceof APIError || error.logLevel === 'error') {
    embed.setFooter({ text: 'If this persists, contact support with the error ID' });
  }

  // Send error message
  try {
    const replyOptions = {
      embeds: [embed],
      ephemeral: error.ephemeral !== undefined ? error.ephemeral : true
    };

    if (interaction.deferred) {
      await interaction.editReply(replyOptions);
    } else if (interaction.replied) {
      await interaction.followUp(replyOptions);
    } else {
      await interaction.reply(replyOptions);
    }
  } catch (replyError) {
    logger.error('Failed to send error message:', replyError);
  }
}

/**
 * Get error color based on error type
 * @param {Error} error - Error object
 * @returns {number} Color hex
 */
function getErrorColor(error) {
  if (error instanceof ValidationError) return 0xffa500; // Orange
  if (error instanceof PermissionError) return 0x3498db; // Blue
  if (error instanceof APIError) return 0xe74c3c; // Red
  return 0xe74c3c; // Red (default)
}

/**
 * Get error title based on error type
 * @param {Error} error - Error object
 * @returns {string} Title
 */
function getErrorTitle(error) {
  if (error instanceof ValidationError) return 'Invalid Input';
  if (error instanceof PermissionError) return 'Permission Denied';
  if (error instanceof APIError) return 'Service Unavailable';
  return 'Command Error';
}

/**
 * Wrap command execution with error handling
 * @param {Function} commandFn - Command function to execute
 * @param {Interaction} interaction - Discord interaction
 * @param {Client} client - Discord client
 * @returns {Promise<void>}
 */
async function withErrorHandling(commandFn, interaction, client) {
  try {
    await commandFn(interaction, client);
  } catch (error) {
    await handleCommandError(interaction, error);
  }
}

/**
 * Create a safe error message for users (no sensitive info)
 * @param {Error} error - Error object
 * @returns {string} Safe error message
 */
function getSafeErrorMessage(error) {
  // Don't expose internal errors to users
  if (error.userMessage) return error.userMessage;
  
  // Generic messages for common errors
  if (error.message.includes('Missing Permissions')) {
    return 'I don\'t have the required permissions to perform this action.';
  }
  if (error.message.includes('Unknown')) {
    return 'The requested resource was not found.';
  }
  if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
    return 'The request timed out. Please try again.';
  }
  
  return 'An unexpected error occurred. Please try again later.';
}

module.exports = {
  CommandError,
  ValidationError,
  PermissionError,
  APIError,
  handleCommandError,
  withErrorHandling,
  getSafeErrorMessage
};
