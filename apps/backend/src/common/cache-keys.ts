export const cacheKeys = {
  profileMe: (userId: string) => `profile:me:${userId}`,
  profilePrefix: (userId: string) => `profile:${userId}`,
  notificationsList: (userId: string) => `notifications:list:${userId}`,
  notificationsPrefix: (userId: string) => `notifications:${userId}`,
  connectionsList: (userId: string) => `connections:list:${userId}`,
  connectionsPrefix: (userId: string) => `connections:${userId}`,
  nearbyList: (userId: string, radiusMeters: number, sameVenueOnly: boolean) =>
    `nearby:list:${userId}:${radiusMeters}:${sameVenueOnly ? 'venue' : 'all'}`,
  nearbyPrefix: (userId: string) => `nearby:${userId}`,
  visibilityStatus: (userId: string) => `visibility:status:${userId}`,
};
