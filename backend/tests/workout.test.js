const request = require('supertest');
const mongoose = require('mongoose');

const app = require('../src/app');
const User = require('../src/models/User');
const Workout = require('../src/models/Workout');

const TEST_DB =
  process.env.TEST_MONGO_URI ||
  'mongodb://127.0.0.1:27017/fitsense_ai_test';

let token;
let userId;

async function registerAndLogin() {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Workout Test User',
      email: 'workout@example.com',
      password: 'Password123',
    });

  token = response.body.token;
  userId = response.body.user.id;
}

beforeAll(async () => {
  await mongoose.connect(TEST_DB);
});

beforeEach(async () => {
  await Workout.deleteMany({});
  await User.deleteMany({});

  await registerAndLogin();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

const workoutPayload = {
  exercise: 'Bench Press',
  category: 'STRENGTH',
  durationMin: 50,
  calories: 320,
  sets: 4,
  reps: 8,
  weightKg: 60,
  intensity: 7,
  notes: 'Good session',
};

describe('Workout API', () => {
  test('rejects unauthenticated workout creation', async () => {
    const response = await request(app)
      .post('/api/workouts')
      .send(workoutPayload);

    expect(response.statusCode).toBe(401);
  });

  test('creates a workout for the authenticated user', async () => {
    const response = await request(app)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${token}`)
      .send(workoutPayload);

    expect(response.statusCode).toBe(201);

    expect(response.body.exercise)
      .toBe('Bench Press');

    expect(response.body.category)
      .toBe('STRENGTH');

    expect(response.body.user.toString())
      .toBe(userId.toString());
  });

  test('lists only the authenticated user workouts', async () => {
    await request(app)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${token}`)
      .send(workoutPayload);

    const response = await request(app)
      .get('/api/workouts')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);

    expect(response.body).toHaveProperty('items');
    expect(response.body).toHaveProperty('total');

    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].exercise)
      .toBe('Bench Press');
  });

  test('supports category filtering', async () => {
    await request(app)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${token}`)
      .send(workoutPayload);

    await request(app)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        exercise: 'Running',
        category: 'CARDIO',
        durationMin: 30,
        calories: 250,
      });

    const response = await request(app)
      .get('/api/workouts?category=CARDIO')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].category)
      .toBe('CARDIO');
  });

  test('supports pagination', async () => {
    for (let i = 0; i < 3; i += 1) {
      await request(app)
        .post('/api/workouts')
        .set('Authorization', `Bearer ${token}`)
        .send({
          ...workoutPayload,
          exercise: `Exercise ${i + 1}`,
        });
    }

    const response = await request(app)
      .get('/api/workouts?page=1&limit=2')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.items).toHaveLength(2);
    expect(response.body.page).toBe(1);
    expect(response.body.limit).toBe(2);
    expect(response.body.total).toBe(3);
    expect(response.body.pages).toBe(2);
  });

  test('updates an owned workout', async () => {
    const createResponse = await request(app)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${token}`)
      .send(workoutPayload);

    const workoutId =
      createResponse.body._id;

    const response = await request(app)
      .put(`/api/workouts/${workoutId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        weightKg: 65,
        reps: 10,
        intensity: 8,
      });

    expect(response.statusCode).toBe(200);

    expect(response.body.weightKg)
      .toBe(65);

    expect(response.body.reps)
      .toBe(10);

    expect(response.body.intensity)
      .toBe(8);
  });

  test('cannot update another user workout', async () => {
    const createResponse = await request(app)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${token}`)
      .send(workoutPayload);

    const workoutId =
      createResponse.body._id;

    const secondUserResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Second User',
        email: 'second@example.com',
        password: 'Password123',
      });

    const secondToken =
      secondUserResponse.body.token;

    const response = await request(app)
      .put(`/api/workouts/${workoutId}`)
      .set(
        'Authorization',
        `Bearer ${secondToken}`
      )
      .send({
        weightKg: 100,
      });

    expect(response.statusCode).toBe(404);
    expect(response.body.message)
      .toBe('Workout not found');
  });

  test('deletes an owned workout', async () => {
    const createResponse = await request(app)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${token}`)
      .send(workoutPayload);

    const workoutId =
      createResponse.body._id;

    const response = await request(app)
      .delete(`/api/workouts/${workoutId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);

    expect(response.body.message)
      .toBe('Workout deleted');

    const deleted =
      await Workout.findById(workoutId);

    expect(deleted).toBeNull();
  });

  test('cannot delete another user workout', async () => {
    const createResponse = await request(app)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${token}`)
      .send(workoutPayload);

    const workoutId =
      createResponse.body._id;

    const secondUserResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Second User',
        email: 'second@example.com',
        password: 'Password123',
      });

    const secondToken =
      secondUserResponse.body.token;

    const response = await request(app)
      .delete(`/api/workouts/${workoutId}`)
      .set(
        'Authorization',
        `Bearer ${secondToken}`
      );

    expect(response.statusCode).toBe(404);
    expect(response.body.message)
      .toBe('Workout not found');
  });

  test('rejects invalid workout data', async () => {
    const response = await request(app)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        exercise: '',
        durationMin: 0,
        category: 'INVALID_CATEGORY',
      });

    expect(response.statusCode).toBe(400);
  });
});