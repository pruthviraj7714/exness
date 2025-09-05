-- CreateEnum
CREATE TYPE "public"."PositionType" AS ENUM ('LONG', 'SHORT');

-- CreateTable
CREATE TABLE "public"."Position" (
    "id" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "leverage" INTEGER NOT NULL,
    "margin" INTEGER NOT NULL,
    "slippage" INTEGER NOT NULL,
    "type" "public"."PositionType" NOT NULL,
    "userId" TEXT NOT NULL,
    "openPrice" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Position" ADD CONSTRAINT "Position_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
