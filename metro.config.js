const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts = ['js', 'json', 'ts', 'tsx', 'jsx'];
config.transformer.minifierPath = 'metro-minify-terser';
config.transformer.minifierConfig = {
  compress: {
    drop_console: false,
  },
};

// Resolve iceberg-js to an empty module
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'iceberg-js') {
    return {
      filePath: __dirname + '/node_modules/iceberg-js/package.json',
      type: 'empty',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

