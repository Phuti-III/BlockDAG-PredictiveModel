# CryptoPredictor API Documentation

## Overview

The CryptoPredictor API provides RESTful endpoints to interact with the PredictionLogger smart contract on the BlockDAG network. It enables cryptocurrency price prediction management, user statistics tracking, model performance analysis, and administrative functions.

## Base URL
```
http://localhost:3001/api
```

## Authentication

### Admin Endpoints
Admin endpoints require an API key passed in the `x-admin-key` header:
```
x-admin-key: your-secure-admin-key-here
```

## Common Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": { ... }  // Optional metadata
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error Type",
  "details": [ ... ]  // Optional error details
}
```

## Endpoints

### Health Check

#### GET /health
Check API health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-28T12:00:00.000Z",
  "service": "CryptoPredictor API",
  "version": "1.0.0",
  "network": "primordial"
}
```

---

## Predictions

### GET /api/predictions
Get predictions with pagination and filtering.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `crypto` (optional): Filter by cryptocurrency symbol
- `modelType` (optional): Filter by model type
- `user` (optional): Filter by user address

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "predictor": "0x1234...",
      "cryptocurrency": "BTC",
      "currentPrice": "50000.0",
      "predictedPrice": "55000.0",
      "predictionTimestamp": "1695900000",
      "targetTimestamp": "1695986400",
      "modelType": "LSTM",
      "isResolved": true,
      "actualPrice": "54000.0",
      "wasAccurate": true,
      "accuracyPercentage": "9818",
      "additionalData": "{\"confidence\": 0.85}"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1
  }
}
```

### GET /api/predictions/:id
Get specific prediction by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "predictor": "0x1234...",
    "cryptocurrency": "BTC",
    "currentPrice": "50000.0",
    "predictedPrice": "55000.0",
    "predictionTimestamp": "1695900000",
    "targetTimestamp": "1695986400",
    "modelType": "LSTM",
    "isResolved": true,
    "actualPrice": "54000.0",
    "wasAccurate": true,
    "accuracyPercentage": "9818",
    "additionalData": "{\"confidence\": 0.85}"
  }
}
```

### POST /api/predictions
Create a new prediction.

**Request Body:**
```json
{
  "cryptocurrency": "BTC",
  "currentPrice": 50000.0,
  "predictedPrice": 55000.0,
  "targetTimestamp": 1695986400,
  "modelType": "LSTM",
  "additionalData": "{\"confidence\": 0.85}"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "predictionId": "1",
    "txHash": "0xabc123...",
    "blockNumber": 12345,
    "gasUsed": "150000"
  },
  "message": "Prediction created successfully"
}
```

### PUT /api/predictions/:id/resolve
Resolve a prediction with actual price.

**Request Body:**
```json
{
  "actualPrice": 54000.0
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "txHash": "0xdef456...",
    "blockNumber": 12346,
    "gasUsed": "100000"
  },
  "message": "Prediction resolved successfully"
}
```

### GET /api/predictions/stats/summary
Get prediction statistics summary.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalPredictions": "150",
    "accuracyThreshold": "5%",
    "timestamp": "2025-09-28T12:00:00.000Z"
  }
}
```

### POST /api/predictions/calculate-accuracy
Calculate accuracy between predicted and actual prices.

**Request Body:**
```json
{
  "predictedPrice": 50000.0,
  "actualPrice": 54000.0
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "predictedPrice": 50000.0,
    "actualPrice": 54000.0,
    "accuracyBasisPoints": "9200",
    "accuracyPercentage": "92%"
  }
}
```

---

## Users

### GET /api/users/:address/stats
Get user statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "address": "0x1234...",
    "totalPredictions": "25",
    "accuratePredictions": "20",
    "totalAccuracyScore": "180000",
    "accuracyRate": "80%",
    "averageAccuracy": "72%",
    "timestamp": "2025-09-28T12:00:00.000Z"
  }
}
```

### GET /api/users/:address/predictions
Get user's predictions with optional filtering.

**Query Parameters:**
- `resolved` (optional): Filter by resolution status (true/false)
- `crypto` (optional): Filter by cryptocurrency
- `modelType` (optional): Filter by model type

### GET /api/users/:address/performance
Get comprehensive user performance analysis.

**Response:**
```json
{
  "success": true,
  "data": {
    "address": "0x1234...",
    "overallStats": {
      "totalPredictions": "25",
      "accuratePredictions": "20",
      "accuracyRate": "80%",
      "averageAccuracy": "72%"
    },
    "cryptoPerformance": {
      "BTC": {
        "total": 10,
        "accurate": 8,
        "accuracyRate": 80,
        "averageAccuracy": 0.75
      }
    },
    "modelPerformance": {
      "LSTM": {
        "total": 15,
        "accurate": 12,
        "accuracyRate": 80,
        "averageAccuracy": 0.78
      }
    },
    "timeline": [
      {
        "date": "2025-09-28T12:00:00.000Z",
        "accuracy": 0.85,
        "crypto": "BTC",
        "model": "LSTM"
      }
    ]
  }
}
```

---

## Models

### GET /api/models
Get all model types with performance data.

### GET /api/models/:modelType/stats
Get statistics for specific model type.

### GET /api/models/:modelType/predictions
Get predictions by model type.

### GET /api/models/:modelType/performance
Get detailed model performance analysis.

### GET /api/models/comparison?models=LSTM,Random Forest
Compare performance of different models.

---

## Cryptocurrencies

### GET /api/crypto
Get all cryptocurrencies with prediction data.

### GET /api/crypto/:symbol/predictions
Get predictions for specific cryptocurrency.

### GET /api/crypto/:symbol/stats
Get statistics for specific cryptocurrency.

### GET /api/crypto/:symbol/analysis?timeframe=7d
Get detailed analysis for cryptocurrency.

**Query Parameters:**
- `timeframe` (optional): Analysis timeframe (1d, 7d, 30d, 90d)

### GET /api/crypto/trending?limit=10
Get trending cryptocurrencies based on prediction activity.

---

## Admin Endpoints

### GET /api/admin/contract-info
Get contract information and settings.

**Headers:** `x-admin-key: your-admin-key`

### PUT /api/admin/accuracy-threshold
Set accuracy threshold for the contract.

**Request Body:**
```json
{
  "threshold": 500
}
```

### POST /api/admin/pause
Pause the contract.

### POST /api/admin/unpause
Unpause the contract.

### POST /api/admin/oracle/grant
Grant oracle role to an address.

**Request Body:**
```json
{
  "address": "0x1234..."
}
```

### POST /api/admin/oracle/revoke
Revoke oracle role from an address.

### GET /api/admin/stats
Get comprehensive system statistics.

### POST /api/admin/bulk-resolve
Bulk resolve multiple predictions.

**Request Body:**
```json
{
  "predictions": [
    {
      "predictionId": 1,
      "actualPrice": 54000.0
    },
    {
      "predictionId": 2,
      "actualPrice": 3200.0
    }
  ]
}
```

---

## Error Codes

- `400` - Bad Request (validation errors)
- `403` - Forbidden (admin access required)
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limits

- 100 requests per 15 minutes per IP address
- Admin endpoints may have separate limits

## WebSocket Support

Coming soon - real-time prediction updates and price feeds.

## Examples

### Creating a Prediction with curl

```bash
curl -X POST http://localhost:3001/api/predictions \
  -H "Content-Type: application/json" \
  -d '{
    "cryptocurrency": "BTC",
    "currentPrice": 50000.0,
    "predictedPrice": 55000.0,
    "targetTimestamp": 1695986400,
    "modelType": "LSTM",
    "additionalData": "{\"confidence\": 0.85}"
  }'
```

### Resolving a Prediction

```bash
curl -X PUT http://localhost:3001/api/predictions/1/resolve \
  -H "Content-Type: application/json" \
  -d '{
    "actualPrice": 54000.0
  }'
```

### Admin: Setting Accuracy Threshold

```bash
curl -X PUT http://localhost:3001/api/admin/accuracy-threshold \
  -H "Content-Type: application/json" \
  -H "x-admin-key: your-admin-key" \
  -d '{
    "threshold": 300
  }'
```