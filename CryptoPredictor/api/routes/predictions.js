const express = require('express');
const Joi = require('joi');
const blockchainService = require('../services/blockchain');

const router = express.Router();

// Validation schemas
const makePredictionSchema = Joi.object({
  cryptocurrency: Joi.string().required().max(10),
  currentPrice: Joi.number().positive().required(),
  predictedPrice: Joi.number().positive().required(),
  targetTimestamp: Joi.number().integer().positive().required(),
  modelType: Joi.string().required().max(50),
  additionalData: Joi.string().optional().default('{}'),
  userAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).optional(),
  predictorAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).optional()
});

const resolvePredictionSchema = Joi.object({
  predictionId: Joi.number().integer().positive().required(),
  actualPrice: Joi.number().positive().required()
});

// GET /api/predictions - Get all predictions with pagination
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, crypto, modelType, user } = req.query;
    
    let predictions = [];
    
    if (crypto) {
      predictions = await blockchainService.getCryptoPredictions(crypto);
    } else if (modelType) {
      predictions = await blockchainService.getModelTypePredictions(modelType);
    } else if (user) {
      predictions = await blockchainService.getUserPredictions(user);
    } else {
      // Get total count and fetch recent predictions
      const totalCount = await blockchainService.getPredictionCounter();
      const startId = Math.max(1, parseInt(totalCount) - (page * limit) + 1);
      const endId = Math.max(1, parseInt(totalCount) - ((page - 1) * limit));
      
      predictions = [];
      for (let i = endId; i >= startId; i--) {
        try {
          const prediction = await blockchainService.getPrediction(i);
          predictions.push(prediction);
        } catch (error) {
          // Skip if prediction doesn't exist
          continue;
        }
      }
    }
    
    res.json({
      success: true,
      data: predictions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: predictions.length
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/predictions/:id - Get specific prediction
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid prediction ID'
      });
    }
    
    const prediction = await blockchainService.getPrediction(id);
    
    if (!prediction) {
      return res.status(404).json({
        success: false,
        error: 'Prediction not found'
      });
    }
    
    res.json({
      success: true,
      data: prediction
    });
  } catch (error) {
    // Handle specific error for non-existent predictions
    if (error.message && error.message.includes('does not exist')) {
      return res.status(404).json({
        success: false,
        error: 'Prediction not found'
      });
    }
    next(error);
  }
});

// POST /api/predictions - Create new prediction
router.post('/', async (req, res, next) => {
  try {
    const { error, value } = makePredictionSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: error.details
      });
    }
    
    // Validate target timestamp is in the future
    const now = Math.floor(Date.now() / 1000);
    if (value.targetTimestamp <= now) {
      return res.status(400).json({
        success: false,
        error: 'Target timestamp must be in the future'
      });
    }
    
    const result = await blockchainService.makePrediction(
      req.body.userAddress || req.body.predictorAddress || process.env.DEFAULT_PREDICTOR_ADDRESS,
      value
    );
    
    // Handle both real blockchain service format and mock format
    let responseData;
    if (result.predictionId) {
      // Real blockchain service format
      responseData = {
        prediction: { 
          id: parseInt(result.predictionId),
          cryptocurrency: value.cryptocurrency,
          currentPrice: value.currentPrice,
          predictedPrice: value.predictedPrice,
          targetTimestamp: value.targetTimestamp,
          modelType: value.modelType,
          user: req.body.userAddress || req.body.predictorAddress || process.env.DEFAULT_PREDICTOR_ADDRESS
        },
        txHash: result.txHash,
        blockNumber: result.blockNumber,
        gasUsed: result.gasUsed
      };
    } else {
      // Mock format
      responseData = {
        prediction: result.prediction,
        txHash: result.receipt?.hash,
        blockNumber: result.receipt?.blockNumber,
        gasUsed: result.receipt?.gasUsed?.toString()
      };
    }
    
    res.status(201).json({
      success: true,
      data: responseData,
      message: 'Prediction created successfully'
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/predictions/:id/resolve - Resolve prediction
router.put('/:id/resolve', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { actualPrice } = req.body;
    
    const { error } = resolvePredictionSchema.validate({
      predictionId: parseInt(id),
      actualPrice
    });
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: error.details
      });
    }
    
    const result = await blockchainService.resolvePrediction(id, actualPrice);
    
    res.json({
      success: true,
      data: {
        correct: result.correct,
        accuracyBasisPoints: result.accuracyBasisPoints,
        txHash: result.receipt?.hash,
        blockNumber: result.receipt?.blockNumber,
        gasUsed: result.receipt?.gasUsed?.toString()
      },
      message: 'Prediction resolved successfully'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/predictions/:id/resolve - Resolve prediction (alternative to PUT)
router.post('/:id/resolve', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { actualPrice } = req.body;
    
    const { error } = resolvePredictionSchema.validate({
      predictionId: parseInt(id),
      actualPrice
    });
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: error.details
      });
    }
    
    const result = await blockchainService.resolvePrediction(id, actualPrice);
    
    res.json({
      success: true,
      data: {
        correct: result.correct,
        accuracyBasisPoints: result.accuracyBasisPoints,
        txHash: result.receipt?.hash,
        blockNumber: result.receipt?.blockNumber,
        gasUsed: result.receipt?.gasUsed?.toString()
      },
      message: 'Prediction resolved successfully'
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/predictions/stats/summary - Get prediction statistics
router.get('/stats/summary', async (req, res, next) => {
  try {
    const totalPredictions = await blockchainService.getPredictionCounter();
    const accuracyThreshold = await blockchainService.getAccuracyThreshold();
    
    res.json({
      success: true,
      data: {
        totalPredictions,
        accuracyThreshold: `${parseInt(accuracyThreshold) / 100}%`,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/predictions/calculate-accuracy - Calculate accuracy between two prices
router.post('/calculate-accuracy', async (req, res, next) => {
  try {
    const { predictedPrice, actualPrice } = req.body;
    
    if (!predictedPrice || !actualPrice || predictedPrice <= 0 || actualPrice <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid predicted price and actual price are required'
      });
    }
    
    const accuracy = await blockchainService.calculateAccuracy(predictedPrice, actualPrice);
    const accuracyPercentage = parseFloat(accuracy) / 100;
    
    res.json({
      success: true,
      data: {
        predictedPrice,
        actualPrice,
        accuracyBasisPoints: accuracy,
        accuracyPercentage: `${accuracyPercentage}%`
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;