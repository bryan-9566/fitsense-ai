const request = require('supertest');
const mongoose = require('mongoose');

const app = require('../src/app');
const User = require('../src/models/User');
const Workout = require('../src/models/Workout');
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
      name: 'Analytics Test User',
      email: 'analytics@example.com',
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
  await Goal.deleteMany({});
  await User.deleteMany({});

  await registerAndLogin();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe('Analytics API', () => {
  test('rejects unauthenticated analytics requests', async () => {
    const response = await request(app)
      .get('/api/analytics/summary');

    expect(response.statusCode).toBe(401);
  });

  test('returns zero metrics for a new user', async () => {
    const response = await request(app)
      .get('/api/analytics/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.periodDays).toBe(30);
    expect(response.body.workouts30Days).toBe(0);
    expect(response.body.workouts7Days).toBe(0);
    expect(response.body.averageDurationMin).toBe(0);
    expect(response.body.caloriesBurned).toBe(0);
    expect(response.body.trainingVolumeKg).toBe(0);
    expect(response.body.consistencyPercent).toBe(0);
    expect(response.body.currentStreak).toBe(0);
    expect(response.body.activeGoals).toBe(0);
    expect(response.body.completedGoals).toBe(0);
    expect(response.body.goalCompletionPercent).toBe(0);
  });

  test('calculates workout metrics correctly', async () => {
    const now = new Date();

    await Workout.create([
      {
        user: userId,
        exercise: 'Bench Press',
        category: 'STRENGTH',
        durationMin: 60,
        calories: 400,
        sets: 4,
        reps: 8,
        weightKg: 60,
        intensity: 7,
        date: now,
      },
      {
        user: userId,
        exercise: 'Squat',
        category: 'STRENGTH',
        durationMin: 45,
        calories: 300,
        sets: 3,
        reps: 10,
        weightKg: 70,
        intensity: 8,
        date: new Date(
          now.getTime() - 24 * 60 * 60 * 1000
        ),
      },
    ]);

    const response = await request(app)
      .get('/api/analytics/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.workouts30Days).toBe(2);
    expect(response.body.workouts7Days).toBe(2);
    expect(response.body.averageDurationMin).toBe(53);
    expect(response.body.caloriesBurned).toBe(700);
    expect(response.body.trainingVolumeKg).toBe(4020);
    expect(response.body.consistencyPercent).toBe(7);
  });

  test('calculates active and completed goals', async () => {
    await Goal.create([
      {
        user: userId,
        title: 'Complete 16 workouts',
        metric: 'WORKOUTS',
        target: 16,
        current: 5,
        status: 'ACTIVE',
      },
      {
        user: userId,
        title: 'Reach 80 kg',
        metric: 'WEIGHT',
        target: 80,
        current: 80,
        status: 'COMPLETED',
      },
      {
        user: userId,
        title: '14 day streak',
        metric: 'STREAK',
        target: 14,
        current: 14,
        status: 'COMPLETED',
      },
    ]);

    const response = await request(app)
      .get('/api/analytics/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.activeGoals).toBe(1);
    expect(response.body.completedGoals).toBe(2);
    expect(response.body.goalCompletionPercent).toBe(67);
  });

  test('calculates current workout streak', async () => {
    const today = new Date();
    today.setHours(10, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    await Workout.create([
      {
        user: userId,
        exercise: 'Bench Press',
        category: 'STRENGTH',
        durationMin: 45,
        date: today,
      },
      {
        user: userId,
        exercise: 'Squat',
        category: 'STRENGTH',
        durationMin: 45,
        date: yesterday,
      },
      {
        user: userId,
        exercise: 'Row',
        category: 'STRENGTH',
        durationMin: 45,
        date: twoDaysAgo,
      },
    ]);

    const response = await request(app)
      .get('/api/analytics/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.currentStreak).toBe(3);
  });

  test('does not include another user data', async () => {
    const secondUserResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Second User',
        email: 'second-analytics@example.com',
        password: 'Password123',
      });

    const secondUserId =
      secondUserResponse.body.user.id;

    await Workout.create({
      user: secondUserId,
      exercise: 'Running',
      category: 'CARDIO',
      durationMin: 120,
      calories: 1000,
      date: new Date(),
    });

    const response = await request(app)
      .get('/api/analytics/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.workouts30Days).toBe(0);
    expect(response.body.caloriesBurned).toBe(0);
  });
});
