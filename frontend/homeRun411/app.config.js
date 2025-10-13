// app.config.js
import 'dotenv/config';

export default ({ config }) => {
  // Determine which profile is building on EAS; falls back to dev
  const profile = process.env.EAS_BUILD_PROFILE || 'development';

  // Choose the URL:
  //  - In EAS prod builds: we’ll provide BACKEND_URL via EAS Variables
  //  - Locally: it can come from your .env
  const BACKEND_URL =
    process.env.BACKEND_URL ||
    (profile === 'production'
      ? 'https://homerun-411.onrender.com' // fallback for safety
      : 'http://localhost:5001');

  return {
    expo: {
      name: "HomeRun411",
      slug: "homeRun411",
      scheme: "homerun411",
      version: "1.0.0",
      platforms: ["ios", "android"],
      orientation: "portrait",
      icon: "./assets/icon.png",
      userInterfaceStyle: "light",
      newArchEnabled: true,
      runtimeVersion: { policy: "sdkVersion" },
      splash: {
        image: "./assets/splash.png",
        resizeMode: "contain",
        backgroundColor: "#ffffff"
      },
      ios: {
        supportsTablet: true,
        bundleIdentifier: "com.benthere7.homeRun411",
        buildNumber: "1.0.0",
        infoPlist: {
          NSLocationWhenInUseUsageDescription: "We use your location to show nearby parks and distances.",
          NSCameraUsageDescription: "We use your camera to take profile photos or attach images.",
          NSPhotoLibraryUsageDescription: "We use your photo library for selecting profile pictures and attachments.",
          ITSAppUsesNonExemptEncryption: false
        }
      },
      android: {
        adaptiveIcon: {
          foregroundImage: "./assets/adaptive-icon.png",
          backgroundColor: "#ffffff"
        },
        package: "com.benthere7.homeRun411"
      },
      web: {
        favicon: "./assets/favicon.png"
      },
      plugins: ["expo-font"],
      extra: {
        eas: { projectId: "28c1b134-de87-4ced-abb2-a68b218c1c13" },
        BACKEND_URL
      },
      owner: "benthere7",
      updates: { url: "https://u.expo.dev/28c1b134-de87-4ced-abb2-a68b218c1c13" }
    }
  };
};