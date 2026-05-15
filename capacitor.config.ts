import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aroinvestment.crm',
  appName: 'ARO CRM',
  webDir: 'build',
  server: {
    url: 'https://crm-aro.com',
    cleartext: false
  }
};

export default config;
