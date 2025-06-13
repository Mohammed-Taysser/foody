import { Request, Response } from 'express';

import prisma from '@/config/prisma';
import dayjsTZ from '@/utils/dayjs.utils';
import sendResponse from '@/utils/sendResponse';

async function getAnalyticsMetrics(request: Request, response: Response) {
  const now = dayjsTZ();
  const startOfWeek = now.startOf('week');
  const prevWeek = startOfWeek.subtract(1, 'week');

  // Total counts
  const [users, restaurants, categories, menuItems, orders] = await Promise.all([
    prisma.user.count(),
    prisma.restaurant.count(),
    prisma.category.count(),
    prisma.menuItem.count(),
    prisma.order.count(),
  ]);

  // This week counts
  const [
    usersThisWeek,
    restaurantsThisWeek,
    categoriesThisWeek,
    menuItemsThisWeek,
    ordersThisWeek,
  ] = await Promise.all([
    prisma.user.count({ where: { createdAt: { gte: startOfWeek.toDate() } } }),
    prisma.restaurant.count({ where: { createdAt: { gte: startOfWeek.toDate() } } }),
    prisma.category.count({ where: { createdAt: { gte: startOfWeek.toDate() } } }),
    prisma.menuItem.count({ where: { createdAt: { gte: startOfWeek.toDate() } } }),
    prisma.order.count({ where: { createdAt: { gte: startOfWeek.toDate() } } }),
  ]);

  // Previous week counts
  const [
    usersLastWeek,
    restaurantsLastWeek,
    categoriesLastWeek,
    menuItemsLastWeek,
    ordersLastWeek,
  ] = await Promise.all([
    prisma.user.count({
      where: {
        createdAt: {
          gte: prevWeek.toDate(),
          lt: startOfWeek.toDate(),
        },
      },
    }),
    prisma.restaurant.count({
      where: {
        createdAt: {
          gte: prevWeek.toDate(),
          lt: startOfWeek.toDate(),
        },
      },
    }),
    prisma.category.count({
      where: {
        createdAt: {
          gte: prevWeek.toDate(),
          lt: startOfWeek.toDate(),
        },
      },
    }),
    prisma.menuItem.count({
      where: {
        createdAt: {
          gte: prevWeek.toDate(),
          lt: startOfWeek.toDate(),
        },
      },
    }),
    prisma.order.count({
      where: {
        createdAt: {
          gte: prevWeek.toDate(),
          lt: startOfWeek.toDate(),
        },
      },
    }),
  ]);

  const calcGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Number((((current - previous) / previous) * 100).toFixed(2));
  };

  sendResponse({
    res: response,
    message: 'Dashboard analytics',
    data: {
      totals: {
        users,
        restaurants,
        categories,
        menuItems,
        orders,
      },
      thisWeek: {
        users: usersThisWeek,
        restaurants: restaurantsThisWeek,
        categories: categoriesThisWeek,
        menuItems: menuItemsThisWeek,
        orders: ordersThisWeek,
      },
      lastWeek: {
        users: usersLastWeek,
        restaurants: restaurantsLastWeek,
        categories: categoriesLastWeek,
        menuItems: menuItemsLastWeek,
        orders: 0,
      },
      growth: {
        users: calcGrowth(usersThisWeek, usersLastWeek),
        restaurants: calcGrowth(restaurantsThisWeek, restaurantsLastWeek),
        categories: calcGrowth(categoriesThisWeek, categoriesLastWeek),
        menuItems: calcGrowth(menuItemsThisWeek, menuItemsLastWeek),
        orders: calcGrowth(ordersThisWeek, ordersLastWeek),
      },
    },
  });
}

export { getAnalyticsMetrics };
