import prisma from '@/config/prisma';

async function resetDatabase() {
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.user.deleteMany();
}

export { resetDatabase };
