import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.studyos.app',
  appName: 'PhoneTools',
  webDir: 'dist-mobile',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https'
  },
  ios: {
    contentInset: 'automatic'
  },
  android: {
    buildOptions: {}
  }
}

export default config
