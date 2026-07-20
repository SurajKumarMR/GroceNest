module.exports = {
  preset: 'react-native',
  setupFiles: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|@react-native-community|@stripe/stripe-react-native|@react-native-async-storage|react-native-image-picker|@react-native-google-signin/google-signin|react-native-maps|react-native-svg|react-native-gesture-handler)/)',
  ],
};
