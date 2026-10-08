-- CreateEnum
CREATE TYPE "TimeCategory" AS ENUM ('bullet', 'blitz', 'rapid', 'classical', 'unlimited');

-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "blackRatingAfter" INTEGER,
ADD COLUMN     "blackRatingBefore" INTEGER,
ADD COLUMN     "timeCategory" "TimeCategory" NOT NULL DEFAULT 'unlimited',
ADD COLUMN     "whiteRatingAfter" INTEGER,
ADD COLUMN     "whiteRatingBefore" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "hideOnlineStatus" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Follow" (
    "followerUsername" TEXT NOT NULL,
    "followedUsername" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("followerUsername","followedUsername")
);

-- CreateTable
CREATE TABLE "Rating" (
    "username" TEXT NOT NULL,
    "timeCategory" "TimeCategory" NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 1500,
    "deviation" DOUBLE PRECISION NOT NULL DEFAULT 350,
    "volatility" DOUBLE PRECISION NOT NULL DEFAULT 0.06,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("username","timeCategory")
);

-- CreateIndex
CREATE INDEX "Follow_followedUsername_idx" ON "Follow"("followedUsername");

-- CreateIndex
CREATE INDEX "Game_whitePlayerUsername_createdAt_idx" ON "Game"("whitePlayerUsername", "createdAt");

-- CreateIndex
CREATE INDEX "Game_blackPlayerUsername_createdAt_idx" ON "Game"("blackPlayerUsername", "createdAt");

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followedUsername_fkey" FOREIGN KEY ("followedUsername") REFERENCES "User"("username") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followerUsername_fkey" FOREIGN KEY ("followerUsername") REFERENCES "User"("username") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_username_fkey" FOREIGN KEY ("username") REFERENCES "User"("username") ON DELETE CASCADE ON UPDATE CASCADE;
