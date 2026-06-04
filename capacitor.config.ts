import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aroinvestment.crm',
  appName: 'ARO CRM',
  webDir: 'build',
  server: {
    url: 'https://crm-aro.com',
    cleartext: false
  },
  plugins: {
    PrivacyScreen: {
      enable: true,
      imageName: 'Splash',
      preventScreenshots: true,
      contentMode: 'scaleAspectFit'
    },
    FirebaseMessaging: {
      presentationOptions: []
    }
  }
};

export default config;
