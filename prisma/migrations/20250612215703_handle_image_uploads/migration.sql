-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "image" TEXT DEFAULT '/avatar.jpg';

-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN     "image" TEXT DEFAULT '/avatar.jpg',
ALTER COLUMN "description" SET DEFAULT '';

-- AlterTable
ALTER TABLE "Permission" ALTER COLUMN "description" SET DEFAULT '';

-- AlterTable
ALTER TABLE "PermissionGroup" ALTER COLUMN "description" SET DEFAULT '';

-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "image" TEXT DEFAULT '/avatar.jpg',
ALTER COLUMN "description" SET DEFAULT '';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "image" TEXT DEFAULT '/avatar.jpg';
