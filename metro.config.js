const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add cjs and mjs to source extensions for modern packages
config.resolver.sourceExts = ['js', 'json', 'ts', 'tsx', 'jsx', 'cjs', 'mjs'];

module.exports = config;
