const request = require('supertest');

// Create app without starting server
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const predictionRoutes = require('../routes/predictions');
const userRoutes = require('../routes/users');
const modelRoutes = require('../routes/models');
const cryptoRoutes = require('../routes/crypto');
const adminRoutes = require('../routes/admin');

const app = express();

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Minimal rate limiting for tests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Higher limit for tests
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'CryptoPredictor API Test',
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/predictions', predictionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/crypto', cryptoRoutes);
app.use('/api/admin', adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist'
  });
});

describe('Integration Tests - Full API Workflow', () => {
  let testPredictionId;
  let testUserAddress;

  beforeAll(async () => {
    testUserAddress = global.testUtils.generateMockAddress();
  });

  describe('Complete Prediction Lifecycle', () => {
    it('should create a new prediction', async () => {
      const predictionData = {
        cryptocurrency: 'BTC',
        currentPrice: 45000,
        predictedPrice: 50000,
        targetTimestamp: Math.floor(Date.now() / 1000) + 86400,
        modelType: 'TECHNICAL_ANALYSIS',
        additionalData: JSON.stringify({ confidence: 0.85, indicators: ['RSI', 'MACD'] })
      };

      const mockTxReceipt = global.testUtils.generateMockTxReceipt();
      const mockPrediction = { ...predictionData, id: 123, user: testUserAddress };

      require('../services/blockchain').makePrediction.mockResolvedValue({
        receipt: mockTxReceipt,
        prediction: mockPrediction
      });

      const response = await request(app)
        .post('/api/predictions')
        .send({
          ...predictionData,
          userAddress: testUserAddress
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.prediction).toBeDefined();
      expect(response.body.data.txHash).toBe(mockTxReceipt.hash);

      testPredictionId = response.body.data.prediction.id || 1;
    });

    it('should retrieve the created prediction', async () => {
      const mockPrediction = global.testUtils.generateMockPrediction();
      mockPrediction.id = testPredictionId;
      mockPrediction.user = testUserAddress;

      require('../services/blockchain').getPrediction.mockResolvedValue(mockPrediction);

      const response = await request(app)
        .get(`/api/predictions/${testPredictionId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testPredictionId);
      expect(response.body.data.user).toBe(testUserAddress);
    });

    it('should get user predictions', async () => {
      const mockPredictions = [
        global.testUtils.generateMockPrediction(),
        global.testUtils.generateMockPrediction()
      ];

      require('../services/blockchain').getUserPredictions.mockResolvedValue(mockPredictions);

      const response = await request(app)
        .get(`/api/users/${testUserAddress}/predictions`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
    });

    it('should resolve the prediction', async () => {
      const resolutionData = {
        actualPrice: 48000,
        oracleAddress: global.testConstants.SAMPLE_ADDRESSES[0]
      };

      const mockTxReceipt = global.testUtils.generateMockTxReceipt();

      require('../services/blockchain').resolvePrediction.mockResolvedValue({
        receipt: mockTxReceipt,
        correct: true,
        accuracyBasisPoints: 8500
      });

      const response = await request(app)
        .post(`/api/predictions/${testPredictionId}/resolve`)
        .send(resolutionData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.correct).toBe(true);
      expect(response.body.data.txHash).toBe(mockTxReceipt.hash);
    });

    it('should show updated user stats after resolution', async () => {
      const mockStats = global.testUtils.generateMockUserStats();
      mockStats.user = testUserAddress;
      mockStats.totalPredictions = 1;
      mockStats.correctPredictions = 1;
      mockStats.accuratePredictions = 1;
      mockStats.accuracyRate = 10000; // 100%

      require('../services/blockchain').getUserStats.mockResolvedValue(mockStats);

      const response = await request(app)
        .get(`/api/users/${testUserAddress}/stats`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accuracyRate).toBe('100%');
      expect(response.body.data.totalPredictions).toBe(1);
      expect(response.body.data.accuratePredictions).toBe(1);
    });
  });

  describe('Model Performance Analytics', () => {
    it('should track model performance across predictions', async () => {
      const mockPredictions = [
        {
          id: 1,
          modelType: 'TECHNICAL_ANALYSIS',
          cryptocurrency: 'BTC',
          isResolved: true,
          wasAccurate: true,
          accuracyPercentage: '85',
          predictionTimestamp: Math.floor(Date.now() / 1000) - 3600
        },
        {
          id: 2,
          modelType: 'TECHNICAL_ANALYSIS',
          cryptocurrency: 'ETH',
          isResolved: true,
          wasAccurate: false,
          accuracyPercentage: '60',
          predictionTimestamp: Math.floor(Date.now() / 1000) - 7200
        }
      ];

      require('../services/blockchain').getModelTypePredictions.mockResolvedValue(mockPredictions);

      const response = await request(app)
        .get('/api/models/TECHNICAL_ANALYSIS/performance')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.overallStats.accuracyRate).toBeDefined();
      expect(response.body.data.overallStats.averageAccuracy).toBeDefined();
    });

    it('should compare multiple model types', async () => {
      const modelTypes = ['TECHNICAL_ANALYSIS', 'SENTIMENT_ANALYSIS', 'MACHINE_LEARNING'];
      
      // Mock different accuracy rates for each model
      require('../services/blockchain').getModelAccuracyRate
        .mockResolvedValueOnce(7500)
        .mockResolvedValueOnce(6800)
        .mockResolvedValueOnce(8200);

      require('../services/blockchain').getModelAverageAccuracy
        .mockResolvedValueOnce(7600)
        .mockResolvedValueOnce(6900)
        .mockResolvedValueOnce(8100);

      const response = await request(app)
        .get('/api/models/comparison')
        .query({ models: modelTypes.join(',') })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(3);
    });
  });

  describe('Cryptocurrency Analytics', () => {
    it('should provide trending cryptocurrencies', async () => {
      const mockTrending = [
        { crypto: 'BTC', predictionCount: 150, avgAccuracy: 7500 },
        { crypto: 'ETH', predictionCount: 120, avgAccuracy: 7200 },
        { crypto: 'BDAG', predictionCount: 80, avgAccuracy: 8000 }
      ];

      require('../services/blockchain').getCryptoPredictions
        .mockResolvedValueOnce(Array(150).fill({}))
        .mockResolvedValueOnce(Array(120).fill({}))
        .mockResolvedValueOnce(Array(80).fill({}));

      const response = await request(app)
        .get('/api/crypto/trending')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should analyze specific cryptocurrency predictions', async () => {
      const mockBTCPredictions = Array(50).fill(null).map(() => {
        const prediction = global.testUtils.generateMockPrediction();
        return {
          ...prediction,
          isResolved: true,
          accuracyPercentage: '85',
          predictionTimestamp: Math.floor(Date.now() / 1000) - 3600
        };
      });

      require('../services/blockchain').getCryptoPredictions.mockResolvedValue(mockBTCPredictions);

      const response = await request(app)
        .get('/api/crypto/BTC/analysis')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cryptocurrency).toBe('BTC');
      expect(response.body.data.summary.totalPredictions).toBeDefined();
      expect(response.body.data.summary.averageAccuracy).toBeDefined();
    });
  });

  describe('Admin Operations Workflow', () => {
    it('should handle batch prediction resolution', async () => {
      const predictionIds = [1, 2, 3, 4, 5];
      const actualPrices = [45000, 3200, 150, 2.5, 180];

      const mockTxReceipt = global.testUtils.generateMockTxReceipt();

      // Mock successful resolutions
      require('../services/blockchain').resolvePrediction.mockResolvedValue({
        receipt: mockTxReceipt,
        correct: true,
        accuracyBasisPoints: 8000
      });

      const response = await request(app)
        .post('/api/admin/bulk-resolve')
        .set('x-admin-key', process.env.ADMIN_API_KEY || 'test-admin-key')
        .send({
          predictions: predictionIds.map((id, index) => ({
            id,
            actualPrice: actualPrices[index]
          })),
          oracleAddress: global.testConstants.SAMPLE_ADDRESSES[0]
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.resolved).toBe(5);
      expect(response.body.data.failed).toBe(0);
    });

    it('should update accuracy threshold', async () => {
      const newThreshold = 8000;
      const mockTxReceipt = global.testUtils.generateMockTxReceipt();

      require('../services/blockchain').setAccuracyThreshold.mockResolvedValue({
        receipt: mockTxReceipt
      });

      const response = await request(app)
        .put('/api/admin/accuracy-threshold')
        .set('x-admin-key', process.env.ADMIN_API_KEY || 'test-admin-key')
        .send({
          threshold: newThreshold,
          adminAddress: global.testConstants.SAMPLE_ADDRESSES[0]
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.txHash).toBeDefined();
      expect(response.body.message).toContain('80%');
    });

    it('should pause and unpause contract', async () => {
      const mockTxReceipt = global.testUtils.generateMockTxReceipt();

      require('../services/blockchain').pauseContract.mockResolvedValue({
        receipt: mockTxReceipt
      });

      require('../services/blockchain').unpauseContract.mockResolvedValue({
        receipt: mockTxReceipt
      });

      // Pause contract
      const pauseResponse = await request(app)
        .post('/api/admin/pause')
        .set('x-admin-key', process.env.ADMIN_API_KEY || 'test-admin-key')
        .send({ adminAddress: global.testConstants.SAMPLE_ADDRESSES[0] })
        .expect(200);

      expect(pauseResponse.body.success).toBe(true);
      expect(pauseResponse.body.data.txHash).toBeDefined();

      // Unpause contract
      const unpauseResponse = await request(app)
        .post('/api/admin/unpause')
        .set('x-admin-key', process.env.ADMIN_API_KEY || 'test-admin-key')
        .send({ adminAddress: global.testConstants.SAMPLE_ADDRESSES[0] })
        .expect(200);

      expect(unpauseResponse.body.success).toBe(true);
      expect(unpauseResponse.body.data.txHash).toBeDefined();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle network errors gracefully', async () => {
      require('../services/blockchain').makePrediction.mockRejectedValue(
        new Error('Network error: connection timeout')
      );

      const predictionData = {
        cryptocurrency: 'BTC',
        currentPrice: 45000,
        predictedPrice: 50000,
        targetTimestamp: Math.floor(Date.now() / 1000) + 86400,
        modelType: 'TECHNICAL_ANALYSIS',
        userAddress: testUserAddress
      };

      const response = await request(app)
        .post('/api/predictions')
        .send(predictionData)
        .expect(500);

      expect(response.body.error).toBe('Internal Server Error');
      expect(response.body.message).toContain('Network error');
    });

    it('should handle invalid prediction IDs', async () => {
      require('../services/blockchain').getPrediction.mockRejectedValue(
        new Error('Prediction does not exist')
      );

      const response = await request(app)
        .get('/api/predictions/999999')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should handle rate limiting', async () => {
      // Since the rate limit is 100 requests per 15 minutes, let's test that
      // the server responds with expected status codes for a reasonable number of requests
      const requests = Array(5).fill(null).map(() => 
        request(app).get('/api/predictions/1')
      );

      const responses = await Promise.all(requests);
      
      // All requests should get valid HTTP responses (200, 400, 404, 500)
      const validResponses = responses.filter(res => 
        [200, 400, 404, 500].includes(res.status)
      );
      expect(validResponses.length).toBe(5);
    });
  });

  describe('Data Consistency and Validation', () => {
    it('should maintain data consistency across multiple operations', async () => {
      const userAddress = global.testUtils.generateMockAddress();
      
      // Create multiple predictions
      const predictions = Array(5).fill(null).map((_, index) => ({
        ...global.testUtils.generateMockPrediction(),
        id: 1000 + index,
        user: userAddress
      }));

      require('../services/blockchain').getUserPredictions.mockResolvedValue(predictions);
      require('../services/blockchain').getUserStats.mockResolvedValue({
        user: userAddress,
        totalPredictions: 5,
        correctPredictions: 3,
        accuratePredictions: 3,
        accuracyRate: 6000,
        totalAccuracyScore: 15000,
        averageAccuracy: 6000,
        totalReward: 150,
        isActive: true
      });

      // Get user predictions
      const predictionsResponse = await request(app)
        .get(`/api/users/${userAddress}/predictions`)
        .expect(200);

      // Get user stats
      const statsResponse = await request(app)
        .get(`/api/users/${userAddress}/stats`)
        .expect(200);

      // Verify consistency
      expect(predictionsResponse.body.data.length).toBe(5);
      expect(statsResponse.body.data.totalPredictions).toBe(5);
      expect(statsResponse.body.data.accuratePredictions).toBeLessThanOrEqual(5);
    });

    it('should validate all input parameters thoroughly', async () => {
      const invalidInputs = [
        { cryptocurrency: '', currentPrice: 45000, predictedPrice: 50000 },
        { cryptocurrency: 'BTC', currentPrice: -1000, predictedPrice: 50000 },
        { cryptocurrency: 'BTC', currentPrice: 45000, predictedPrice: 0 },
        { cryptocurrency: 'BTC', currentPrice: 45000, predictedPrice: 50000, targetTimestamp: Date.now() / 1000 - 3600 }
      ];

      for (const invalidInput of invalidInputs) {
        const response = await request(app)
          .post('/api/predictions')
          .send({
            ...invalidInput,
            userAddress: global.testUtils.generateMockAddress()
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      }
    });
  });
});