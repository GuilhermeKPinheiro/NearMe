CREATE TYPE "VenuePrivacy" AS ENUM ('PUBLIC', 'INVITE_ONLY');

ALTER TABLE "Profile" ADD COLUMN "matchOnlyStoryPhotoUrls" TEXT;

ALTER TABLE "Venue" ADD COLUMN "ownerId" TEXT;
ALTER TABLE "Venue" ADD COLUMN "locationLabel" TEXT;
ALTER TABLE "Venue" ADD COLUMN "privacy" "VenuePrivacy" NOT NULL DEFAULT 'PUBLIC';

CREATE INDEX "Venue_ownerId_createdAt_idx" ON "Venue"("ownerId", "createdAt");

ALTER TABLE "Venue" ADD CONSTRAINT "Venue_ownerId_fkey"
FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
