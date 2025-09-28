const request = require('supertest');
const express = require('express');
const cryptoRoutes = require('../routes/crypto');

describe('Crypto API', () => {
  let app;
  
  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/crypto', cryptoRoutes);
  });

  describe('GET /api/crypto', () => {
    it('should return all cryptocurrencies with prediction data', async () => {
      const response = await request(app)
        .get('/api/crypto')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toHaveProperty('totalCryptocurrencies');
      expect(response.body.meta).toHaveProperty('cryptosWithData');
    });

    it('should return cryptos with proper structure', async () => {
      const response = await request(app)
        .get('/api/crypto')
        .expect(200);

      if (response.body.data.length > 0) {
        const crypto = response.body.data[0];
        expect(crypto).toHaveProperty('symbol');
        expect(crypto).toHaveProperty('totalPredictions');
        expect(crypto).toHaveProperty('resolvedPredictions');
        expect(crypto).toHaveProperty('accuratePredictions');
        expect(crypto).toHaveProperty('accuracyRate');
        expect(crypto).toHaveProperty('hasData');
      }
    });
  });

  describe('GET /api/crypto/:symbol/predictions', () => {
    const testSymbols = ['BTC', 'ETH', 'BLOCKDAG'];

    testSymbols.forEach(symbol => {
      it(`should return predictions for ${symbol}`, async () => {
        const response = await request(app)
          .get(`/api/crypto/${symbol}/predictions`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.meta).toHaveProperty('cryptocurrency', symbol);
      });
    });

    it('should handle lowercase symbols', async () => {
      const response = await request(app)
        .get('/api/crypto/btc/predictions')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.meta.cryptocurrency).toBe('BTC');
    });

    it('should filter by resolved status', async () => {
      const response = await request(app)
        .get('/api/crypto/BTC/predictions?resolved=true')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.meta.filters.resolved).toBe('true');
    });

    it('should filter by model type', async () => {
      const response = await request(app)
        .get('/api/crypto/BTC/predictions?modelType=LSTM')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.meta.filters.modelType).toBe('LSTM');
    });

    it('should filter by user address', async () => {
      const testAddress = '0x1234567890123456789012345678901234567890';
      const response = await request(app)
        .get(`/api/crypto/BTC/predictions?user=${testAddress}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.meta.filters.user).toBe(testAddress);
    });
  });

  describe('GET /api/crypto/:symbol/stats', () => {
    it('should return statistics for specific cryptocurrency', async () => {
      const response = await request(app)
        .get('/api/crypto/BTC/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('cryptocurrency', 'BTC');
      expect(response.body.data).toHaveProperty('overallStats');
      expect(response.body.data).toHaveProperty('modelPerformance');
    });

    it('should have proper overall stats structure', async () => {
      const response = await request(app)
        .get('/api/crypto/BTC/stats')
        .expect(200);

      const overallStats = response.body.data.overallStats;
      expect(overallStats).toHaveProperty('totalPredictions');
      expect(overallStats).toHaveProperty('resolvedPredictions');
      expect(overallStats).toHaveProperty('accuratePredictions');
      expect(overallStats).toHaveProperty('accuracyRate');
      expect(overallStats).toHaveProperty('averageAccuracy');
    });

    it('should include model performance data', async () => {
      const response = await request(app)
        .get('/api/crypto/BTC/stats')
        .expect(200);

      expect(response.body.data.modelPerformance).toBeDefined();
      expect(typeof response.body.data.modelPerformance).toBe('object');
    });
  });

  describe('GET /api/crypto/:symbol/analysis', () => {
    it('should return detailed analysis with default timeframe', async () => {
      const response = await request(app)
        .get('/api/crypto/BTC/analysis')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('cryptocurrency', 'BTC');
      expect(response.body.data).toHaveProperty('timeframe', '7d');
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('sentiment');
      expect(response.body.data).toHaveProperty('priceData');
      expect(response.body.data).toHaveProperty('topPredictions');
    });

    it('should handle different timeframes', async () => {
      const timeframes = ['1d', '7d', '30d', '90d'];

      for (const timeframe of timeframes) {
        const response = await request(app)
          .get(`/api/crypto/BTC/analysis?timeframe=${timeframe}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.timeframe).toBe(timeframe);
      }
    });

    it('should include sentiment analysis', async () => {
      const response = await request(app)
        .get('/api/crypto/BTC/analysis')
        .expect(200);

      const sentiment = response.body.data.sentiment;
      expect(sentiment).toHaveProperty('bullish');
      expect(sentiment).toHaveProperty('bearish');
      expect(sentiment).toHaveProperty('neutral');
      expect(sentiment).toHaveProperty('sentiment');
      expect(['bullish', 'bearish', 'neutral']).toContain(sentiment.sentiment);
    });

    it('should include price data array', async () => {
      const response = await request(app)
        .get('/api/crypto/BTC/analysis')
        .expect(200);

      expect(Array.isArray(response.body.data.priceData)).toBe(true);
    });

    it('should include top predictions', async () => {
      const response = await request(app)
        .get('/api/crypto/BTC/analysis')
        .expect(200);

      const topPredictions = response.body.data.topPredictions;
      expect(topPredictions).toHaveProperty('mostAccurate');
      expect(topPredictions).toHaveProperty('leastAccurate');
      expect(Array.isArray(topPredictions.mostAccurate)).toBe(true);
      expect(Array.isArray(topPredictions.leastAccurate)).toBe(true);
    });
  });

  describe('GET /api/crypto/trending', () => {
    it('should return trending cryptocurrencies with default limit', async () => {
      const response = await request(app)
        .get('/api/crypto/trending')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toHaveProperty('timeframe', '24h');
      expect(response.body.meta).toHaveProperty('totalCryptosAnalyzed');
    });

    it('should respect limit parameter', async () => {
      const limit = 5;
      const response = await request(app)
        .get(`/api/crypto/trending?limit=${limit}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(limit);
    });

    it('should return trending cryptos with proper structure', async () => {
      const response = await request(app)
        .get('/api/crypto/trending')
        .expect(200);

      if (response.body.data.length > 0) {
        const trendingCrypto = response.body.data[0];
        expect(trendingCrypto).toHaveProperty('symbol');
        expect(trendingCrypto).toHaveProperty('totalPredictions');
        expect(trendingCrypto).toHaveProperty('recentPredictions');
        expect(trendingCrypto).toHaveProperty('trendScore');
      }
    });

    it('should sort by trend score (highest first)', async () => {
      const response = await request(app)
        .get('/api/crypto/trending')
        .expect(200);

      if (response.body.data.length > 1) {
        for (let i = 0; i < response.body.data.length - 1; i++) {
          expect(response.body.data[i].trendScore).toBeGreaterThanOrEqual(
            response.body.data[i + 1].trendScore
          );
        }
      }
    });
  });

  describe('Symbol validation and normalization', () => {
    it('should handle mixed case symbols', async () => {
      const mixedCaseSymbols = ['btc', 'Eth', 'bLoCkDaG'];

      for (const symbol of mixedCaseSymbols) {
        const response = await request(app)
          .get(`/api/crypto/${symbol}/stats`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.cryptocurrency).toBe(symbol.toUpperCase());
      }
    });

    it('should handle special cryptocurrency symbols', async () => {
      const specialSymbols = ['USDT', 'BNB', 'USDC', 'XRP'];

      for (const symbol of specialSymbols) {
        const response = await request(app)
          .get(`/api/crypto/${symbol}/predictions`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.meta.cryptocurrency).toBe(symbol);
      }
    });
  });

  describe('Error handling', () => {
    it('should handle blockchain service errors gracefully', async () => {
      // This test assumes the blockchain service might throw errors
      // In a real test, you might mock the service to throw errors
      const response = await request(app)
        .get('/api/crypto/INVALID_SYMBOL/predictions')
        .expect(200); // Should still return 200 with empty data

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});