import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { env } from '@/config/env';

function canUseNativeRuntime() {
  return Platform.OS !== 'web' && Constants.appOwnership !== 'expo';
}

export function getGoogleSignInAvailability() {
  const hasRequiredClientIds = Boolean(env.googleWebClientId) && (Platform.OS !== 'ios' || Boolean(env.googleIosClientId));

  return {
    isAvailable: canUseNativeRuntime() && hasRequiredClientIds,
    requiresDevBuild: Constants.appOwnership === 'expo',
    hasRequiredClientIds,
  };
}

let configured = false;

export async function signInWithGoogleNative() {
  const { isAvailable, requiresDevBuild, hasRequiredClientIds } = getGoogleSignInAvailability();

  if (requiresDevBuild) {
    throw new Error('Google Sign-In exige um development build ou app publicada. No Expo Go, continue usando e-mail.');
  }

  if (!hasRequiredClientIds) {
    throw new Error('Configure EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID e EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID antes de testar o Google Sign-In.');
  }

  if (!isAvailable) {
    throw new Error('Google Sign-In nao esta disponivel neste runtime.');
  }

  const googleSignInModule = await import('@react-native-google-signin/google-signin');
  const { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } = googleSignInModule;

  if (!configured) {
    GoogleSignin.configure({
      webClientId: env.googleWebClientId,
      iosClientId: env.googleIosClientId || undefined,
      offlineAccess: false,
    });
    configured = true;
  }

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();

    if (!isSuccessResponse(response)) {
      throw new Error('Login com Google cancelado.');
    }

    const idToken = response.data.idToken;

    if (!idToken) {
      throw new Error('Google nao retornou idToken para autenticar no NearMe.');
    }

    return {
      idToken,
      profile: response.data.user,
    };
  } catch (error: unknown) {
    if (isErrorWithCode(error)) {
      if (error.code === statusCodes.IN_PROGRESS) {
        throw new Error('Ja existe um login com Google em andamento.');
      }

      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play Services nao esta disponivel neste dispositivo.');
      }
    }

    throw error;
  }
}
