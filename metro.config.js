const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 1. Add Wasm asset support for expo-sqlite web compilation
config.resolver.assetExts.push('wasm');

// 2. Add Cross-Origin headers to support SharedArrayBuffer on Web (required by expo-sqlite)
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    return middleware(req, res, next);
  };
};

module.exports = config;
