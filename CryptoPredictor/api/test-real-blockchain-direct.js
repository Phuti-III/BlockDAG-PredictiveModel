// Simple Real Blockchain Test
const { ethers } = require('ethers');
require('dotenv').config();

async function testRealBlockchain() {
  console.log('🧪 Testing Real Blockchain Service...\n');

  try {
    // Initialize blockchain service directly
    delete require.cache[require.resolve('./services/blockchain')];
    const BlockchainService = require('./services/blockchain');
    
    // Wait a moment for initialization
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('📋 Testing makePrediction method...');
    
    const predictionData = {
      cryptocurrency: 'BTC',
      currentPrice: 50000,
      predictedPrice: 55000,
      targetTimestamp: Math.floor(Date.now() / 1000) + 86400,
      modelType: 'DIRECT_TEST',
      additionalData: JSON.stringify({ directTest: true })
    };

    const result = await BlockchainService.makePrediction(
      process.env.DEFAULT_PREDICTOR_ADDRESS,
      predictionData
    );

    console.log('✅ Blockchain service response:');
    console.log('   Type:', typeof result);
    console.log('   Keys:', Object.keys(result));
    console.log('   Receipt:', result.receipt ? 'Present' : 'Missing');
    console.log('   Prediction:', result.prediction ? 'Present' : 'Missing');
    
    if (result.receipt && result.receipt.hash) {
      console.log('   TX Hash:', result.receipt.hash);
      console.log('   Block:', result.receipt.blockNumber);
      
      if (result.receipt.hash.length === 66 && result.receipt.hash.startsWith('0x')) {
        console.log('🎉 REAL blockchain transaction detected!');
      } else {
        console.log('🧪 Mock response detected');
      }
    }

    if (result.prediction && result.prediction.id) {
      console.log('   Prediction ID:', result.prediction.id);
      
      // Try to retrieve the prediction
      console.log('\n📋 Testing getPrediction method...');
      const retrieved = await BlockchainService.getPrediction(result.prediction.id);
      console.log('✅ Retrieved prediction:', retrieved.cryptocurrency, retrieved.modelType);
    }

    console.log('\n🎯 Direct blockchain service test completed successfully!');
    
  } catch (error) {
    console.error('❌ Direct blockchain service test failed:');
    console.error(error.message);
    console.error(error.stack);
  }
}

testRealBlockchain();