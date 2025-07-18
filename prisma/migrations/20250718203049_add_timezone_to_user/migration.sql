/*
  Warnings:

  - You are about to drop the column `phoneVerificationExpires` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "phoneVerificationExpires",
ADD COLUMN     "timezone" TEXT DEFAULT 'UTC';
