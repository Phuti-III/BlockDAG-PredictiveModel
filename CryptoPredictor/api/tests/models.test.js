const request = require('supertest');
const express = require('express');
const modelRoutes = require('../routes/models');

describe('Models API', () => {
  let app;
  
  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/models', modelRoutes);
  });

  describe('GET /api/models', () => {
    it('should return all model types with performance data', async () => {
      const response = await request(app)
        .get('/api/models')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toHaveProperty('totalModels');
      expect(response.body.meta).toHaveProperty('modelsWithData');
    });

    it('should return models with proper structure', async () => {
      const response = await request(app)
        .get('/api/models')
        .expect(200);

      if (response.body.data.length > 0) {
        const model = response.body.data[0];
        expect(model).toHaveProperty('modelType');
        expect(model).toHaveProperty('accuracyRate');
        expect(model).toHaveProperty('averageAccuracy');
        expect(model).toHaveProperty('hasData');
      }
    });
  });

  describe('GET /api/models/:modelType/stats', () => {
    const testModels = ['LSTM', 'Random Forest', 'Neural Network', 'Linear Regression'];

    testModels.forEach(modelType => {
      it(`should return stats for ${modelType}`, async () => {
        const response = await request(app)
          .get(`/api/models/${encodeURIComponent(modelType)}/stats`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('modelType', modelType);
        expect(response.body.data).toHaveProperty('accuracyRate');
        expect(response.body.data).toHaveProperty('averageAccuracy');
        expect(response.body.data).toHaveProperty('timestamp');
      });
    });

    it('should handle model types with special characters', async () => {
      const response = await request(app)
        .get('/api/models/Custom%20AI%20Model/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/models/:modelType/predictions', () => {
    it('should return predictions for specific model type', async () => {
      const response = await request(app)
        .get('/api/models/LSTM/predictions')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toHaveProperty('modelType', 'LSTM');
    });

    it('should filter by resolved status', async () => {
      const response = await request(app)
        .get('/api/models/LSTM/predictions?resolved=true')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.meta.filters.resolved).toBe('true');
    });

    it('should filter by cryptocurrency', async () => {
      const response = await request(app)
        .get('/api/models/LSTM/predictions?crypto=BTC')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.meta.filters.crypto).toBe('BTC');
    });
  });

  describe('GET /api/models/:modelType/performance', () => {
    it('should return detailed model performance analysis', async () => {
      const response = await request(app)
        .get('/api/models/LSTM/performance')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('modelType', 'LSTM');
      expect(response.body.data).toHaveProperty('overallStats');
      expect(response.body.data).toHaveProperty('cryptoPerformance');
      expect(response.body.data).toHaveProperty('timeline');
    });

    it('should have proper overall stats structure', async () => {
      const response = await request(app)
        .get('/api/models/LSTM/performance')
        .expect(200);

      const overallStats = response.body.data.overallStats;
      expect(overallStats).toHaveProperty('totalPredictions');
      expect(overallStats).toHaveProperty('resolvedPredictions');
      expect(overallStats).toHaveProperty('accuratePredictions');
      expect(overallStats).toHaveProperty('accuracyRate');
      expect(overallStats).toHaveProperty('averageAccuracy');
    });

    it('should return timeline data in correct format', async () => {
      const response = await request(app)
        .get('/api/models/LSTM/performance')
        .expect(200);

      const timeline = response.body.data.timeline;
      expect(Array.isArray(timeline)).toBe(true);
      
      if (timeline.length > 0) {
        const timelineEntry = timeline[0];
        expect(timelineEntry).toHaveProperty('date');
        expect(timelineEntry).toHaveProperty('accuracy');
        expect(timelineEntry).toHaveProperty('crypto');
        expect(timelineEntry).toHaveProperty('predictionId');
      }
    });
  });

  describe('GET /api/models/comparison', () => {
    it('should compare multiple models', async () => {
      const models = 'LSTM,Random Forest,Neural Network';
      const response = await request(app)
        .get(`/api/models/comparison?models=${models}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toHaveProperty('comparedModels');
      expect(response.body.meta).toHaveProperty('bestModel');
      
      // Should be sorted by accuracy rate (highest first)
      if (response.body.data.length > 1) {
        for (let i = 0; i < response.body.data.length - 1; i++) {
          expect(response.body.data[i].accuracyRate).toBeGreaterThanOrEqual(
            response.body.data[i + 1].accuracyRate
          );
        }
      }
    });

    it('should return 400 when models parameter is missing', async () => {
      const response = await request(app)
        .get('/api/models/comparison')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Models parameter is required (comma-separated list)');
    });

    it('should handle single model comparison', async () => {
      const response = await request(app)
        .get('/api/models/comparison?models=LSTM')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].modelType).toBe('LSTM');
    });

    it('should handle non-existent models gracefully', async () => {
      const response = await request(app)
        .get('/api/models/comparison?models=NonExistentModel1,NonExistentModel2')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      response.body.data.forEach(model => {
        expect(model).toHaveProperty('modelType');
        expect(model).toHaveProperty('accuracyRate');
        expect(model).toHaveProperty('averageAccuracy');
        expect(model).toHaveProperty('totalPredictions');
        expect(model).toHaveProperty('resolvedPredictions');
      });
    });
  });

  describe('Model name handling', () => {
    const testCases = [
      { input: 'LSTM', expected: 'LSTM' },
      { input: 'Random Forest', expected: 'Random Forest' },
      { input: 'Neural%20Network', expected: 'Neural Network' },
      { input: 'Custom-AI-Model', expected: 'Custom-AI-Model' }
    ];

    testCases.forEach(({ input, expected }) => {
      it(`should handle model name: ${input}`, async () => {
        const response = await request(app)
          .get(`/api/models/${input}/stats`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.modelType).toBe(expected);
      });
    });
  });
});