/*
  Warnings:

  - You are about to alter the column `price` on the `MenuItem` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `total` on the `Order` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `subtotal` on the `Order` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `discount` on the `Order` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - Made the column `image` on table `Category` required. This step will fail if there are existing NULL values in that column.
  - Made the column `categoryId` on table `MenuItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `image` on table `MenuItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `discount` on table `Order` required. This step will fail if there are existing NULL values in that column.
  - Made the column `notes` on table `Order` required. This step will fail if there are existing NULL values in that column.
  - Made the column `notes` on table `OrderItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `image` on table `Restaurant` required. This step will fail if there are existing NULL values in that column.
  - Made the column `image` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "MenuItem" DROP CONSTRAINT "MenuItem_categoryId_fkey";

-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "image" SET NOT NULL;

-- AlterTable
ALTER TABLE "MenuItem" ALTER COLUMN "price" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "categoryId" SET NOT NULL,
ALTER COLUMN "image" SET NOT NULL;

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "total" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "subtotal" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "discount" SET NOT NULL,
ALTER COLUMN "discount" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "notes" SET NOT NULL;

-- AlterTable
ALTER TABLE "OrderItem" ALTER COLUMN "notes" SET NOT NULL;

-- AlterTable
ALTER TABLE "Restaurant" ALTER COLUMN "image" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "image" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
