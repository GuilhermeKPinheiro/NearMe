import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import type { Profile, User } from '@/types/domain';

const TOKEN_KEY = 'nearme.token';
const ONBOARDING_KEY = 'nearme.onboarding';
const VISIBILITY_KEY = 'nearme.visibility';
const SNAPSHOT_KEY = 'nearme.snapshot';
const PUSH_TOKEN_KEY = 'nearme.push-token';

type SessionSnapshot = {
  user: User | null;
  profile: Profile | null;
};

let tokenCache: string | null = null;
let tokenLoaded = false;
let onboardingCache: boolean | null = null;
let visibilityCache: boolean | null = null;
let snapshotCache: SessionSnapshot | null = null;
let snapshotLoaded = false;
let pushTokenCache: string | null = null;
let pushTokenLoaded = false;

export const sessionStorage = {
  async getToken() {
    if (tokenLoaded) {
      return tokenCache;
    }

    tokenCache = await SecureStore.getItemAsync(TOKEN_KEY);
    tokenLoaded = true;
    return tokenCache;
  },
  async setToken(token: string) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    tokenCache = token;
    tokenLoaded = true;
  },
  async clearToken() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    tokenCache = null;
    tokenLoaded = true;
  },
  async getOnboardingSeen() {
    if (onboardingCache !== null) {
      return onboardingCache;
    }

    onboardingCache = (await AsyncStorage.getItem(ONBOARDING_KEY)) === 'true';
    return onboardingCache;
  },
  async setOnboardingSeen() {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    onboardingCache = true;
  },
  async getVisibility() {
    if (visibilityCache !== null) {
      return visibilityCache;
    }

    visibilityCache = (await AsyncStorage.getItem(VISIBILITY_KEY)) === 'true';
    return visibilityCache;
  },
  async setVisibility(value: boolean) {
    await AsyncStorage.setItem(VISIBILITY_KEY, value ? 'true' : 'false');
    visibilityCache = value;
  },
  async getSnapshot(): Promise<SessionSnapshot | null> {
    if (snapshotLoaded) {
      return snapshotCache;
    }

    const raw = await AsyncStorage.getItem(SNAPSHOT_KEY);
    snapshotCache = raw ? (JSON.parse(raw) as SessionSnapshot) : null;
    snapshotLoaded = true;
    return snapshotCache;
  },
  async setSnapshot(snapshot: SessionSnapshot) {
    await AsyncStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
    snapshotCache = snapshot;
    snapshotLoaded = true;
  },
  async clearSnapshot() {
    await AsyncStorage.removeItem(SNAPSHOT_KEY);
    snapshotCache = null;
    snapshotLoaded = true;
  },
  async getPushToken() {
    if (pushTokenLoaded) {
      return pushTokenCache;
    }

    pushTokenCache = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
    pushTokenLoaded = true;
    return pushTokenCache;
  },
  async setPushToken(token: string) {
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
    pushTokenCache = token;
    pushTokenLoaded = true;
  },
  async clearPushToken() {
    await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
    pushTokenCache = null;
    pushTokenLoaded = true;
  }
};
