import Constants from 'expo-constants';

type AppConfig = {
  apiUrl: string;
  socketUrl: string;
  appEnv: string;
  useMockApi: boolean;
  expoProjectId: string;
  googleAndroidClientId: string;
  googleIosClientId: string;
  googleWebClientId: string;
};

function getExpoHost() {
  const hostUri = Constants.expoConfig?.hostUri ?? Constants.linkingUri;
  const host = hostUri?.replace(/^.*:\/\//, '').split(':')[0];
  return host && host !== 'localhost' ? host : null;
}

function normalizeApiUrl(rawUrl: string) {
  if (!rawUrl.includes('localhost')) {
    return rawUrl;
  }

  const expoHost = getExpoHost();

  if (!expoHost) {
    return rawUrl;
  }

  return rawUrl.replace('localhost', expoHost);
}

const apiUrl = normalizeApiUrl(process.env.EXPO_PUBLIC_API_URL?.trim() ?? '');
const socketUrl = normalizeApiUrl(process.env.EXPO_PUBLIC_SOCKET_URL?.trim() ?? apiUrl);
const appEnv = process.env.EXPO_PUBLIC_APP_ENV?.trim() ?? 'local';
const expoProjectId = process.env.EXPO_PUBLIC_EXPO_PROJECT_ID?.trim() ?? '';
const googleAndroidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() ?? '';
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() ?? '';
const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ?? '';

export const env: AppConfig = {
  apiUrl,
  socketUrl,
  appEnv,
  useMockApi: apiUrl.length === 0,
  expoProjectId,
  googleAndroidClientId,
  googleIosClientId,
  googleWebClientId
};
