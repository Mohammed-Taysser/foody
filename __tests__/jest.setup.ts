import prisma from '../src/apps/prisma';

afterAll(async () => {
  await prisma.$disconnect();
});
