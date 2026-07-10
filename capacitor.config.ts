import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.cyberfin.app",
  appName: "CyberFin",
  webDir: "dist",
  backgroundColor: "#0A0B0D",
  server: {
    androidScheme: "https",
  },
  android: {
    backgroundColor: "#0A0B0D",
  },
};

export default config;
