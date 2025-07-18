/*
  Warnings:

  - Made the column `paymentMethod` on table `Order` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "paymentMethod" SET NOT NULL,
ALTER COLUMN "paymentMethod" SET DEFAULT 'CASH';
