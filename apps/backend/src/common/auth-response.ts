import type { Profile, User } from '../generated/prisma/client';
import { getActiveStoryPublishedAt, getActiveStoryUrls } from './story-media';

type ProfileWithStoryTimestamps = Profile & {
  storyPublishedAt?: Date | null;
  matchOnlyStoryPublishedAt?: Date | null;
};

export function toPublicUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: Boolean(user.emailVerifiedAt),
  };
}

export function toOwnProfile(profile: Profile | null) {
  if (!profile) {
    return null;
  }

  const nextProfile = profile as ProfileWithStoryTimestamps;

  const storyPhotoUrls = getActiveStoryUrls({
    urls: nextProfile.storyPhotoUrls,
    publishedAt: nextProfile.storyPublishedAt,
    fallbackUpdatedAt: nextProfile.updatedAt,
  });
  const matchOnlyStoryPhotoUrls = getActiveStoryUrls({
    urls: nextProfile.matchOnlyStoryPhotoUrls,
    publishedAt: nextProfile.matchOnlyStoryPublishedAt,
    fallbackUpdatedAt: nextProfile.updatedAt,
  });

  return {
    id: profile.id,
    userId: profile.userId,
    displayName: profile.displayName,
    headline: profile.headline,
    bio: profile.bio,
    photoUrl: profile.photoUrl,
    phoneNumber: profile.phoneNumber,
    whatsappUrl: profile.whatsappUrl,
    instagramUrl: profile.instagramUrl,
    tiktokUrl: profile.tiktokUrl,
    snapchatUrl: profile.snapchatUrl,
    otherSocialUrl: profile.otherSocialUrl,
    linkedInUrl: profile.linkedInUrl,
    professionTag: profile.professionTag,
    city: profile.city,
    isVisibleByDefault: profile.isVisibleByDefault,
    showPhoneNumber: profile.showPhoneNumber,
    showSocialLinks: profile.showSocialLinks,
    publicPhotoUrls: profile.publicPhotoUrls,
    matchOnlyPhotoUrls: profile.matchOnlyPhotoUrls,
    storyPhotoUrls,
    matchOnlyStoryPhotoUrls,
    storyPublishedAt: getActiveStoryPublishedAt({
      urls: nextProfile.storyPhotoUrls,
      publishedAt: nextProfile.storyPublishedAt,
      fallbackUpdatedAt: nextProfile.updatedAt,
    }),
    matchOnlyStoryPublishedAt: getActiveStoryPublishedAt({
      urls: nextProfile.matchOnlyStoryPhotoUrls,
      publishedAt: nextProfile.matchOnlyStoryPublishedAt,
      fallbackUpdatedAt: nextProfile.updatedAt,
    }),
    preferredRadiusMeters: profile.preferredRadiusMeters,
    updatedAt: profile.updatedAt,
  };
}
