const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);

// Watch the entire workspace root so Metro can resolve shared/ packages
config.watchFolders = [workspaceRoot];

// Resolve node_modules from both mobile/ and the hoisted workspace root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

config.resolver.sourceExts.push("sql");

module.exports = withNativeWind(config, { input: "./global.css" });
