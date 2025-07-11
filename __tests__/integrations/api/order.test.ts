import { faker } from '@faker-js/faker';
import request from 'supertest';

import app from '../../../src/app';
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

describe('Order API', () => {
  let ownerToken: string;
  let customerToken: string;
  let restaurantId: string;
  let menuItemId: string;
  let orderId: string;
  let categoryId: string;
  let adminToken: string;

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
    customerToken = customerRes.body.data.data.accessToken;

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
          discount: 0,
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
          discount: 0,
        });

      expect(res.statusCode).toBe(400);
    });

    it('should return 400 if restaurantId is missing', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ menuItemId, quantity: 2 }],
          discount: 0,
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
          discount: 0,
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
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ notes: 'Unauthorized update' });

      expect(res.statusCode).toBe(403);
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
  });

  describe('PATCH /orders/:id/pay-order', () => {
    it('should mark order as paid', async () => {
      const orderRes = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          restaurantId,
          items: [{ menuItemId, quantity: 2 }],
          discount: 0,
        });

      const orderId = orderRes.body.data.data.id;

      const res = await request(app)
        .patch(`/api/orders/${orderId}/pay-order`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ method: 'CARD' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.data.paymentStatus).toBe('PAID');
    });

    it('should return 404 for invalid order ID', async () => {
      const res = await request(app)
        .patch('/api/orders/non-existing-id/pay-order')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ method: 'CARD' });

      expect(res.statusCode).toBe(404);
    });

    it('should return 400 for invalid payment method', async () => {
      const res = await request(app)
        .patch(`/api/orders/${orderId}/pay-order`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ method: 'BITCOIN' });

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
          discount: 0,
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
      const anotherCustomer = await request(app).post('/api/auth/login').send({
        email: CUSTOMER_2_EMAIL,
        password: CUSTOMER_2_PASSWORD,
      });

      const anotherToken = anotherCustomer.body.data.data.accessToken;

      const res = await request(app)
        .patch(`/api/orders/${orderId}/cancel-order`)
        .set('Authorization', `Bearer ${anotherToken}`);

      expect(res.statusCode).toBe(403);
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
          discount: 0,
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
});
