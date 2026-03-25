const fetch = require('node-fetch');

/**
 * Image validator for Discord bot configuration
 * Validates image format, size, and downloads images for upload
 */
class ImageValidator {
    constructor() {
        // Cache validation results for 5 minutes
        this.cache = new Map();
        this.cacheTimeout = 300000; // 5 minutes
        
        // Valid image formats with magic numbers
        this.validFormats = {
            png: [0x89, 0x50, 0x4E, 0x47],
            jpg: [0xFF, 0xD8, 0xFF],
            gif: [0x47, 0x49, 0x46],
            webp: [0x52, 0x49, 0x46, 0x46]
        };
        
        // Maximum file size (8MB for Discord)
        this.maxSize = 8 * 1024 * 1024;
        
        // Download timeout (10 seconds)
        this.downloadTimeout = 10000;
    }

    /**
     * Validate image from URL or data URI
     * @param {string} imageUrl - Image URL or data URI
     * @returns {Promise<Object>} - { valid: boolean, error: string | null, buffer: Buffer | null }
     */
    async validateImage(imageUrl) {
        // Check cache
        const cached = this.cache.get(imageUrl);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.result;
        }

        let buffer;

        // Check if data URI or URL
        if (imageUrl.startsWith('data:')) {
            const result = this.parseDataURI(imageUrl);
            if (!result.valid) {
                return this.cacheResult(imageUrl, result);
            }
            buffer = result.buffer;
        } else {
            const result = await this.downloadImage(imageUrl);
            if (!result.valid) {
                return this.cacheResult(imageUrl, result);
            }
            buffer = result.buffer;
        }

        // Validate file size
        const sizeResult = this.checkFileSize(buffer);
        if (!sizeResult.valid) {
            return this.cacheResult(imageUrl, sizeResult);
        }

        // Validate format using magic numbers
        const formatResult = this.checkFormat(buffer);
        if (!formatResult.valid) {
            return this.cacheResult(imageUrl, formatResult);
        }

        const result = { valid: true, error: null, buffer: buffer };
        return this.cacheResult(imageUrl, result);
    }

    /**
     * Parse data URI and extract buffer
     * @param {string} dataUri - Data URI string
     * @returns {Object} - { valid: boolean, error: string | null, buffer: Buffer | null }
     */
    parseDataURI(dataUri) {
        const matches = dataUri.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!matches) {
            return { valid: false, error: 'Invalid data URI format', buffer: null };
        }

        const [, format, data] = matches;
        
        try {
            const buffer = Buffer.from(data, 'base64');
            return { valid: true, error: null, buffer: buffer };
        } catch (error) {
            return { valid: false, error: `Failed to decode base64: ${error.message}`, buffer: null };
        }
    }

    /**
     * Download image from URL
     * @param {string} url - Image URL
     * @returns {Promise<Object>} - { valid: boolean, error: string | null, buffer: Buffer | null }
     */
    async downloadImage(url) {
        // SSRF protection - block internal IP addresses
        try {
            const urlObj = new URL(url);
            const hostname = urlObj.hostname;
            
            // Block localhost and private IP ranges
            const blockedHosts = [
                'localhost',
                '127.0.0.1',
                '0.0.0.0',
                '::1'
            ];
            
            if (blockedHosts.includes(hostname)) {
                return { valid: false, error: 'Cannot fetch images from localhost', buffer: null };
            }
            
            // Block private IP ranges (basic check)
            if (hostname.startsWith('192.168.') || 
                hostname.startsWith('10.') || 
                hostname.startsWith('172.16.') ||
                hostname.startsWith('172.17.') ||
                hostname.startsWith('172.18.') ||
                hostname.startsWith('172.19.') ||
                hostname.startsWith('172.20.') ||
                hostname.startsWith('172.21.') ||
                hostname.startsWith('172.22.') ||
                hostname.startsWith('172.23.') ||
                hostname.startsWith('172.24.') ||
                hostname.startsWith('172.25.') ||
                hostname.startsWith('172.26.') ||
                hostname.startsWith('172.27.') ||
                hostname.startsWith('172.28.') ||
                hostname.startsWith('172.29.') ||
                hostname.startsWith('172.30.') ||
                hostname.startsWith('172.31.')) {
                return { valid: false, error: 'Cannot fetch images from private IP addresses', buffer: null };
            }
        } catch (error) {
            return { valid: false, error: `Invalid URL: ${error.message}`, buffer: null };
        }

        // Download with timeout
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), this.downloadTimeout);

            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; DiscordBot/1.0)'
                }
            });

            clearTimeout(timeout);

            if (!response.ok) {
                return { valid: false, error: `Failed to fetch image: HTTP ${response.status}`, buffer: null };
            }

            const buffer = await response.buffer();
            return { valid: true, error: null, buffer: buffer };
        } catch (error) {
            if (error.name === 'AbortError') {
                return { valid: false, error: 'Image download timed out (10 second limit)', buffer: null };
            }
            return { valid: false, error: `Network error: ${error.message}`, buffer: null };
        }
    }

    /**
     * Check if file size is within limits
     * @param {Buffer} buffer - Image buffer
     * @returns {Object} - { valid: boolean, error: string | null }
     */
    checkFileSize(buffer) {
        if (buffer.length > this.maxSize) {
            const sizeMB = (buffer.length / 1024 / 1024).toFixed(2);
            return {
                valid: false,
                error: `Image too large: ${sizeMB}MB (maximum: 8MB). Please compress the image.`
            };
        }
        return { valid: true, error: null };
    }

    /**
     * Check if image format is valid using magic numbers
     * @param {Buffer} buffer - Image buffer
     * @returns {Object} - { valid: boolean, error: string | null }
     */
    checkFormat(buffer) {
        let isValidFormat = false;
        
        for (const [format, signature] of Object.entries(this.validFormats)) {
            if (signature.every((byte, i) => buffer[i] === byte)) {
                isValidFormat = true;
                break;
            }
        }

        if (!isValidFormat) {
            return {
                valid: false,
                error: 'Invalid image format. Supported formats: PNG, JPG, GIF, WebP'
            };
        }

        return { valid: true, error: null };
    }

    /**
     * Download and buffer image for Discord API
     * @param {string} imageUrl - Image URL or data URI
     * @returns {Promise<Buffer>} - Image buffer
     */
    async downloadAndBuffer(imageUrl) {
        const result = await this.validateImage(imageUrl);
        if (!result.valid) {
            throw new Error(result.error);
        }
        return result.buffer;
    }

    /**
     * Cache validation result
     * @param {string} imageUrl - Image URL
     * @param {Object} result - Validation result
     * @returns {Object} - Cached result
     */
    cacheResult(imageUrl, result) {
        this.cache.set(imageUrl, {
            result: result,
            timestamp: Date.now()
        });
        return result;
    }
}

module.exports = ImageValidator;
