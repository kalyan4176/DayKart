import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/User.js';

describe('Authentication API Endpoints', () => {
  beforeAll(async () => {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/daykart-test';
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await User.deleteMany({ email: 'test_integration@daykart.com' });
    await mongoose.connection.close();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new customer user successfully', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Integration Test User',
          email: 'test_integration@daykart.com',
          password: 'Password123!',
          role: 'customer',
          phoneNumber: '9999999999',
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.status).toEqual('success');
      expect(res.body.message).toContain('Registration successful');
    });

    it('should prevent registration with a weak password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Weak Password User',
          email: 'weak_password@daykart.com',
          password: 'pass',
          role: 'customer',
          phoneNumber: '9999999999',
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.status).toEqual('fail');
    });

    it('should prevent registration with a duplicate email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Duplicate User',
          email: 'test_integration@daykart.com',
          password: 'Password123!',
          phoneNumber: '9999999999',
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.status).toEqual('fail');
      expect(res.body.message).toContain('already in use');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should deny access for incorrect credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test_integration@daykart.com',
          password: 'WrongPassword123!',
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body.status).toEqual('fail');
      expect(res.body.message).toContain('Incorrect email or password');
    });
  });
});
