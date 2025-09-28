const express = require('express');
const blockchainService = require('../services/blockchain');

const router = express.Router();

// GET /api/models - Get all model types with their performance
router.get('/', async (req, res, next) => {
  try {
    // This would need to be implemented by tracking models used in predictions
    // For now, we'll return common model types
    const commonModels = ['LSTM', 'Random Forest', 'Linear Regression', 'Neural Network', 'Technical Analysis'];
    
    const modelStats = await Promise.all(
      commonModels.map(async (modelType) => {
        try {
          const [accuracyRate, averageAccuracy] = await Promise.all([
            blockchainService.getModelAccuracyRate(modelType),
            blockchainService.getModelAverageAccuracy(modelType)
          ]);
          
          return {
            modelType,
            accuracyRate: `${parseFloat(accuracyRate) / 100}%`,
            averageAccuracy: `${parseFloat(averageAccuracy) / 100}%`,
            hasData: parseFloat(accuracyRate) > 0
          };
        } catch (error) {
          return {
            modelType,
            accuracyRate: '0%',
            averageAccuracy: '0%',
            hasData: false
          };
        }
      })
    );
    
    res.json({
      success: true,
      data: modelStats.filter(model => model.hasData),
      meta: {
        totalModels: modelStats.length,
        modelsWithData: modelStats.filter(model => model.hasData).length
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/models/:modelType/stats - Get specific model statistics
router.get('/:modelType/stats', async (req, res, next) => {
  try {
    const { modelType } = req.params;
    
    const [accuracyRate, averageAccuracy] = await Promise.all([
      blockchainService.getModelAccuracyRate(modelType),
      blockchainService.getModelAverageAccuracy(modelType)
    ]);
    
    res.json({
      success: true,
      data: {
        modelType,
        accuracyRate: `${parseFloat(accuracyRate) / 100}%`,
        averageAccuracy: `${parseFloat(averageAccuracy) / 100}%`,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/models/:modelType/predictions - Get predictions by model type
router.get('/:modelType/predictions', async (req, res, next) => {
  try {
    const { modelType } = req.params;
    const { resolved, crypto } = req.query;
    
    let predictions = await blockchainService.getModelTypePredictions(modelType);
    
    // Apply filters
    if (resolved !== undefined) {
      const isResolved = resolved === 'true';
      predictions = predictions.filter(p => p.isResolved === isResolved);
    }
    
    if (crypto) {
      predictions = predictions.filter(p => p.cryptocurrency.toLowerCase() === crypto.toLowerCase());
    }
    
    res.json({
      success: true,
      data: predictions,
      meta: {
        modelType,
        total: predictions.length,
        filters: { resolved, crypto }
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/models/:modelType/performance - Get detailed model performance analysis
router.get('/:modelType/performance', async (req, res, next) => {
  try {
    const { modelType } = req.params;
    
    const predictions = await blockchainService.getModelTypePredictions(modelType);
    
    // Analyze performance by cryptocurrency
    const cryptoPerformance = {};
    const timelineData = [];
    let totalPredictions = 0;
    let resolvedPredictions = 0;
    let accuratePredictions = 0;
    let totalAccuracyScore = 0;
    
    predictions.forEach(prediction => {
      totalPredictions++;
      
      if (prediction.isResolved) {
        resolvedPredictions++;
        const accuracy = parseFloat(prediction.accuracyPercentage);
        totalAccuracyScore += accuracy;
        
        if (prediction.wasAccurate) {
          accuratePredictions++;
        }
        
        // Crypto performance
        if (!cryptoPerformance[prediction.cryptocurrency]) {
          cryptoPerformance[prediction.cryptocurrency] = {
            total: 0,
            accurate: 0,
            totalAccuracy: 0
          };
        }
        
        cryptoPerformance[prediction.cryptocurrency].total++;
        if (prediction.wasAccurate) {
          cryptoPerformance[prediction.cryptocurrency].accurate++;
        }
        cryptoPerformance[prediction.cryptocurrency].totalAccuracy += accuracy;
        
        // Timeline data
        timelineData.push({
          date: new Date(parseInt(prediction.predictionTimestamp) * 1000).toISOString(),
          accuracy: accuracy / 100,
          crypto: prediction.cryptocurrency,
          predictionId: prediction.id
        });
      }
    });
    
    // Calculate crypto performance percentages
    Object.keys(cryptoPerformance).forEach(crypto => {
      const perf = cryptoPerformance[crypto];
      perf.accuracyRate = perf.total > 0 ? (perf.accurate / perf.total) * 100 : 0;
      perf.averageAccuracy = perf.total > 0 ? perf.totalAccuracy / perf.total / 100 : 0;
    });
    
    const overallAccuracyRate = resolvedPredictions > 0 ? (accuratePredictions / resolvedPredictions) * 100 : 0;
    const averageAccuracy = resolvedPredictions > 0 ? totalAccuracyScore / resolvedPredictions / 100 : 0;
    
    res.json({
      success: true,
      data: {
        modelType,
        overallStats: {
          totalPredictions,
          resolvedPredictions,
          accuratePredictions,
          accuracyRate: `${overallAccuracyRate}%`,
          averageAccuracy: `${averageAccuracy}%`
        },
        cryptoPerformance,
        timeline: timelineData.sort((a, b) => new Date(a.date) - new Date(b.date)),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/models/comparison - Compare performance of different models
router.get('/comparison', async (req, res, next) => {
  try {
    const { models } = req.query;
    
    if (!models) {
      return res.status(400).json({
        success: false,
        error: 'Models parameter is required (comma-separated list)'
      });
    }
    
    const modelList = models.split(',').map(m => m.trim());
    
    const comparison = await Promise.all(
      modelList.map(async (modelType) => {
        try {
          const [accuracyRate, averageAccuracy] = await Promise.all([
            blockchainService.getModelAccuracyRate(modelType),
            blockchainService.getModelAverageAccuracy(modelType)
          ]);
          
          const predictions = await blockchainService.getModelTypePredictions(modelType);
          
          return {
            modelType,
            accuracyRate: parseFloat(accuracyRate) / 100,
            averageAccuracy: parseFloat(averageAccuracy) / 100,
            totalPredictions: predictions.length,
            resolvedPredictions: predictions.filter(p => p.isResolved).length
          };
        } catch (error) {
          return {
            modelType,
            accuracyRate: 0,
            averageAccuracy: 0,
            totalPredictions: 0,
            resolvedPredictions: 0,
            error: error.message
          };
        }
      })
    );
    
    // Sort by accuracy rate
    comparison.sort((a, b) => b.accuracyRate - a.accuracyRate);
    
    res.json({
      success: true,
      data: comparison,
      meta: {
        comparedModels: modelList,
        bestModel: comparison[0]?.modelType,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;