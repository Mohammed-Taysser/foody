import { faker } from '@faker-js/faker';
import request from 'supertest';
import { Order, OrderItem, OrderStatus } from '@prisma/client';
import ExcelJS from 'exceljs';

import app from '../../../src/app';
import prisma from '../../../src/apps/prisma';
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  CUSTOMER_2_EMAIL,
  CUSTOMER_2_PASSWORD,
  CUSTOMER_EMAIL,
  CUSTOMER_PASSWORD,
  OWNER_EMAIL,
  OWNER_PASSWORD,
} from '../../test.constants';
import dayjsTZ from '../../../src/utils/dayjs.utils';

describe('Order API', () => {
  let ownerToken: string;
  let customerToken: string;
  let customerId: string;
  let anotherToken: string;
  let restaurantId: string;
  let menuItemId: string;
  let orderId: string;
  let categoryId: string;
  let adminToken: string;

  const today = dayjsTZ().format('YYYY-MM-DD');

  beforeAll(async () => {
    const ownerRes = await request(app).post('/api/auth/login').send({
      email: OWNER_EMAIL,
      password: OWNER_PASSWORD,
    });
    ownerToken = ownerRes.body.data.data.accessToken;

    const customerRes = await request(app).post('/api/auth/login').send({
      email: CUSTOMER_EMAIL,
      password: CUSTOMER_PASSWORD,
    });
    customerId = customerRes.body.data.data.user.id;
    customerToken = customerRes.body.data.data.accessToken;

    const anotherCustomer = await request(app).post('/api/auth/login').send({
      email: CUSTOMER_2_EMAIL,
      password: CUSTOMER_2_PASSWORD,
    });

    anotherToken = anotherCustomer.body.data.data.accessToken;

    const adminRes = await request(app).post('/api/auth/login').send({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    adminToken = adminRes.body.data.data.accessToken;

    // Create restaurant
    const restaurantRes = await request(app)
      .post('/api/restaurants')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: faker.company.name(),
        location: faker.location.city(),
        ownerId: ownerRes.body.data.data.user.id,
      });
    restaurantId = restaurantRes.body.data.data.id;

    // Create category
    const categoryRes = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Appetizers',
        restaurantId,
      });
    categoryId = categoryRes.body.data.data.id;

    // Create menu item
    const itemRes = await request(app)
      .post('/api/menu-items')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: faker.commerce.productName(),
        price: 10.5,
        restaurantId,
        categoryId,
      });

    menuItemId = itemRes.body.data.data.id;
  });

  describe('POST /orders', () => {
    it('should place a new order', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          restaurantId,
          items: [{ menuItemId, quantity: 2 }],
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.data.items.length).toBeGreaterThan(0);
      orderId = res.body.data.data.id;
    });

    it('should not place an order with invalid items', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          restaurantId,
          items: [{ menuItemId: 'invalid-item-id', quantity: 2 }],
        });

      expect(res.statusCode).toBe(400);
    });

    it('should return 400 if restaurantId is missing', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ menuItemId, quantity: 2 }],
        });

      expect(res.statusCode).toBe(400);
    });

    it('should return 400 if restaurantId is invalid', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          restaurantId: 'invalid-restaurant-id',
          items: [{ menuItemId, quantity: 2 }],
        });

      expect(res.statusCode).toBe(400);
    });

    it('should return 400 if items array is empty', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          restaurantId,
          items: [],
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /orders', () => {
    it('should return paginated list of orders', async () => {
      const res = await request(app)
        .get('/api/orders?page=1&limit=10')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app).get('/api/orders');

      expect(res.statusCode).toBe(401);
    });

    it("should return 403 when a user tries to access another user's order", async () => {
      const anotherCustomerRes = await request(app).post('/api/auth/login').send({
        email: CUSTOMER_2_EMAIL,
        password: CUSTOMER_2_PASSWORD,
      });

      const anotherCustomerToken = anotherCustomerRes.body.data.data.accessToken;

      const res = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${anotherCustomerToken}`);

      expect(res.statusCode).toBe(403);
    });

    describe('Filters', () => {
      it('should filter by restaurantId', async () => {
        const res = await request(app)
          .get('/api/orders')
          .set('Authorization', `Bearer ${customerToken}`)
          .query({ restaurantId: restaurantId });

        expect(res.status).toBe(200);
        const ids = res.body.data.data.map((o: Order) => o.restaurantId);
        expect(ids).toContain(restaurantId);
      });

      it('should filter by userId', async () => {
        const res = await request(app)
          .get('/api/orders')
          .set('Authorization', `Bearer ${customerToken}`)
          .query({ userId: customerId });

        expect(res.status).toBe(200);
        const ids = res.body.data.data.map((o: Order) => o.userId);
        expect(ids).toContain(customerId);
      });

      it('should filter by status (array)', async () => {
        const status: OrderStatus[] = ['PENDING', 'PREPARING'];

        const res = await request(app)
          .get('/api/orders')
          .set('Authorization', `Bearer ${customerToken}`)
          .query({ status: status.join(',') });

        expect(res.status).toBe(200);
        expect(res.body.data.data.every((o: Order) => status.includes(o.status))).toBe(true);
      });

      it('should filter by status (single value)', async () => {
        const res = await request(app)
          .get('/api/orders')
          .set('Authorization', `Bearer ${customerToken}`)
          .query({ status: 'PENDING' });

        expect(res.status).toBe(200);

        expect(res.body.data.data).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              status: 'PENDING',
            }),
          ])
        );
      });

      it('should filter by paymentStatus and method', async () => {
        const res = await request(app)
          .get('/api/orders')
          .set('Authorization', `Bearer ${customerToken}`)
          .query({
            paymentStatus: ['PAID'],
            paymentMethod: ['CARD'],
          });

        expect(res.status).toBe(200);
        const data = res.body.data.data;
        expect(data.every((o: Order) => o.paymentStatus === 'PAID')).toBe(true);
        expect(data.every((o: Order) => o.paymentMethod === 'CARD')).toBe(true);
      });

      it('should filter by createdAt[startDate, endDate]', async () => {
        const today = dayjsTZ().format('YYYY-MM-DD');

        const res = await request(app)
          .get('/api/orders')
          .set('Authorization', `Bearer ${customerToken}`)
          .query({
            createdAt: {
              startDate: today,
              endDate: today,
            },
          });

        expect(res.status).toBe(200);
        res.body.data.data.forEach((order: Order) => {
          const created = dayjsTZ(order.createdAt);
          expect(created.isBetween(today, today, 'day', '[]')).toBe(true);
        });
      });

      it('should filter by createdAt[startDate]', async () => {
        const today = dayjsTZ().format('YYYY-MM-DD');
        const res = await request(app)
          .get('/api/orders')
          .set('Authorization', `Bearer ${customerToken}`)
          .query({
            createdAt: {
              startDate: today,
            },
          });

        expect(res.status).toBe(200);
        res.body.data.data.forEach((user: Order) => {
          const createdAt = dayjsTZ(user.createdAt);
          expect(createdAt.isSameOrAfter(today, 'day')).toBe(true);
        });
      });

      it('should filter by createdAt[endDate]', async () => {
        const today = dayjsTZ().format('YYYY-MM-DD');
        const res = await request(app)
          .get('/api/orders')
          .set('Authorization', `Bearer ${customerToken}`)
          .query({
            createdAt: {
              endDate: today,
            },
          });

        expect(res.status).toBe(200);
        res.body.data.data.forEach((user: Order) => {
          const created = dayjsTZ(user.createdAt);
          expect(created.isSameOrBefore(today, 'day')).toBe(true);
        });
      });

      it('should filter by tableNumber', async () => {
        const res = await request(app)
          .get('/api/orders')
          .set('Authorization', `Bearer ${customerToken}`)
          .query({ tableNumber: 5 });

        expect(res.status).toBe(200);
        expect(res.body.data.data.every((o: Order) => o.tableNumber === 5)).toBe(true);
      });
    });
  });

  describe('GET /orders/list', () => {
    it('should return a list of order IDs and names', async () => {
      const res = await request(app)
        .get('/api/orders/list')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data.data)).toBe(true);
      expect(res.body.data.data[0]).toHaveProperty('name');
    });
  });

  describe('GET /orders/:orderId', () => {
    it('should return order by ID', async () => {
      const res = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.data.id).toBe(orderId);
    });

    it('should return 404 for invalid order ID', async () => {
      const res = await request(app)
        .get('/api/orders/non-existing-id')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe('PATCH /orders/:orderId', () => {
    it('should update order data', async () => {
      const res = await request(app)
        .patch(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ notes: 'Please make it spicy' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.data.notes).toContain('spicy');
    });

    it('should return 404 for invalid order ID', async () => {
      const res = await request(app)
        .patch('/api/orders/non-existing-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ notes: 'Please make it spicy' });

      expect(res.statusCode).toBe(404);
    });

    it('should return 403 if non-admin tries to update an order', async () => {
      const res = await request(app)
        .patch(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${anotherToken}`)
        .send({ notes: 'Unauthorized update' });

      expect(res.statusCode).toBe(403);
    });

    it('should update only if order status is PENDING', async () => {
      const resOrder = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          restaurantId,
          items: [{ menuItemId, quantity: 1 }],
        });

      const id = resOrder.body.data.data.id;

      await prisma.order.update({
        where: { id },
        data: { status: 'COMPLETED' },
      });

      const res = await request(app)
        .patch(`/api/orders/${id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ notes: 'This should not work' });
      expect(res.statusCode).toBe(400);
    });

    it('should return 400 for invalid restaurant ID', async () => {
      const res = await request(app)
        .patch(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ restaurantId: 'invalid-id' });

      expect(res.statusCode).toBe(400);
    });

    it('should update menu item quantity in the order', async () => {
      const res = await request(app)
        .patch(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ menuItemId, quantity: 3 }],
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.data.items[0].quantity).toBe(3);
    });

    it('should return 400 for invalid item quantity', async () => {
      const res = await request(app)
        .patch(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ menuItemId, quantity: -1 }],
        });

      expect(res.statusCode).toBe(400);
    });

    it('should return 400 for invalid menu item ID', async () => {
      const res = await request(app)
        .patch(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ menuItemId: 'invalid-id', quantity: 1 }],
        });

      expect(res.statusCode).toBe(400);
    });

    it('should allow adding new items to the order', async () => {
      // Step 1: Create an order with one item
      const createOrderRes = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          restaurantId,
          items: [{ menuItemId, quantity: 1 }],
        });

      const orderId = createOrderRes.body.data.data.id;
      const existingItem = createOrderRes.body.data.data.items[0];

      // Step 2: Add a new menu item to the same restaurant
      const newMenuItemRes = await request(app)
        .post('/api/menu-items')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: faker.commerce.productName(),
          price: 12.5,
          restaurantId,
          categoryId,
        });

      const newMenuItemId = newMenuItemRes.body.data.data.id;

      // Step 3: Patch the same order to add new item and update the existing one
      const patchRes = await request(app)
        .patch(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          restaurantId, // include restaurantId if your update logic expects it
          items: [
            {
              id: existingItem.id,
              menuItemId: existingItem.menuItemId,
              quantity: 3,
            },
            {
              menuItemId: newMenuItemId,
              quantity: 2,
            },
          ],
        });

      expect(patchRes.statusCode).toBe(200);
      expect(
        patchRes.body.data.data.items.some((item: OrderItem) => item.menuItemId === newMenuItemId)
      ).toBe(true);
    });

    it('should throw 400 if trying to add an item not in the restaurant', async () => {
      const res = await request(app)
        .patch(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ menuItemId, id: 'invalid-id', quantity: 1 }],
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('PATCH /orders/:orderId/update-order-status', () => {
    it('should update order status', async () => {
      const res = await request(app)
        .patch(`/api/orders/${orderId}/update-order-status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: 'PREPARING' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.data.status).toBe('PREPARING');
    });

    it('should return 404 for invalid order ID', async () => {
      const res = await request(app)
        .patch('/api/orders/non-existing-id/update-order-status')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: 'PREPARING' });

      expect(res.statusCode).toBe(404);
    });

    it('should return 400 for invalid status value', async () => {
      const res = await request(app)
        .patch(`/api/orders/${orderId}/update-order-status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: 'INVALID_STATUS' });

      expect(res.statusCode).toBe(400);
    });

    it('should return 403 if user is not the owner of the order', async () => {
      const res = await request(app)
        .patch(`/api/orders/${orderId}/update-order-status`)
        .set('Authorization', `Bearer ${anotherToken}`)
        .send({ status: 'PREPARING' });

      expect(res.statusCode).toBe(403);
    });

    it('should allow valid status transition: PENDING → PREPARING', async () => {
      // First create a new order
      const orderRes = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          restaurantId,
          items: [{ menuItemId, quantity: 1 }],
        });

      const newOrderId = orderRes.body.data.data.id;

      const res = await request(app)
        .patch(`/api/orders/${newOrderId}/update-order-status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: 'PREPARING' });

      expect(res.status).toBe(200);
      expect(res.body.data.data.status).toBe('PREPARING');
    });

    it('should reject invalid transition: PREPARING → PENDING', async () => {
      // First update to PREPARING
      await request(app)
        .patch(`/api/orders/${orderId}/update-order-status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: 'PREPARING' });

      // Now attempt invalid transition
      const res = await request(app)
        .patch(`/api/orders/${orderId}/update-order-status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: 'PENDING' });

      expect(res.status).toBe(400);
    });

    it('should block changes on COMPLETED order', async () => {
      // Force it to COMPLETED via admin
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'COMPLETED' },
      });

      const res = await request(app)
        .patch(`/api/orders/${orderId}/update-order-status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: 'CANCELLED' });

      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent order', async () => {
      const res = await request(app)
        .patch(`/api/orders/non-existent-id/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'PREPARING' });

      expect(res.status).toBe(404);
    });

    it('should forbid other users from updating', async () => {
      const res = await request(app)
        .patch(`/api/orders/${orderId}/update-order-status`)
        .set('Authorization', `Bearer ${anotherToken}`)
        .send({ status: 'PREPARING' });

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /orders/:id/pay-order', () => {
    it('should mark order as paid', async () => {
      const orderRes = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          restaurantId,
          items: [{ menuItemId, quantity: 2 }],
        });

      const id = orderRes.body.data.data.id;

      const res = await request(app)
        .patch(`/api/orders/${id}/pay-order`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ paymentMethod: 'CARD' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.data.paymentStatus).toBe('PAID');
    });

    it('should return 404 for invalid order ID', async () => {
      const res = await request(app)
        .patch('/api/orders/non-existing-id/pay-order')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ paymentMethod: 'CARD' });
      expect(res.statusCode).toBe(404);
    });

    it('should return 400 for invalid payment method', async () => {
      const res = await request(app)
        .patch(`/api/orders/${orderId}/pay-order`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ paymentMethod: 'BITCOIN' });

      expect(res.statusCode).toBe(400);
    });

    it('should return 403 if user is not the owner of the order', async () => {
      const res = await request(app)
        .patch(`/api/orders/${orderId}/pay-order`)
        .set('Authorization', `Bearer ${anotherToken}`)
        .send({ paymentMethod: 'CARD' });

      expect(res.statusCode).toBe(403);
    });

    it('should return 400 if order is already paid', async () => {
      const resOrder = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          restaurantId,
          items: [{ menuItemId, quantity: 1 }],
        });

      const newOrderId = resOrder.body.data.data.id;

      await prisma.order.update({
        where: { id: newOrderId },
        data: { paymentStatus: 'PAID', paymentMethod: 'ONLINE' },
      });

      const res = await request(app)
        .patch(`/api/orders/${newOrderId}/pay-order`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ paymentMethod: 'CARD' });

      expect(res.statusCode).toBe(400);
    });

    it('should return 400 if order is already refunded', async () => {
      const resOrder = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          restaurantId,
          items: [{ menuItemId, quantity: 1 }],
        });

      const newOrderId = resOrder.body.data.data.id;

      await prisma.order.update({
        where: { id: newOrderId },
        data: { paymentStatus: 'REFUNDED' },
      });

      const res = await request(app)
        .patch(`/api/orders/${newOrderId}/pay-order`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ paymentMethod: 'CARD' });

      expect(res.statusCode).toBe(400);
    });

    it('should return 400 if status is not PENDING', async () => {
      const resOrder = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          restaurantId,
          items: [{ menuItemId, quantity: 1 }],
        });

      const newOrderId = resOrder.body.data.data.id;

      await prisma.order.update({
        where: { id: newOrderId },
        data: { status: 'COMPLETED' },
      });

      const res = await request(app)
        .patch(`/api/orders/${newOrderId}/pay-order`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ paymentMethod: 'CARD' });

      expect(res.statusCode).toBe(400);
    });

    it('should return 400 if order is cancelled', async () => {
      const resOrder = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          restaurantId,
          items: [{ menuItemId, quantity: 1 }],
        });

      const newOrderId = resOrder.body.data.data.id;

      await prisma.order.update({
        where: { id: newOrderId },
        data: { status: 'CANCELLED' },
      });

      const res = await request(app)
        .patch(`/api/orders/${newOrderId}/pay-order`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ paymentMethod: 'CARD' });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('PATCH /orders/:id/cancel', () => {
    it('should cancel the order successfully', async () => {
      const resOrder = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          restaurantId,
          items: [{ menuItemId, quantity: 2 }],
        });

      const newOrderId = resOrder.body.data.data.id;

      const res = await request(app)
        .patch(`/api/orders/${newOrderId}/cancel-order`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.data.status).toBe('CANCELLED');
    });

    it('should return 404 if order does not exist', async () => {
      const res = await request(app)
        .patch('/api/orders/non-existing-id/cancel-order')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(404);
    });

    it('should return 403 if user is not the owner of the order', async () => {
      const res = await request(app)
        .patch(`/api/orders/${orderId}/cancel-order`)
        .set('Authorization', `Bearer ${anotherToken}`);

      expect(res.statusCode).toBe(403);
    });

    it('should return 400 if order is already cancelled', async () => {
      const resOrder = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          restaurantId,
          items: [{ menuItemId, quantity: 1 }],
        });

      const id = resOrder.body.data.data.id;

      await prisma.order.update({
        where: { id: id },
        data: { status: 'CANCELLED' },
      });

      const res = await request(app)
        .patch(`/api/orders/${id}/cancel-order`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(400);
    });

    it('should return 400 if order is already completed', async () => {
      const resOrder = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          restaurantId,
          items: [{ menuItemId, quantity: 1 }],
        });

      const id = resOrder.body.data.data.id;

      await prisma.order.update({
        where: { id: id },
        data: { status: 'COMPLETED' },
      });

      const res = await request(app)
        .patch(`/api/orders/${orderId}/cancel-order`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(400);
    });
  });

  describe('DELETE /orders/:id', () => {
    it('should delete an order', async () => {
      const resOrder = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          restaurantId,
          items: [{ menuItemId, quantity: 1 }],
        });

      const newOrderId = resOrder.body.data.data.id;

      const res = await request(app)
        .delete(`/api/orders/${newOrderId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(200);
    });

    it('should return 404 for non-existing order', async () => {
      const res = await request(app)
        .delete('/api/orders/non-existing-id')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /api/orders/export', () => {
    it('should export orders in CSV format', async () => {
      const res = await request(app)
        .get(`/api/orders/export`)
        .query({
          format: 'csv',
          restaurantId,
          userId: customerId,
          createdAt: {
            startDate: today,
            endDate: today,
          },
        })
        .set('Authorization', `Bearer ${adminToken}`)
        .buffer()
        .parse((res, callback) => {
          const chunks: Uint8Array<ArrayBufferLike>[] = [];
          res.setEncoding('utf8');
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => callback(null, chunks.join('')));
        });

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('text/csv; charset=utf-8');
      expect(res.headers['content-disposition']).toContain('attachment; filename="Orders.csv"');

      expect(typeof res.body).toBe('string');
      expect(res.body).toContain('#');
    });

    it('should export orders in Excel format (xlsx)', async () => {
      const res = await request(app)
        .get(`/api/orders/export?format=xlsx`)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          status: ['PENDING', 'PREPARING'].join(','),
          restaurantId,
        })
        .buffer()
        .parse((res, callback) => {
          const chunks: Uint8Array<ArrayBufferLike>[] = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => callback(null, Buffer.concat(chunks)));
        });

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      expect(res.headers['content-disposition']).toContain('attachment; filename="Orders.xlsx"');

      expect(res.body).toBeInstanceOf(Buffer); // xlsx returns a buffer

      // Load the workbook from buffer
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(res.body);

      const worksheet = workbook.worksheets[0];

      const map: Record<string, number> = {};
      worksheet.getRow(1).eachCell((cell, colNumber) => {
        map[cell.text.trim()] = colNumber;
      });

      // Basic validation
      expect(worksheet).toBeDefined();

      // Confirm data rows match expected content
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header

        const restaurantId = row.getCell(map['restaurantId'])?.text?.toLowerCase() ?? '';

        expect(restaurantId).toContain(restaurantId);
      });
    });

    it('should export orders in PDF format', async () => {
      const res = await request(app)
        .get(`/api/orders/export`)
        .query({
          format: 'pdf',
          paymentStatus: ['PAID', 'UNPAID'].join(','),
          paymentMethod: ['CARD', 'ONLINE'].join(','),
          tableNumber: 1,
        })
        .set('Authorization', `Bearer ${adminToken}`)
        .buffer()
        .parse((res, callback) => {
          const chunks: Uint8Array<ArrayBufferLike>[] = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => callback(null, Buffer.concat(chunks)));
        });

      expect(res.statusCode).toBe(200);

      expect(res.body.slice(0, 4).toString()).toBe('%PDF');

      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['content-disposition']).toContain('attachment; filename="Orders.pdf"');
      expect(parseInt(res.headers['content-length'])).toBeGreaterThan(0);
    });
  });
});
