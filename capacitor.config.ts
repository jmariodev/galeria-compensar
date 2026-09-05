import { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: "io.ionic.demo.pg.cap.ng",
  appName: "GaleriaCompensar",
  npmClient: "npm",
  webDir: "www",
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#FF6600",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    StatusBar: {
      backgroundColor: "#FFFFFF",
      style: "LIGHT",
      overlaysWebView: false,
    },
  },
};

export default config;
