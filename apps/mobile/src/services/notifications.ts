import { http } from '@/services/http';
import type { NotificationItem } from '@/types/domain';

export async function listNotifications(): Promise<NotificationItem[]> {
  const { data } = await http.get<{ notifications: NotificationItem[] }>('/api/notifications');
  return data.notifications;
}

export async function markNotificationsAsRead() {
  const { data } = await http.post<{ success: boolean }>('/api/notifications/read');
  return data.success;
}

type RegisterPushDeviceInput = {
  token: string;
  platform: string;
  deviceName?: string;
  appBuild?: string;
};

export async function registerPushDevice(input: RegisterPushDeviceInput) {
  const { data } = await http.post<{ success: boolean }>('/api/notifications/push-devices', input);
  return data.success;
}

export async function deactivatePushDevice(token: string) {
  const { data } = await http.post<{ success: boolean }>('/api/notifications/push-devices/deactivate', { token });
  return data.success;
}
