ALTER TABLE "VisibilitySession" ADD COLUMN "latitude" DOUBLE PRECISION;
ALTER TABLE "VisibilitySession" ADD COLUMN "longitude" DOUBLE PRECISION;
ALTER TABLE "VisibilitySession" ADD COLUMN "accuracyMeters" DOUBLE PRECISION;

CREATE INDEX "VisibilitySession_isActive_latitude_longitude_idx"
ON "VisibilitySession"("isActive", "latitude", "longitude");
