// metro.config.js
// Expo requires extending @expo/metro-config for reliable prod builds.

const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// ---- OPTIONAL CUSTOMIZATIONS ----
// If you use SVGs as React components:
//   npm i -D react-native-svg-transformer
//   npm i react-native-svg
// Then uncomment this block:
//
// config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');
// config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'svg');
// config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg'];

// If you have extra asset/file extensions, you can push them, e.g.:
// config.resolver.assetExts = [...config.resolver.assetExts, 'db', 'mp3'];

// If you need to include monorepo/workspaces, map them here (example):
// config.watchFolders = [path.resolve(projectRoot, '../shared')];

module.exports = config;