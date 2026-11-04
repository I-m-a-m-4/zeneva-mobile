const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

// Disable Expo Router routing so Metro only packages App.tsx and native screens
delete process.env.EXPO_ROUTER_APP_ROOT;

module.exports = config;
