import { http } from '@/services/http';
import type { VisibilitySession } from '@/types/domain';
import type { DeviceLocation } from '@/services/location';

export async function startVisibilitySession(location?: DeviceLocation) {
  const { data } = await http.post<{ isVisible: boolean; session: VisibilitySession }>('/api/visibility/start', location);
  return data;
}

export async function stopVisibilitySession() {
  const { data } = await http.post<{ isVisible: boolean; session: VisibilitySession | null }>('/api/visibility/stop');
  return data;
}

export async function leaveVenueSession() {
  const { data } = await http.post<{ isVisible: boolean; session: VisibilitySession | null }>('/api/visibility/leave-venue');
  return data;
}

export async function getVisibilityStatus() {
  const { data } = await http.get<{ isVisible: boolean; session: VisibilitySession | null }>('/api/visibility/status');
  return data;
}

export async function updateVisibilityLocation(location: DeviceLocation) {
  const { data } = await http.post<{ isVisible: boolean; session: VisibilitySession | null }>(
    '/api/visibility/location',
    location
  );
  return data;
}
