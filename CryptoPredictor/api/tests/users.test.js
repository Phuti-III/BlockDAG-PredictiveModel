const request = require('supertest');
const express = require('express');
const userRoutes = require('../routes/users');

describe('Users API', () => {
  let app;
  const testAddress = '0x1234567890123456789012345678901234567890';
  
  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/users', userRoutes);
  });

  describe('GET /api/users/:address/stats', () => {
    it('should return user statistics for valid address', async () => {
      const response = await request(app)
        .get(`/api/users/${testAddress}/stats`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('address', testAddress);
      expect(response.body.data).toHaveProperty('totalPredictions');
      expect(response.body.data).toHaveProperty('accuratePredictions');
      expect(response.body.data).toHaveProperty('accuracyRate');
      expect(response.body.data).toHaveProperty('averageAccuracy');
    });

    it('should return 400 for invalid Ethereum address', async () => {
      const response = await request(app)
        .get('/api/users/invalid-address/stats')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid Ethereum address');
    });

    it('should return 400 for short address', async () => {
      const response = await request(app)
        .get('/api/users/0x123/stats')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid Ethereum address');
    });
  });

  describe('GET /api/users/:address/predictions', () => {
    it('should return user predictions', async () => {
      const response = await request(app)
        .get(`/api/users/${testAddress}/predictions`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toHaveProperty('address', testAddress);
    });

    it('should filter by resolved status', async () => {
      const response = await request(app)
        .get(`/api/users/${testAddress}/predictions?resolved=true`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.meta.filters.resolved).toBe('true');
    });

    it('should filter by cryptocurrency', async () => {
      const response = await request(app)
        .get(`/api/users/${testAddress}/predictions?crypto=BTC`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.meta.filters.crypto).toBe('BTC');
    });

    it('should filter by model type', async () => {
      const response = await request(app)
        .get(`/api/users/${testAddress}/predictions?modelType=LSTM`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.meta.filters.modelType).toBe('LSTM');
    });
  });

  describe('GET /api/users/:address/model-stats/:modelType', () => {
    it('should return model-specific stats for user', async () => {
      const response = await request(app)
        .get(`/api/users/${testAddress}/model-stats/LSTM`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('address', testAddress);
      expect(response.body.data).toHaveProperty('modelType', 'LSTM');
      expect(response.body.data).toHaveProperty('predictionCount');
    });
  });

  describe('GET /api/users/:address/crypto-stats/:crypto', () => {
    it('should return crypto-specific stats for user', async () => {
      const response = await request(app)
        .get(`/api/users/${testAddress}/crypto-stats/btc`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('address', testAddress);
      expect(response.body.data).toHaveProperty('cryptocurrency', 'BTC');
      expect(response.body.data).toHaveProperty('predictionCount');
    });
  });

  describe('GET /api/users/:address/performance', () => {
    it('should return comprehensive user performance analysis', async () => {
      const response = await request(app)
        .get(`/api/users/${testAddress}/performance`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('address', testAddress);
      expect(response.body.data).toHaveProperty('overallStats');
      expect(response.body.data).toHaveProperty('cryptoPerformance');
      expect(response.body.data).toHaveProperty('modelPerformance');
      expect(response.body.data).toHaveProperty('timeline');
      expect(Array.isArray(response.body.data.timeline)).toBe(true);
    });

    it('should have proper structure for overall stats', async () => {
      const response = await request(app)
        .get(`/api/users/${testAddress}/performance`)
        .expect(200);

      const overallStats = response.body.data.overallStats;
      expect(overallStats).toHaveProperty('totalPredictions');
      expect(overallStats).toHaveProperty('accuratePredictions');
      expect(overallStats).toHaveProperty('accuracyRate');
      expect(overallStats).toHaveProperty('averageAccuracy');
    });
  });

  describe('Address validation', () => {
    const invalidAddresses = [
      'not-an-address',
      '0x123', // too short
      '0x12345678901234567890123456789012345678901', // too long
      '0xzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz', // invalid hex
      'address-without-0x'
    ];

    invalidAddresses.forEach(address => {
      it(`should reject invalid address: ${address}`, async () => {
        const response = await request(app)
          .get(`/api/users/${address}/stats`)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Invalid Ethereum address');
      });
    });
  });
});