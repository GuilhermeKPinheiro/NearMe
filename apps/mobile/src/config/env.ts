import Constants from 'expo-constants';

type AppConfig = {
  apiUrl: string;
  appEnv: string;
  useMockApi: boolean;
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
const appEnv = process.env.EXPO_PUBLIC_APP_ENV?.trim() ?? 'local';

export const env: AppConfig = {
  apiUrl,
  appEnv,
  useMockApi: apiUrl.length === 0
};
