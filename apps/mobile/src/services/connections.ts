import { http } from '@/services/http';
import type { ConnectionState } from '@/types/domain';

export async function listConnectionState() {
  const { data } = await http.get<ConnectionState>('/api/connections/requests');
  return data;
}

export async function sendConnectionRequest(toUserId: string) {
  const { data } = await http.post<{ request: { id: string } }>('/api/connections/request', { toUserId });
  return data;
}

export async function acceptConnectionRequest(id: string) {
  const { data } = await http.post<{ request: { id: string } }>(`/api/connections/${id}/accept`);
  return data;
}

export async function rejectConnectionRequest(id: string) {
  const { data } = await http.post<{ request: { id: string } }>(`/api/connections/${id}/reject`);
  return data;
}
