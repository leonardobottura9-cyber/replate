module.exports = {
  expo: {
    name: 'Replate',
    slug: 'recipe-vault',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: './assets/icon.png',
      resizeMode: 'contain',
      backgroundColor: '#1A3C34',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.leonardobottura.replate',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/icon.png',
        backgroundColor: '#1A3C34',
      },
      package: 'com.replate.app',
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      favicon: './assets/icon.png',
    },
    plugins: ['expo-secure-store', 'expo-font'],
    extra: {
      eas: {
        projectId: '4e518160-17e7-4b64-9edb-3b7b47db7d29',
      },
      supabaseUrl: 'https://vlnqnrknzlxletgunqaa.supabase.co',
      supabaseAnonKey: 'sb_publishable_4hUUpvrMa-4ntLDbkRY2_Q_qGCYSJC2',
      anthropicApiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY,
    },
    owner: 'leo.replate',
  },
};
