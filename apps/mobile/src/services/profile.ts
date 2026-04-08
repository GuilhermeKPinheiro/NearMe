import { http } from '@/services/http';
import type { Profile } from '@/types/domain';

export type ProfileDraft = {
  displayName: string;
  photoUrl: string;
  phoneNumber: string;
  whatsappUrl: string;
  headline: string;
  bio: string;
  instagramUrl: string;
  tiktokUrl: string;
  snapchatUrl: string;
  otherSocialUrl: string;
  linkedinUrl: string;
  professionTag: string;
  city: string;
  showPhoneNumber: boolean;
  showSocialLinks: boolean;
  publicPhotoUrls: string;
  matchOnlyPhotoUrls: string;
  storyPhotoUrls: string;
  matchOnlyStoryPhotoUrls: string;
  preferredRadiusMeters: number;
};

export const emptyProfileDraft: ProfileDraft = {
  displayName: '',
  photoUrl: '',
  phoneNumber: '',
  whatsappUrl: '',
  headline: '',
  bio: '',
  instagramUrl: '',
  tiktokUrl: '',
  snapchatUrl: '',
  otherSocialUrl: '',
  linkedinUrl: '',
  professionTag: '',
  city: '',
  showPhoneNumber: false,
  showSocialLinks: false,
  publicPhotoUrls: '',
  matchOnlyPhotoUrls: '',
  storyPhotoUrls: '',
  matchOnlyStoryPhotoUrls: '',
  preferredRadiusMeters: 1000
};

export function profileToDraft(profile: Profile | null): ProfileDraft {
  return {
    displayName: profile?.displayName ?? '',
    photoUrl: profile?.photoUrl ?? '',
    phoneNumber: profile?.phoneNumber ?? '',
    whatsappUrl: profile?.whatsappUrl ?? '',
    headline: profile?.headline ?? '',
    bio: profile?.bio ?? '',
    instagramUrl: profile?.instagramUrl ?? '',
    tiktokUrl: profile?.tiktokUrl ?? '',
    snapchatUrl: profile?.snapchatUrl ?? '',
    otherSocialUrl: profile?.otherSocialUrl ?? '',
    linkedinUrl: profile?.linkedInUrl ?? '',
    professionTag: profile?.professionTag ?? '',
    city: profile?.city ?? '',
    showPhoneNumber: profile?.showPhoneNumber ?? false,
    showSocialLinks: profile?.showSocialLinks ?? false,
    publicPhotoUrls: profile?.publicPhotoUrls ?? '',
    matchOnlyPhotoUrls: profile?.matchOnlyPhotoUrls ?? '',
    storyPhotoUrls: profile?.storyPhotoUrls ?? '',
    matchOnlyStoryPhotoUrls: profile?.matchOnlyStoryPhotoUrls ?? '',
    preferredRadiusMeters: profile?.preferredRadiusMeters ?? 1000
  };
}

export async function getMyProfile() {
  const { data } = await http.get<{ profile: Profile | null }>('/api/profile/me');
  return data.profile;
}

export async function updateMyProfile(draft: ProfileDraft) {
  const { linkedinUrl, ...payload } = draft;
  const { data } = await http.put<{ profile: Profile }>('/api/profile/me', {
    ...payload,
    linkedInUrl: linkedinUrl
  });
  return data.profile;
}
