/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
/**
 * Global polyfills for build-time environment compatibility
 */

// Prevent self reference errors in server-side builds
if (typeof global !== 'undefined' && typeof global.self === 'undefined') {
    global.self = global;
}

// Ensure URL constructor has proper fallback
if (typeof global !== 'undefined' && !global.URL && typeof require !== 'undefined') {
    try {
        global.URL = require('url').URL;
    } catch {
        // Fallback if URL is not available
        console.warn('URL polyfill not available, using basic fallback');
    }
}

// Set default environment variables for build if not present
if (!process.env.NEXTAUTH_URL) {
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
}

// Prevent Node.js-specific modules from breaking in edge runtime
if (typeof global !== 'undefined') {
    global.EdgeRuntime = global.EdgeRuntime || undefined;
}

// Export empty object to satisfy Node.js require
module.exports = {};
