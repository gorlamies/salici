/*
  Warnings:

  - The `state` column on the `Game` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "GameState" AS ENUM ('ready', 'running', 'aborted', 'white_win', 'black_win', 'white_resigned', 'black_resigned', 'white_timeout', 'black_timeout', 'draw', 'stalemate', 'insufficient_material', 'threefold_repetition', 'fivefold_repetition', 'fifty_move_rule', 'seventy_five_move_rule');

-- AlterTable
ALTER TABLE "Game" DROP COLUMN "state",
ADD COLUMN     "state" "GameState" NOT NULL DEFAULT 'ready';
