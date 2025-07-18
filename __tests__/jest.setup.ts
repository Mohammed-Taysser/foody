import * as matchers from 'jest-extended';

import prisma from '../src/apps/prisma';

expect.extend(matchers);

afterAll(async () => {
  await prisma.$disconnect();
});
