const request = require('supertest');
const mongoose = require('mongoose');

const app = require('../src/app');
const User = require('../src/models/User');
const Goal = require('../src/models/Goal');

const TEST_DB =
  process.env.TEST_MONGO_URI ||
  'mongodb://127.0.0.1:27017/fitsense_ai_test';

let token;
let userId;

async function registerAndLogin() {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Goal Test User',
      email: 'goal@example.com',
      password: 'Password123',
    });

  token = response.body.token;
  userId = response.body.user.id;
}

beforeAll(async () => {
  await mongoose.connect(TEST_DB);
});

beforeEach(async () => {
  await Goal.deleteMany({});
  await User.deleteMany({});

  await registerAndLogin();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

const goalPayload = {
  title: 'Complete 16 workouts',
  metric: 'WORKOUTS',
  target: 16,
  current: 5,
  status: 'ACTIVE',
};

describe('Goals API', () => {
  test('rejects unauthenticated goal creation', async () => {
    const response = await request(app)
      .post('/api/goals')
      .send(goalPayload);

    expect(response.statusCode).toBe(401);
  });

  test('creates a goal for the authenticated user', async () => {
    const response = await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${token}`)
      .send(goalPayload);

    expect(response.statusCode).toBe(201);

    expect(response.body.title)
      .toBe('Complete 16 workouts');

    expect(response.body.metric)
      .toBe('WORKOUTS');

    expect(response.body.target)
      .toBe(16);

    expect(response.body.current)
      .toBe(5);

    expect(response.body.user.toString())
      .toBe(userId.toString());
  });

  test('lists only the authenticated user goals', async () => {
    await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${token}`)
      .send(goalPayload);

    const response = await request(app)
      .get('/api/goals')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);

    expect(Array.isArray(response.body))
      .toBe(true);

    expect(response.body).toHaveLength(1);

    expect(response.body[0].title)
      .toBe('Complete 16 workouts');
  });

  test('updates an owned goal', async () => {
    const createResponse = await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${token}`)
      .send(goalPayload);

    const goalId =
      createResponse.body._id;

    const response = await request(app)
      .put(`/api/goals/${goalId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        current: 10,
        status: 'ACTIVE',
      });

    expect(response.statusCode).toBe(200);

    expect(response.body.current)
      .toBe(10);

    expect(response.body.status)
      .toBe('ACTIVE');
  });

  test('can mark a goal as completed', async () => {
    const createResponse = await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${token}`)
      .send(goalPayload);

    const goalId =
      createResponse.body._id;

    const response = await request(app)
      .put(`/api/goals/${goalId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        current: 16,
        status: 'COMPLETED',
      });

    expect(response.statusCode).toBe(200);

    expect(response.body.current)
      .toBe(16);

    expect(response.body.status)
      .toBe('COMPLETED');
  });

  test('can pause a goal', async () => {
    const createResponse = await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${token}`)
      .send(goalPayload);

    const goalId =
      createResponse.body._id;

    const response = await request(app)
      .put(`/api/goals/${goalId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'PAUSED',
      });

    expect(response.statusCode).toBe(200);

    expect(response.body.status)
      .toBe('PAUSED');
  });

  test('cannot update another user goal', async () => {
    const createResponse = await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${token}`)
      .send(goalPayload);

    const goalId =
      createResponse.body._id;

    const secondUserResponse =
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Second User',
          email: 'second-goal@example.com',
          password: 'Password123',
        });

    const secondToken =
      secondUserResponse.body.token;

    const response = await request(app)
      .put(`/api/goals/${goalId}`)
      .set(
        'Authorization',
        `Bearer ${secondToken}`
      )
      .send({
        current: 15,
      });

    expect(response.statusCode).toBe(404);

    expect(response.body.message)
      .toBe('Goal not found');
  });

  test('deletes an owned goal', async () => {
    const createResponse = await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${token}`)
      .send(goalPayload);

    const goalId =
      createResponse.body._id;

    const response = await request(app)
      .delete(`/api/goals/${goalId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);

    expect(response.body.message)
      .toBe('Goal deleted');

    const deleted =
      await Goal.findById(goalId);

    expect(deleted).toBeNull();
  });

  test('cannot delete another user goal', async () => {
    const createResponse = await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${token}`)
      .send(goalPayload);

    const goalId =
      createResponse.body._id;

    const secondUserResponse =
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Second User',
          email: 'second-delete@example.com',
          password: 'Password123',
        });

    const secondToken =
      secondUserResponse.body.token;

    const response = await request(app)
      .delete(`/api/goals/${goalId}`)
      .set(
        'Authorization',
        `Bearer ${secondToken}`
      );

    expect(response.statusCode).toBe(404);

    expect(response.body.message)
      .toBe('Goal not found');
  });

  test('rejects invalid goal data', async () => {
    const response = await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: '',
        metric: 'INVALID_METRIC',
        target: 'invalid',
      });

    expect(response.statusCode).toBe(400);
  });
});