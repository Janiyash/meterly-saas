/*
  Warnings:

  - Added the required column `fullText` to the `Analysis` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Analysis" ADD COLUMN "fullText" TEXT;
UPDATE "Analysis" SET "fullText" = "preview" WHERE "fullText" IS NULL;
ALTER TABLE "Analysis" ALTER COLUMN "fullText" SET NOT NULL;