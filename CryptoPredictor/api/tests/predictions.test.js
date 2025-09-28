const request = require('supertest');
const express = require('express');
const predictionRoutes = require('../routes/predictions');

describe('Predictions API', () => {
  let app;
  
  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/predictions', predictionRoutes);
  });

  describe('GET /api/predictions', () => {
    it('should return paginated predictions', async () => {
      const response = await request(app)
        .get('/api/predictions')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter predictions by cryptocurrency', async () => {
      const response = await request(app)
        .get('/api/predictions?crypto=BTC')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter predictions by model type', async () => {
      const response = await request(app)
        .get('/api/predictions?modelType=LSTM')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/predictions?page=1&limit=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
    });
  });

  describe('GET /api/predictions/:id', () => {
    it('should return a specific prediction', async () => {
      const response = await request(app)
        .get('/api/predictions/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
    });

    it('should return 400 for invalid prediction ID', async () => {
      const response = await request(app)
        .get('/api/predictions/invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid prediction ID');
    });
  });

  describe('POST /api/predictions', () => {
    const validPrediction = {
      cryptocurrency: 'BTC',
      currentPrice: 50000.0,
      predictedPrice: 55000.0,
      targetTimestamp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      modelType: 'LSTM',
      additionalData: '{"confidence": 0.85}'
    };

    it('should create a new prediction with valid data', async () => {
      const response = await request(app)
        .post('/api/predictions')
        .send(validPrediction)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Prediction created successfully');
    });

    it('should validate required fields', async () => {
      const invalidPrediction = { ...validPrediction };
      delete invalidPrediction.cryptocurrency;

      const response = await request(app)
        .post('/api/predictions')
        .send(invalidPrediction)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation Error');
    });

    it('should reject past target timestamp', async () => {
      const pastPrediction = {
        ...validPrediction,
        targetTimestamp: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
      };

      const response = await request(app)
        .post('/api/predictions')
        .send(pastPrediction)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Target timestamp must be in the future');
    });
  });

  describe('PUT /api/predictions/:id/resolve', () => {
    it('should resolve a prediction with valid actual price', async () => {
      const response = await request(app)
        .put('/api/predictions/1/resolve')
        .send({ actualPrice: 54000.0 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Prediction resolved successfully');
    });

    it('should validate actual price', async () => {
      const response = await request(app)
        .put('/api/predictions/1/resolve')
        .send({ actualPrice: -1000 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation Error');
    });
  });

  describe('GET /api/predictions/stats/summary', () => {
    it('should return prediction statistics', async () => {
      const response = await request(app)
        .get('/api/predictions/stats/summary')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalPredictions');
      expect(response.body.data).toHaveProperty('accuracyThreshold');
    });
  });

  describe('POST /api/predictions/calculate-accuracy', () => {
    it('should calculate accuracy between two prices', async () => {
      const response = await request(app)
        .post('/api/predictions/calculate-accuracy')
        .send({
          predictedPrice: 50000.0,
          actualPrice: 54000.0
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accuracyBasisPoints');
      expect(response.body.data).toHaveProperty('accuracyPercentage');
    });

    it('should validate input prices', async () => {
      const response = await request(app)
        .post('/api/predictions/calculate-accuracy')
        .send({
          predictedPrice: 0,
          actualPrice: 54000.0
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});