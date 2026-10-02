-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "blackRemainingMs" INTEGER,
ADD COLUMN     "incrementMs" INTEGER,
ADD COLUMN     "initialTimeMs" INTEGER,
ADD COLUMN     "turnStartedAt" TIMESTAMP(3),
ADD COLUMN     "whiteRemainingMs" INTEGER;

-- AlterTable
ALTER TABLE "Move" ADD COLUMN     "remainingMsAfter" INTEGER;
