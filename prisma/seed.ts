import { faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';
import chalk from 'chalk';

import tokenService from '../src/services/token.service';

const prisma = new PrismaClient();

async function main() {
  console.log(chalk.blue('\n🌱 Seeding data...\n'));

  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.user.deleteMany();

  console.log(chalk.yellow(`Database cleared`));

  const hashedPassword = await tokenService.hash('12346789');

  console.log(`Password hashed from '12346789' successfully`);

  // Seed users
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@demo.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log(chalk.green(`Admin user created:`), chalk.whiteBright(admin.email));

  const owners = await Promise.all(
    Array.from({ length: 3 }).map(() =>
      prisma.user.create({
        data: {
          name: faker.person.fullName(),
          email: faker.internet.email(),
          password: hashedPassword,
          role: 'OWNER',
        },
      })
    )
  );

  console.log(`${owners.length} owners created`);

  // Seed restaurants + categories + menu items
  for (const owner of owners) {
    const restaurant = await prisma.restaurant.create({
      data: {
        name: faker.company.name(),
        location: faker.location.city(),
        description: faker.lorem.sentence(),
        ownerId: owner.id,
      },
    });

    console.log(`\nRestaurant created: "${restaurant.name}"`);

    const categories = await Promise.all(
      ['Appetizers', 'Mains', 'Desserts'].map((cat) =>
        prisma.category.create({
          data: {
            name: cat,
            restaurantId: restaurant.id,
          },
        })
      )
    );

    console.log(
      chalk.magenta(`Restaurant "${restaurant.name}" created with ${categories.length} categories`)
    );

    for (const category of categories) {
      await Promise.all(
        Array.from({ length: 10 }).map(() =>
          prisma.menuItem.create({
            data: {
              name: faker.commerce.productName(),
              description: faker.lorem.words(6),
              price: parseFloat(faker.commerce.price({ min: 5, max: 30 })),
              available: Math.random() > 0.2,
              categoryId: category.id,
              restaurantId: restaurant.id,
            },
          })
        )
      );
    }

    console.log(
      chalk.blue(`"${restaurant.name}" now has`),
      chalk.bold(await prisma.menuItem.count()),
      chalk.blue('menu items.')
    );
  }

  console.log(chalk.green('🏗 Seed complete!'));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
