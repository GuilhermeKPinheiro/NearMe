import type { Profile, User } from '../generated/prisma/client';

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
    storyPhotoUrls: profile.storyPhotoUrls,
    matchOnlyStoryPhotoUrls: profile.matchOnlyStoryPhotoUrls,
    preferredRadiusMeters: profile.preferredRadiusMeters,
  };
}
