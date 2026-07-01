/** @type {import('expo/config').ExpoConfig} */
const appJson = require("./app.json");

module.exports = () => ({
  ...appJson.expo,
  extra: {
    ...appJson.expo.extra,
    apiHost: process.env.EXPO_PUBLIC_API_HOST || "http://192.168.1.5:3000",
  },
});
