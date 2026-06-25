import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.siligurifreshmart.app',
  appName: 'Siliguri Fresh Mart',
  webDir: '.next',
  server: {
    url: 'https://www.siligurifreshmart.com',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
