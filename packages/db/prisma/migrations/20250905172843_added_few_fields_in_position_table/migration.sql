/*
  Warnings:

  - Added the required column `closedAt` to the `Position` table without a default value. This is not possible if the table is not empty.
  - Added the required column `openedAt` to the `Position` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."PositionStatus" AS ENUM ('OPEN', 'CLOSE');

-- AlterTable
ALTER TABLE "public"."Position" ADD COLUMN     "closePrice" INTEGER,
ADD COLUMN     "closedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "openedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "pnl" INTEGER,
ADD COLUMN     "status" "public"."PositionStatus" NOT NULL DEFAULT 'OPEN';
