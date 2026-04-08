import { http } from '@/services/http';
import type { NearbySummary, NearbyUser } from '@/types/domain';

export async function listNearbyUsers(radiusMeters?: number, sameVenueOnly?: boolean) {
  const { data } = await http.get<{ users: NearbyUser[]; summary: NearbySummary }>(
    '/api/nearby/users',
    { params: { ...(radiusMeters ? { radiusMeters } : {}), ...(sameVenueOnly ? { sameVenueOnly: true } : {}) } }
  );

  return data;
}
