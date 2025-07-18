/*
  Warnings:

  - You are about to drop the column `invoiceNumber` on the `Order` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Order_invoiceNumber_key";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "invoiceNumber";
