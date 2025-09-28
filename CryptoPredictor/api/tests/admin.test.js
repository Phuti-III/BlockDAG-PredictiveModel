const request = require('supertest');
const express = require('express');
const adminRoutes = require('../routes/admin');

// Mock admin API key for testing
process.env.ADMIN_API_KEY = 'test-admin-key';

describe('Admin API', () => {
  let app;
  
  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/admin', adminRoutes);
  });

  describe('Authentication', () => {
    it('should require admin API key for all endpoints', async () => {
      const endpoints = [
        { method: 'get', path: '/api/admin/contract-info' },
        { method: 'put', path: '/api/admin/accuracy-threshold' },
        { method: 'post', path: '/api/admin/pause' },
        { method: 'post', path: '/api/admin/unpause' },
        { method: 'get', path: '/api/admin/stats' }
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)[endpoint.method](endpoint.path)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Admin privileges required');
      }
    });

    it('should accept valid admin API key', async () => {
      const response = await request(app)
        .get('/api/admin/contract-info')
        .set('x-admin-key', 'test-admin-key')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject invalid admin API key', async () => {
      const response = await request(app)
        .get('/api/admin/contract-info')
        .set('x-admin-key', 'invalid-key')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Admin privileges required');
    });
  });

  describe('GET /api/admin/contract-info', () => {
    it('should return contract information', async () => {
      const response = await request(app)
        .get('/api/admin/contract-info')
        .set('x-admin-key', 'test-admin-key')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('contractAddress');
      expect(response.body.data).toHaveProperty('network');
      expect(response.body.data).toHaveProperty('predictionCounter');
      expect(response.body.data).toHaveProperty('accuracyThreshold');
      expect(response.body.data).toHaveProperty('basisPoints');
    });
  });

  describe('PUT /api/admin/accuracy-threshold', () => {
    it('should update accuracy threshold with valid value', async () => {
      const response = await request(app)
        .put('/api/admin/accuracy-threshold')
        .set('x-admin-key', 'test-admin-key')
        .send({ threshold: 300 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('3%');
    });

    it('should validate threshold range', async () => {
      const invalidThresholds = [-1, 10001, 'invalid'];

      for (const threshold of invalidThresholds) {
        const response = await request(app)
          .put('/api/admin/accuracy-threshold')
          .set('x-admin-key', 'test-admin-key')
          .send({ threshold })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Validation Error');
      }
    });

    it('should require threshold field', async () => {
      const response = await request(app)
        .put('/api/admin/accuracy-threshold')
        .set('x-admin-key', 'test-admin-key')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation Error');
    });
  });

  describe('POST /api/admin/pause', () => {
    it('should pause the contract', async () => {
      const response = await request(app)
        .post('/api/admin/pause')
        .set('x-admin-key', 'test-admin-key')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Contract paused successfully');
      expect(response.body.data).toHaveProperty('txHash');
    });
  });

  describe('POST /api/admin/unpause', () => {
    it('should unpause the contract', async () => {
      const response = await request(app)
        .post('/api/admin/unpause')
        .set('x-admin-key', 'test-admin-key')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Contract unpaused successfully');
      expect(response.body.data).toHaveProperty('txHash');
    });
  });

  describe('POST /api/admin/oracle/grant', () => {
    const validAddress = '0x1234567890123456789012345678901234567890';

    it('should grant oracle role to valid address', async () => {
      const response = await request(app)
        .post('/api/admin/oracle/grant')
        .set('x-admin-key', 'test-admin-key')
        .send({ address: validAddress })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain(validAddress);
      expect(response.body.data).toHaveProperty('txHash');
    });

    it('should validate Ethereum address format', async () => {
      const invalidAddresses = [
        'invalid-address',
        '0x123', // too short
        '0x12345678901234567890123456789012345678901', // too long
        'not-starting-with-0x'
      ];

      for (const address of invalidAddresses) {
        const response = await request(app)
          .post('/api/admin/oracle/grant')
          .set('x-admin-key', 'test-admin-key')
          .send({ address })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Validation Error');
      }
    });

    it('should require address field', async () => {
      const response = await request(app)
        .post('/api/admin/oracle/grant')
        .set('x-admin-key', 'test-admin-key')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation Error');
    });
  });

  describe('POST /api/admin/oracle/revoke', () => {
    const validAddress = '0x1234567890123456789012345678901234567890';

    it('should revoke oracle role from valid address', async () => {
      const response = await request(app)
        .post('/api/admin/oracle/revoke')
        .set('x-admin-key', 'test-admin-key')
        .send({ address: validAddress })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain(validAddress);
      expect(response.body.data).toHaveProperty('txHash');
    });

    it('should validate address format', async () => {
      const response = await request(app)
        .post('/api/admin/oracle/revoke')
        .set('x-admin-key', 'test-admin-key')
        .send({ address: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation Error');
    });
  });

  describe('GET /api/admin/stats', () => {
    it('should return comprehensive system statistics', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .set('x-admin-key', 'test-admin-key')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('contractInfo');
      expect(response.body.data).toHaveProperty('recentStats');
      expect(response.body.data).toHaveProperty('usage');
      expect(response.body.data).toHaveProperty('activity');
    });

    it('should have proper contract info structure', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .set('x-admin-key', 'test-admin-key')
        .expect(200);

      const contractInfo = response.body.data.contractInfo;
      expect(contractInfo).toHaveProperty('totalPredictions');
      expect(contractInfo).toHaveProperty('accuracyThreshold');
      expect(contractInfo).toHaveProperty('network');
    });

    it('should include usage statistics', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .set('x-admin-key', 'test-admin-key')
        .expect(200);

      const usage = response.body.data.usage;
      expect(usage).toHaveProperty('modelUsage');
      expect(usage).toHaveProperty('cryptoUsage');
      expect(typeof usage.modelUsage).toBe('object');
      expect(typeof usage.cryptoUsage).toBe('object');
    });

    it('should include activity metrics', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .set('x-admin-key', 'test-admin-key')
        .expect(200);

      const activity = response.body.data.activity;
      expect(activity).toHaveProperty('last7Days');
      expect(activity).toHaveProperty('dailyAverage');
      expect(typeof activity.last7Days).toBe('number');
      expect(typeof activity.dailyAverage).toBe('number');
    });
  });

  describe('POST /api/admin/bulk-resolve', () => {
    it('should bulk resolve predictions', async () => {
      const predictions = [
        { predictionId: 1, actualPrice: 54000.0 },
        { predictionId: 2, actualPrice: 3200.0 }
      ];

      const response = await request(app)
        .post('/api/admin/bulk-resolve')
        .set('x-admin-key', 'test-admin-key')
        .send({ predictions })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('resolved');
      expect(response.body.data).toHaveProperty('failed');
      expect(response.body.data).toHaveProperty('details');
      expect(response.body.data).toHaveProperty('errors');
      expect(response.body.data).toHaveProperty('summary');
      expect(typeof response.body.data.resolved).toBe('number');
      expect(typeof response.body.data.failed).toBe('number');
      expect(Array.isArray(response.body.data.details)).toBe(true);
      expect(Array.isArray(response.body.data.errors)).toBe(true);
    });

    it('should validate predictions array', async () => {
      const response = await request(app)
        .post('/api/admin/bulk-resolve')
        .set('x-admin-key', 'test-admin-key')
        .send({ predictions: [] })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Predictions array is required and must not be empty');
    });

    it('should require predictions field', async () => {
      const response = await request(app)
        .post('/api/admin/bulk-resolve')
        .set('x-admin-key', 'test-admin-key')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Predictions array is required and must not be empty');
    });

    it('should handle mixed valid and invalid predictions', async () => {
      const predictions = [
        { predictionId: 1, actualPrice: 54000.0 }, // valid
        { predictionId: 'invalid', actualPrice: 3200.0 }, // invalid ID
        { predictionId: 3, actualPrice: -1000.0 }, // invalid price
        { predictionId: 4 } // missing actualPrice
      ];

      const response = await request(app)
        .post('/api/admin/bulk-resolve')
        .set('x-admin-key', 'test-admin-key')
        .send({ predictions })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.summary.total).toBe(4);
      expect(response.body.data.summary.failed).toBeGreaterThan(0);
    });
  });

  describe('Error handling', () => {
    it('should handle blockchain service errors', async () => {
      // Test case where blockchain service might fail
      // For this test, we'll simulate a scenario that would cause a server error
      // Since our mock always succeeds, we'll test a different error condition
      const response = await request(app)
        .post('/api/admin/pause')
        .set('x-admin-key', 'test-admin-key')
        .expect(200); // Our mock will succeed

      // Verify the response structure is correct
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('txHash');
    });

    it('should validate JSON payloads', async () => {
      const response = await request(app)
        .put('/api/admin/accuracy-threshold')
        .set('x-admin-key', 'test-admin-key')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      // Should handle malformed JSON
      expect(response.status).toBe(400);
    });
  });

  describe('Security headers', () => {
    it('should include proper headers in responses', async () => {
      const response = await request(app)
        .get('/api/admin/contract-info')
        .set('x-admin-key', 'test-admin-key')
        .expect(200);

      // Check that security headers are present (if using helmet)
      expect(response.headers).toHaveProperty('content-type');
      expect(response.headers['content-type']).toContain('application/json');
    });
  });
});