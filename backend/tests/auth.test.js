const request = require('supertest');
const mongoose = require('mongoose');

const app = require('../src/app');
const User = require('../src/models/User');

const TEST_DB =
  process.env.TEST_MONGO_URI ||
  'mongodb://127.0.0.1:27017/fitsense_ai_test';

beforeAll(async () => {
  await mongoose.connect(TEST_DB);
});

beforeEach(async () => {
  await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe('Authentication API', () => {
  test('registers a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123',
      });

    expect(response.statusCode).toBe(201);

    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user');

    expect(response.body.user.email)
      .toBe('test@example.com');

    expect(response.body.user.name)
      .toBe('Test User');
  });

  test('rejects duplicate email registration', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123',
      });

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Another User',
        email: 'test@example.com',
        password: 'Password123',
      });

    expect(response.statusCode).toBe(409);
    expect(response.body.message)
      .toBe('Email already registered');
  });

  test('rejects invalid registration data', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'A',
        email: '',
        password: '123',
      });

    expect(response.statusCode).toBe(400);
  });

  test('logs in with valid credentials', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123',
      });

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Password123',
      });

    expect(response.statusCode).toBe(200);

    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user');

    expect(response.body.user.email)
      .toBe('test@example.com');
  });

  test('rejects invalid login credentials', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123',
      });

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'WrongPassword',
      });

    expect(response.statusCode).toBe(401);

    expect(response.body.message)
      .toBe('Invalid email or password');
  });

  test('normalizes email during registration', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: '  TEST@EXAMPLE.COM  ',
        password: 'Password123',
      });

    expect(response.statusCode).toBe(201);

    expect(response.body.user.email)
      .toBe('test@example.com');
  });
});