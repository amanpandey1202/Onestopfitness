import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.powerhousefitness.members",
  appName: "Powerhouse Fitness",

  server: {
    url: "https://onestopfitness-pink.vercel.app",
    cleartext: false,
    androidScheme: "https",
  },

  android: {
    backgroundColor: "#0C1010",
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 1000,
      backgroundColor: "#0C1010",
      androidSplashResourceName: "splash",
      showSpinner: false,
      launchAutoHide: true,
      splashFullScreen: true,
      splashImmersive: true,
    },
    LocalNotifications: {
      smallIcon: "ic_notification",
      iconColor: "#9AD901",
      sound: "default",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#0C1010",
    },
  },
};

export default config;
