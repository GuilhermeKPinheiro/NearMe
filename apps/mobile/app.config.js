const appJson = require('./app.json');

function reverseGoogleClientId(clientId) {
  if (!clientId) {
    return '';
  }

  return clientId.split('.').reverse().join('.');
}

const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() ?? '';
const iosUrlScheme = reverseGoogleClientId(iosClientId);

module.exports = {
  expo: {
    ...appJson.expo,
    plugins: [
      ...appJson.expo.plugins,
      iosUrlScheme
        ? [
            '@react-native-google-signin/google-signin',
            {
              iosUrlScheme,
            },
          ]
        : '@react-native-google-signin/google-signin',
    ],
  },
};
