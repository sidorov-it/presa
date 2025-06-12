// Global polyfill for "self is not defined" error
// This file is loaded via NODE_OPTIONS --require before any other code runs

if (typeof global !== 'undefined' && typeof global.self === 'undefined') {
    global.self = global;
    // Polyfill applied silently
}

// Export empty object to satisfy Node.js require
module.exports = {}; 