export type User = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
};

export type Venue = {
  id: string;
  slug: string;
  joinCode: string;
  name: string;
  description?: string | null;
  coverImageUrl?: string | null;
  city: string;
  locationLabel?: string | null;
  latitude?: number;
  longitude?: number;
  radiusMeters: number;
  privacy?: 'PUBLIC' | 'INVITE_ONLY';
  ownerId?: string | null;
  isActive?: boolean;
  entryUrl?: string;
};

export type Profile = {
  id: string;
  userId: string;
  displayName: string;
  headline: string | null;
  bio: string | null;
  photoUrl: string | null;
  phoneNumber: string | null;
  whatsappUrl: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  snapchatUrl: string | null;
  otherSocialUrl: string | null;
  linkedInUrl: string | null;
  professionTag: string | null;
  city: string | null;
  isVisibleByDefault: boolean;
  showPhoneNumber: boolean;
  showSocialLinks: boolean;
  publicPhotoUrls: string | null;
  matchOnlyPhotoUrls: string | null;
  storyPhotoUrls: string | null;
  matchOnlyStoryPhotoUrls: string | null;
  preferredRadiusMeters: number;
};

export type VisibilitySession = {
  id: string;
  userId: string | null;
  startedAt: string;
  endedAt?: string | null;
  isActive: boolean;
  source: 'MANUAL' | 'APP_OPEN' | 'BACKGROUND' | 'MOCK';
  latitude?: number | null;
  longitude?: number | null;
  accuracyMeters?: number | null;
  venue?: Venue | null;
};

export type NearbyUser = {
  id: string;
  profileId: string | null;
  displayName: string;
  photoUrl: string | null;
  headline: string;
  bio: string;
  professionTag: string;
  city: string;
  distanceMeters: number;
  distanceLabel: string;
  requestStatus: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELED' | null;
  isConnected: boolean;
  linksUnlocked: boolean;
  phoneNumber: string | null;
  whatsappUrl: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  snapchatUrl: string | null;
  otherSocialUrl: string | null;
  linkedInUrl: string | null;
  publicPhotoUrls: string;
  matchOnlyPhotoUrls: string;
  storyPhotoUrls: string;
  venue: Venue | null;
};

export type ReceivedConnectionRequest = {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELED';
  createdAt: string;
  fromUser: {
    id: string;
    displayName: string;
    photoUrl: string | null;
    headline: string;
  };
};

export type SentConnectionRequest = {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELED';
  createdAt: string;
  toUser: {
    id: string;
    displayName: string;
    photoUrl: string | null;
    headline: string;
  };
};

export type Connection = {
  id: string;
  createdAt: string;
  user: {
    id: string;
    displayName: string;
    photoUrl: string | null;
    headline: string;
    phoneNumber: string | null;
    whatsappUrl: string | null;
    instagramUrl: string | null;
    tiktokUrl: string | null;
    snapchatUrl: string | null;
    otherSocialUrl: string | null;
    linkedInUrl: string | null;
    matchOnlyPhotoUrls: string;
    matchOnlyStoryPhotoUrls: string;
  };
};

export type NotificationItem = {
  id: string;
  userId: string;
  type: 'CONNECTION_REQUEST' | 'CONNECTION_ACCEPTED' | 'VISIBILITY_EXPIRED' | 'SYSTEM';
  title: string;
  body: string;
  readAt?: string;
  createdAt: string;
};

export type AuthResponse = {
  accessToken: string;
  user: User;
  profile: Profile | null;
};

export type RegisterResponse = {
  success: boolean;
  email: string;
  requiresEmailVerification: boolean;
  message: string;
};

export type ForgotPasswordResponse = {
  success: boolean;
  email: string;
  message: string;
};

export type GenericSuccessResponse = {
  success: boolean;
  message: string;
};

export type ConnectionState = {
  received: ReceivedConnectionRequest[];
  sent: SentConnectionRequest[];
  connections: Connection[];
};

export type NearbySummary = {
  count: number;
  pendingReceived: number;
  sameVenueOnly?: boolean;
  venue: { id: string; name: string | null } | null;
};
