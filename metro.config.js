const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 修复 MessagePack 和 TypeScript 解析问题
config.resolver.unstable_enablePackageExports = false;

// 确保正确的 babel 转译
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    compress: {
      ...config.transformer?.minifierConfig?.compress,
      pure_getters: true,
    },
  },
};

module.exports = config;
