// Makes the Firebase JS SDK load correctly in React Native
// (fixes "Component auth has not been registered yet").
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

if (!config.resolver.sourceExts.includes("cjs")) {
  config.resolver.sourceExts.push("cjs");
}
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
