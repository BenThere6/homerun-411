// babel.config.js
module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: '.env',
        safe: false,           // set to true only if you use .env.example
        allowUndefined: true,  // avoids build failing if a var is missing
      },
    ],
  ],
};