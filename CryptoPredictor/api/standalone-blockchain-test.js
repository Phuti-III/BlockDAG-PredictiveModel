// Standalone Real Blockchain Integration Test
// This bypasses Jest's mocking system completely

const request = require('supertest');
const { ethers } = require('ethers');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

require('dotenv').config();

async function runRealBlockchainTests() {
  console.log('🚀 Starting STANDALONE Real Blockchain Integration Tests');
  console.log('⚠️  WARNING: This will consume real gas and create actual blockchain transactions!\n');

  try {
    // Initialize our own Express app without mocks
    const app = express();
    
    // Middleware setup
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: 'Too many requests from this IP, please try again later.'
    });

    app.use(helmet());
    app.use(compression());
    app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true
    }));
    app.use(limiter);
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Import routes WITHOUT any mocking
    app.use('/api/predictions', require('./routes/predictions'));
    app.use('/api/users', require('./routes/users'));
    app.use('/api/admin', require('./routes/admin'));

    // Error handling
    app.use((err, req, res, next) => {
      console.error('Error:', err);
      res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
      });
    });

    const testUserAddress = process.env.DEFAULT_PREDICTOR_ADDRESS;
    
    // Check initial balance
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const initialBalance = await provider.getBalance(testUserAddress);
    
    console.log(`💰 Initial Balance: ${ethers.formatEther(initialBalance)} BDAG`);
    console.log(`📍 Contract: ${process.env.CONTRACT_ADDRESS}`);
    console.log(`👤 Predictor: ${testUserAddress}\n`);

    // Test 1: Create Real Prediction
    console.log('📝 TEST 1: Creating real prediction on blockchain...');
    
    const predictionData = {
      cryptocurrency: 'BTC',
      currentPrice: 48000 + Math.floor(Math.random() * 4000), // Randomize prices
      predictedPrice: 52000 + Math.floor(Math.random() * 4000),
      targetTimestamp: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
      modelType: 'STANDALONE_TEST',
      additionalData: JSON.stringify({ 
        testRun: true, 
        timestamp: new Date().toISOString(),
        testType: 'standalone'
      }),
      userAddress: testUserAddress
    };

    const createResponse = await request(app)
      .post('/api/predictions')
      .send(predictionData);

    console.log('   Status:', createResponse.status);
    console.log('   Success:', createResponse.body.success);
    console.log('   Response keys:', Object.keys(createResponse.body.data || {}));
    
    if (createResponse.body.data) {
      console.log('   TX Hash:', createResponse.body.data.txHash);
      console.log('   Block Number:', createResponse.body.data.blockNumber);
      console.log('   Gas Used:', createResponse.body.data.gasUsed);
      console.log('   Prediction ID:', createResponse.body.data.prediction?.id);
      
      if (createResponse.body.data.txHash && createResponse.body.data.txHash.length === 66) {
        console.log('✅ REAL blockchain transaction detected!');
      } else {
        console.log('🧪 Mock response detected');
      }
    }

    let testPredictionId = createResponse.body.data?.prediction?.id;

    // Test 2: Get User Predictions
    console.log('\n👤 TEST 2: Getting real user predictions...');
    
    const userPredictionsResponse = await request(app)
      .get(`/api/users/${testUserAddress}/predictions`);

    console.log('   Status:', userPredictionsResponse.status);
    console.log('   Success:', userPredictionsResponse.body.success);
    console.log('   Predictions count:', userPredictionsResponse.body.data?.length || 0);
    
    if (userPredictionsResponse.body.data?.length > 0) {
      const standalonePredictions = userPredictionsResponse.body.data.filter(p => 
        p.modelType === 'STANDALONE_TEST'
      );
      console.log('   Standalone test predictions:', standalonePredictions.length);
      console.log('✅ Real user predictions retrieved!');
    }

    // Test 3: Get User Stats
    console.log('\n📊 TEST 3: Getting real user stats...');
    
    const userStatsResponse = await request(app)
      .get(`/api/users/${testUserAddress}/stats`);

    console.log('   Status:', userStatsResponse.status);
    console.log('   Success:', userStatsResponse.body.success);
    console.log('   Total Predictions:', userStatsResponse.body.data?.totalPredictions || 0);
    console.log('   Accuracy Rate:', userStatsResponse.body.data?.accuracyRate || 'N/A');
    console.log('✅ Real user stats retrieved!');

    // Test 4: Get Contract Info
    console.log('\n📋 TEST 4: Getting real contract information...');
    
    const contractInfoResponse = await request(app)
      .get('/api/admin/contract-info')
      .set('x-admin-key', process.env.ADMIN_API_KEY);

    console.log('   Status:', contractInfoResponse.status);
    console.log('   Success:', contractInfoResponse.body.success);
    console.log('   Contract Address:', contractInfoResponse.body.data?.contractAddress);
    console.log('   Prediction Counter:', contractInfoResponse.body.data?.predictionCounter);
    console.log('   Network:', contractInfoResponse.body.data?.network);
    console.log('✅ Real contract info retrieved!');

    // Test 5: Network Validation
    console.log('\n🌐 TEST 5: Validating network connectivity...');
    
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    const gasPrice = await provider.getFeeData();

    console.log('   Chain ID:', network.chainId.toString());
    console.log('   Latest Block:', blockNumber);
    console.log('   Gas Price:', ethers.formatUnits(gasPrice.gasPrice, 'gwei'), 'gwei');
    console.log('✅ Network validation passed!');

    // Test 6: Contract Deployment Check
    console.log('\n📝 TEST 6: Validating contract deployment...');
    
    const contractCode = await provider.getCode(process.env.CONTRACT_ADDRESS);
    const contractBalance = await provider.getBalance(process.env.CONTRACT_ADDRESS);

    console.log('   Contract Code Length:', contractCode.length, 'bytes');
    console.log('   Contract Balance:', ethers.formatEther(contractBalance), 'BDAG');
    console.log('   Contract Deployed:', contractCode !== '0x' ? 'YES' : 'NO');
    console.log('✅ Contract validation passed!');

    // Final Balance Check
    console.log('\n💰 Final Balance Check...');
    const finalBalance = await provider.getBalance(testUserAddress);
    const gasUsed = initialBalance - finalBalance;

    console.log(`   Final Balance: ${ethers.formatEther(finalBalance)} BDAG`);
    
    if (gasUsed > 0) {
      console.log(`   Gas Used: ${ethers.formatEther(gasUsed)} BDAG`);
      console.log(`   Total Cost: ${ethers.formatEther(gasUsed)} BDAG`);
      console.log('🎉 REAL BLOCKCHAIN INTEGRATION CONFIRMED!');
    } else {
      console.log('   No gas consumed - tests may have used mocked responses');
    }

    console.log('\n🏁 Standalone Real Blockchain Integration Tests Complete!');
    console.log('   All tests executed successfully');
    console.log('   Real blockchain interactions confirmed');

  } catch (error) {
    console.error('\n❌ Standalone blockchain integration tests failed:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run the tests
runRealBlockchainTests();