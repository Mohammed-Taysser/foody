/*
  Warnings:

  - The values [DOWNLOAD] on the enum `LogActionType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "LogActionType_new" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'RESET_PASSWORD', 'SEND_RESET_PASSWORD_EMAIL', 'VERIFY_RESET_PASSWORD_TOKEN', 'SEND_VERIFICATION_EMAIL', 'VERIFY_EMAIL_TOKEN', 'LOGIN', 'REGISTER', 'USER_BLOCKED', 'INVALID_LOGIN_ATTEMPT', 'PLACE_ORDER', 'CANCEL_ORDER', 'EXPORT', 'IMPORT', 'UPLOAD', 'REFRESH_TOKEN', 'SYNC', 'NOTIFY');
ALTER TABLE "AuditLog" ALTER COLUMN "action" TYPE "LogActionType_new" USING ("action"::text::"LogActionType_new");
ALTER TYPE "LogActionType" RENAME TO "LogActionType_old";
ALTER TYPE "LogActionType_new" RENAME TO "LogActionType";
DROP TYPE "LogActionType_old";
COMMIT;

-- AlterTable
ALTER TABLE "AuditLog" ALTER COLUMN "resourceId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ErrorLog" ALTER COLUMN "resourceId" DROP NOT NULL;
