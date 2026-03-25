const { ValidationError } = require('./errorHandler');

/**
 * Validation utilities for user input
 */

const validators = {
  /**
   * Validate username (alphanumeric, underscore, hyphen)
   * @param {string} value - Username to validate
   * @param {number} minLength - Minimum length (default: 3)
   * @param {number} maxLength - Maximum length (default: 20)
   * @returns {string} Validated username
   */
  username: (value, minLength = 3, maxLength = 20) => {
    if (!value || typeof value !== 'string') {
      throw new ValidationError(
        'Username is required',
        'Please provide a valid username.'
      );
    }

    const trimmed = value.trim();

    if (trimmed.length < minLength) {
      throw new ValidationError(
        `Username too short: ${trimmed.length}`,
        `Username must be at least ${minLength} characters long.`
      );
    }

    if (trimmed.length > maxLength) {
      throw new ValidationError(
        `Username too long: ${trimmed.length}`,
        `Username must be at most ${maxLength} characters long.`
      );
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      throw new ValidationError(
        'Username contains invalid characters',
        'Username can only contain letters, numbers, underscores, and hyphens.'
      );
    }

    return trimmed.toLowerCase();
  },

  /**
   * Validate URL
   * @param {string} value - URL to validate
   * @returns {string} Validated URL
   */
  url: (value) => {
    if (!value || typeof value !== 'string') {
      throw new ValidationError(
        'URL is required',
        'Please provide a valid URL.'
      );
    }

    try {
      const url = new URL(value);
      // Only allow http and https
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Invalid protocol');
      }
      return url.href;
    } catch {
      throw new ValidationError(
        'Invalid URL format',
        'Please provide a valid URL (must start with http:// or https://).'
      );
    }
  },

  /**
   * Validate duration string (e.g., "30s", "5m", "2h", "1d")
   * @param {string} value - Duration string
   * @returns {number} Duration in milliseconds
   */
  duration: (value) => {
    if (!value || typeof value !== 'string') {
      throw new ValidationError(
        'Duration is required',
        'Please provide a valid duration.'
      );
    }

    const match = value.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new ValidationError(
        'Invalid duration format',
        'Duration format: 30s, 5m, 2h, 1d (seconds, minutes, hours, days).'
      );
    }

    const [, num, unit] = match;
    const number = parseInt(num);

    if (number <= 0) {
      throw new ValidationError(
        'Duration must be positive',
        'Duration must be greater than 0.'
      );
    }

    const multipliers = {
      s: 1000,
      m: 60000,
      h: 3600000,
      d: 86400000
    };

    return number * multipliers[unit];
  },

  /**
   * Validate number within range
   * @param {any} value - Value to validate
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} Validated number
   */
  number: (value, min = -Infinity, max = Infinity) => {
    const num = Number(value);

    if (isNaN(num)) {
      throw new ValidationError(
        'Invalid number',
        'Please provide a valid number.'
      );
    }

    if (num < min) {
      throw new ValidationError(
        `Number too small: ${num}`,
        `Number must be at least ${min}.`
      );
    }

    if (num > max) {
      throw new ValidationError(
        `Number too large: ${num}`,
        `Number must be at most ${max}.`
      );
    }

    return num;
  },

  /**
   * Validate integer within range
   * @param {any} value - Value to validate
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} Validated integer
   */
  integer: (value, min = -Infinity, max = Infinity) => {
    const num = validators.number(value, min, max);

    if (!Number.isInteger(num)) {
      throw new ValidationError(
        'Not an integer',
        'Please provide a whole number.'
      );
    }

    return num;
  },

  /**
   * Validate string length
   * @param {string} value - String to validate
   * @param {number} minLength - Minimum length
   * @param {number} maxLength - Maximum length
   * @param {string} fieldName - Field name for error messages
   * @returns {string} Validated string
   */
  string: (value, minLength = 1, maxLength = 1000, fieldName = 'Input') => {
    if (value === null || value === undefined) {
      throw new ValidationError(
        `${fieldName} is required`,
        `Please provide ${fieldName.toLowerCase()}.`
      );
    }

    const str = String(value);

    if (str.length < minLength) {
      throw new ValidationError(
        `${fieldName} too short`,
        `${fieldName} must be at least ${minLength} character${minLength !== 1 ? 's' : ''} long.`
      );
    }

    if (str.length > maxLength) {
      throw new ValidationError(
        `${fieldName} too long`,
        `${fieldName} must be at most ${maxLength} character${maxLength !== 1 ? 's' : ''} long.`
      );
    }

    return str;
  },

  /**
   * Validate hex color code
   * @param {string} value - Color code to validate
   * @returns {string} Validated color code
   */
  hexColor: (value) => {
    if (!value || typeof value !== 'string') {
      throw new ValidationError(
        'Color is required',
        'Please provide a valid hex color code.'
      );
    }

    const hex = value.trim().replace(/^#/, '');

    if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
      throw new ValidationError(
        'Invalid hex color',
        'Please provide a valid hex color code (e.g., #FF5733 or FF5733).'
      );
    }

    return `#${hex.toUpperCase()}`;
  },

  /**
   * Validate Discord snowflake ID
   * @param {string} value - ID to validate
   * @param {string} type - Type of ID (user, channel, role, etc.)
   * @returns {string} Validated ID
   */
  snowflake: (value, type = 'ID') => {
    if (!value || typeof value !== 'string') {
      throw new ValidationError(
        `${type} is required`,
        `Please provide a valid ${type.toLowerCase()}.`
      );
    }

    if (!/^\d{17,19}$/.test(value)) {
      throw new ValidationError(
        `Invalid ${type}`,
        `Please provide a valid Discord ${type.toLowerCase()}.`
      );
    }

    return value;
  },

  /**
   * Validate choice from array
   * @param {any} value - Value to validate
   * @param {Array} choices - Valid choices
   * @param {string} fieldName - Field name for error messages
   * @returns {any} Validated choice
   */
  choice: (value, choices, fieldName = 'Option') => {
    if (!choices.includes(value)) {
      throw new ValidationError(
        `Invalid ${fieldName}`,
        `Please choose from: ${choices.join(', ')}`
      );
    }

    return value;
  },

  /**
   * Validate boolean value
   * @param {any} value - Value to validate
   * @returns {boolean} Validated boolean
   */
  boolean: (value) => {
    if (typeof value === 'boolean') return value;

    const str = String(value).toLowerCase();
    const truthy = ['true', 'yes', '1', 'on', 'enable', 'enabled'];
    const falsy = ['false', 'no', '0', 'off', 'disable', 'disabled'];

    if (truthy.includes(str)) return true;
    if (falsy.includes(str)) return false;

    throw new ValidationError(
      'Invalid boolean',
      'Please provide yes/no, true/false, or enable/disable.'
    );
  },

  /**
   * Validate email address
   * @param {string} value - Email to validate
   * @returns {string} Validated email
   */
  email: (value) => {
    if (!value || typeof value !== 'string') {
      throw new ValidationError(
        'Email is required',
        'Please provide a valid email address.'
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new ValidationError(
        'Invalid email format',
        'Please provide a valid email address.'
      );
    }

    return value.toLowerCase().trim();
  }
};

module.exports = validators;
