ALTER TABLE "Venue" ADD COLUMN "joinCode" TEXT;

UPDATE "Venue"
SET "joinCode" = UPPER(REPLACE("slug", '-', ''))
WHERE "joinCode" IS NULL;

ALTER TABLE "Venue" ALTER COLUMN "joinCode" SET NOT NULL;

CREATE UNIQUE INDEX "Venue_joinCode_key" ON "Venue"("joinCode");
