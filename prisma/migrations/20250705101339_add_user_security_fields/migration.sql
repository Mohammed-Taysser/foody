/*
  Warnings:

  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `actorType` on the `AuditLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `action` on the `AuditLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `resource` on the `AuditLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `actorType` on the `ErrorLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `resource` on the `ErrorLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `description` on table `MenuItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `description` on table `Permission` required. This step will fail if there are existing NULL values in that column.
  - Made the column `description` on table `PermissionGroup` required. This step will fail if there are existing NULL values in that column.
  - Made the column `description` on table `Restaurant` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'OWNER', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "LogActorType" AS ENUM ('ADMIN', 'USER', 'CRON_JOB', 'WEBHOOK', 'BOT');

-- CreateEnum
CREATE TYPE "LogActionType" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'RESET_PASSWORD', 'SEND_RESET_PASSWORD_EMAIL', 'VERIFY_RESET_PASSWORD_TOKEN', 'SEND_VERIFICATION_EMAIL', 'VERIFY_EMAIL_TOKEN', 'LOGIN', 'REGISTER', 'PLACE_ORDER', 'CANCEL_ORDER', 'EXPORT', 'IMPORT', 'DOWNLOAD', 'UPLOAD', 'REFRESH_TOKEN', 'SYNC', 'NOTIFY');

-- CreateEnum
CREATE TYPE "LogResourceType" AS ENUM ('PERMISSION', 'PERMISSION_GROUP', 'CATEGORY', 'MENU_ITEM', 'USER', 'RESTAURANT', 'ORDER');

-- AlterTable
ALTER TABLE "AuditLog" DROP COLUMN "actorType",
ADD COLUMN     "actorType" "LogActorType" NOT NULL,
DROP COLUMN "action",
ADD COLUMN     "action" "LogActionType" NOT NULL,
DROP COLUMN "resource",
ADD COLUMN     "resource" "LogResourceType" NOT NULL;

-- AlterTable
ALTER TABLE "ErrorLog" DROP COLUMN "actorType",
ADD COLUMN     "actorType" "LogActorType" NOT NULL,
DROP COLUMN "resource",
ADD COLUMN     "resource" "LogResourceType" NOT NULL;

-- AlterTable
ALTER TABLE "MenuItem" ALTER COLUMN "description" SET NOT NULL;

-- AlterTable
ALTER TABLE "Permission" ALTER COLUMN "description" SET NOT NULL;

-- AlterTable
ALTER TABLE "PermissionGroup" ALTER COLUMN "description" SET NOT NULL;

-- AlterTable
ALTER TABLE "Restaurant" ALTER COLUMN "description" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "blockReason" TEXT,
ADD COLUMN     "blockedAt" TIMESTAMP(3),
ADD COLUMN     "blockedById" TEXT,
ADD COLUMN     "emailVerificationSentAt" TIMESTAMP(3),
ADD COLUMN     "emailVerificationToken" TEXT,
ADD COLUMN     "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isBlocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastFailedLogin" TIMESTAMP(3),
ADD COLUMN     "maxTokens" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "passwordResetSentAt" TIMESTAMP(3),
ADD COLUMN     "passwordResetToken" TEXT,
ADD COLUMN     "phoneVerificationExpires" TIMESTAMP(3),
ADD COLUMN     "phoneVerificationSentAt" TIMESTAMP(3),
ADD COLUMN     "phoneVerificationToken" TEXT,
ADD COLUMN     "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFactorSecret" TEXT,
DROP COLUMN "role",
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER';

-- DropEnum
DROP TYPE "ActionType";

-- DropEnum
DROP TYPE "ActorType";

-- DropEnum
DROP TYPE "ResourceType";

-- DropEnum
DROP TYPE "Role";

-- CreateTable
CREATE TABLE "UserToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserLoginAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserLoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserToken_token_key" ON "UserToken"("token");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_resource_idx" ON "AuditLog"("resource");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_actorType_idx" ON "AuditLog"("actorType");

-- CreateIndex
CREATE INDEX "ErrorLog_resource_idx" ON "ErrorLog"("resource");

-- CreateIndex
CREATE INDEX "ErrorLog_actorType_idx" ON "ErrorLog"("actorType");

-- CreateIndex
CREATE INDEX "ErrorLog_actorId_idx" ON "ErrorLog"("actorId");

-- CreateIndex
CREATE INDEX "JobLog_jobId_idx" ON "JobLog"("jobId");

-- CreateIndex
CREATE INDEX "JobLog_jobName_idx" ON "JobLog"("jobName");

-- CreateIndex
CREATE INDEX "JobLog_status_idx" ON "JobLog"("status");

-- CreateIndex
CREATE INDEX "JobLog_createdAt_idx" ON "JobLog"("createdAt");

-- AddForeignKey
ALTER TABLE "UserToken" ADD CONSTRAINT "UserToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLoginAttempt" ADD CONSTRAINT "UserLoginAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
