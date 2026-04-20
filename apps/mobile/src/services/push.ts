import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { env } from '@/config/env';
import { debugLog } from '@/services/diagnostics';
import { deactivatePushDevice, registerPushDevice } from '@/services/notifications';
import { sessionStorage } from '@/state/session-storage';

function getProjectId() {
  return (
    env.expoProjectId ||
    Constants.easConfig?.projectId ||
    (Constants.expoConfig?.extra?.eas?.projectId as string | undefined) ||
    ''
  );
}

function isExpoGo() {
  return Constants.executionEnvironment === 'storeClient' || Constants.appOwnership === 'expo';
}

async function loadNotificationsModule() {
  return import('expo-notifications');
}

async function getStoredPushToken() {
  return sessionStorage.getPushToken();
}

export async function configurePushNotifications() {
  if (isExpoGo()) {
    debugLog('push', 'configureSkipped', { reason: 'expoGo' });
    return;
  }

  const Notifications = await loadNotificationsModule();

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#e4cf8c',
    });
  }
}

export async function ensurePushDeviceRegistered() {
  if (isExpoGo()) {
    debugLog('push', 'registerSkipped', { reason: 'expoGo' });
    return null;
  }

  if (!Device.isDevice) {
    debugLog('push', 'registerSkipped', { reason: 'simulator' });
    return null;
  }

  const projectId = getProjectId();

  if (!projectId) {
    debugLog('push', 'registerSkipped', { reason: 'missingProjectId' }, 'error');
    return null;
  }

  const Notifications = await loadNotificationsModule();
  const permissionState = await Notifications.getPermissionsAsync();
  let finalStatus = permissionState.status;

  if (finalStatus !== 'granted') {
    const requestState = await Notifications.requestPermissionsAsync();
    finalStatus = requestState.status;
  }

  if (finalStatus !== 'granted') {
    debugLog('push', 'registerSkipped', { reason: 'permissionDenied' });
    return null;
  }

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  const storedToken = await getStoredPushToken();

  if (storedToken === token) {
    await registerPushDevice({
      token,
      platform: Platform.OS,
      deviceName: Device.deviceName ?? undefined,
      appBuild: Constants.expoConfig?.version ?? undefined,
    });
    return token;
  }

  await registerPushDevice({
    token,
    platform: Platform.OS,
    deviceName: Device.deviceName ?? undefined,
    appBuild: Constants.expoConfig?.version ?? undefined,
  });
  await sessionStorage.setPushToken(token);
  debugLog('push', 'registerSuccess', { platform: Platform.OS });

  return token;
}

export async function unregisterCurrentPushDevice() {
  const token = await getStoredPushToken();

  if (!token) {
    return;
  }

  try {
    await deactivatePushDevice(token);
  } finally {
    await sessionStorage.clearPushToken();
  }
}
