import { http } from '@/services/http';
import type { Venue } from '@/types/domain';

export type CreateVenueDraft = {
  name: string;
  description: string;
  coverImageUrl: string;
  city: string;
  locationLabel: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  privacy: 'PUBLIC' | 'INVITE_ONLY';
};

export async function listActiveVenues() {
  const { data } = await http.get<{ venues: Venue[] }>('/api/venues/active');
  return data.venues;
}

export async function listPublicVenues() {
  const { data } = await http.get<{ venues: Venue[] }>('/api/venues/public');
  return data.venues;
}

export async function listInviteOnlyVenues() {
  const { data } = await http.get<{ venues: Venue[] }>('/api/venues/invite-only');
  return data.venues;
}

export async function listMyVenues() {
  const { data } = await http.get<{ venues: Venue[] }>('/api/venues/mine');
  return data.venues;
}

export async function createVenue(draft: CreateVenueDraft) {
  const { data } = await http.post<{ venue: Venue }>('/api/venues', draft);
  return data.venue;
}

export async function updateVenue(venueId: string, draft: Partial<CreateVenueDraft> & { isActive?: boolean }) {
  const { data } = await http.patch<{ venue: Venue }>(`/api/venues/${venueId}`, draft);
  return data.venue;
}

export async function endVenue(venueId: string) {
  const { data } = await http.post<{ venue: Venue }>(`/api/venues/${venueId}/end`);
  return data.venue;
}

export async function resolveVenueEntry(code: string) {
  const { data } = await http.post<{ venue: Venue }>('/api/venues/resolve-entry', { code });
  return data.venue;
}

export async function confirmVenueEntry(venueId: string) {
  const { data } = await http.post('/api/venues/confirm-entry', { venueId });
  return data;
}
