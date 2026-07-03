/** @type {import('expo/config').ExpoConfig} */
const appJson = require("./app.json");

module.exports = () => ({
  ...appJson.expo,
  extra: {
    ...appJson.expo.extra,
    apiHost: process.env.EXPO_PUBLIC_API_HOST || "https://ai-marketplace-delta-five.vercel.app",
  },
});
