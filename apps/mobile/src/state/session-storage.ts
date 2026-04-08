import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import type { Profile, User } from '@/types/domain';

const TOKEN_KEY = 'nearme.token';
const ONBOARDING_KEY = 'nearme.onboarding';
const VISIBILITY_KEY = 'nearme.visibility';
const SNAPSHOT_KEY = 'nearme.snapshot';

type SessionSnapshot = {
  user: User | null;
  profile: Profile | null;
};

export const sessionStorage = {
  async getToken() {
    return SecureStore.getItemAsync(TOKEN_KEY);
  },
  async setToken(token: string) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },
  async clearToken() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },
  async getOnboardingSeen() {
    return (await AsyncStorage.getItem(ONBOARDING_KEY)) === 'true';
  },
  async setOnboardingSeen() {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  },
  async getVisibility() {
    return (await AsyncStorage.getItem(VISIBILITY_KEY)) === 'true';
  },
  async setVisibility(value: boolean) {
    await AsyncStorage.setItem(VISIBILITY_KEY, value ? 'true' : 'false');
  },
  async getSnapshot(): Promise<SessionSnapshot | null> {
    const raw = await AsyncStorage.getItem(SNAPSHOT_KEY);
    return raw ? (JSON.parse(raw) as SessionSnapshot) : null;
  },
  async setSnapshot(snapshot: SessionSnapshot) {
    await AsyncStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
  },
  async clearSnapshot() {
    await AsyncStorage.removeItem(SNAPSHOT_KEY);
  }
};
