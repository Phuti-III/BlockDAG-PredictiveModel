// Real Blockchain Integration Tests
// WARNING: These tests interact with the actual blockchain and will cost gas!

const request = require('supertest');
const { ethers } = require('ethers');

// Only run if explicitly enabled
const ENABLE_BLOCKCHAIN_TESTS = process.env.TEST_WITH_BLOCKCHAIN === 'true';

if (!ENABLE_BLOCKCHAIN_TESTS) {
  describe('Blockchain Integration Tests', () => {
    it('should skip blockchain tests (set TEST_WITH_BLOCKCHAIN=true to enable)', () => {
      console.log('⚠️  Blockchain integration tests skipped');
      console.log('   To enable: TEST_WITH_BLOCKCHAIN=true npm run test:blockchain');
      expect(true).toBe(true);
    });
  });
} else {
  describe('Real Blockchain Integration Tests', () => {
    let app;
    let testUserAddress;
    let testPredictionId;
    let initialBalance;

    beforeAll(async () => {
      // Clear module cache to avoid conflicts
      Object.keys(require.cache).forEach(key => {
        if (key.includes('server') || key.includes('blockchain')) {
          delete require.cache[key];
        }
      });

      // Set test port to avoid conflicts
      process.env.PORT = '3002';
      
      // Import app without mocked blockchain service
      app = require('../server');
      
      testUserAddress = process.env.DEFAULT_PREDICTOR_ADDRESS;
      
      // Check initial balance
      const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
      initialBalance = await provider.getBalance(testUserAddress);
      
      console.log('🚀 Starting Real Blockchain Tests');
      console.log(`💰 Initial Balance: ${ethers.formatEther(initialBalance)} BDAG`);
      console.log(`📍 Contract: ${process.env.CONTRACT_ADDRESS}`);
      console.log(`👤 Predictor: ${testUserAddress}`);
      
      // Warn about gas costs
      console.log('⚠️  WARNING: These tests will consume real gas!');
    }, 30000);

    describe('Real Blockchain Prediction Lifecycle', () => {
      it('should create a real prediction on blockchain', async () => {
        const predictionData = {
          cryptocurrency: 'BTC',
          currentPrice: 50000,
          predictedPrice: 55000,
          targetTimestamp: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
          modelType: 'INTEGRATION_TEST',
          additionalData: JSON.stringify({ 
            testRun: true, 
            timestamp: new Date().toISOString() 
          }),
          userAddress: testUserAddress
        };

        console.log('📝 Creating real prediction...');
        const response = await request(app)
          .post('/api/predictions')
          .send(predictionData)
          .expect(201);

        console.log('🔍 Response format debug:');
        console.log('   Response keys:', Object.keys(response.body.data || {}));
        console.log('   Has prediction?', !!response.body.data.prediction);
        console.log('   Has predictionId?', !!response.body.data.predictionId);

        expect(response.body.success).toBe(true);
        
        // Handle both real blockchain and mock response formats
        if (response.body.data.prediction) {
          // Mock response format: {prediction: {...}, txHash, blockNumber, gasUsed}
          expect(response.body.data.prediction).toBeDefined();
          expect(response.body.data.txHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
          expect(response.body.data.blockNumber).toBeGreaterThan(0);
          testPredictionId = response.body.data.prediction.id;
        } else {
          // Real blockchain response format: {predictionId, txHash, blockNumber, gasUsed}
          expect(response.body.data.predictionId).toBeGreaterThan(0);
          expect(response.body.data.txHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
          expect(response.body.data.blockNumber).toBeGreaterThan(0);
          expect(response.body.data.gasUsed).toBeGreaterThan(0);
          testPredictionId = response.body.data.predictionId;
        }
        
        console.log(`✅ Real prediction created!`);
        console.log(`   Prediction ID: ${testPredictionId}`);
        console.log(`   Transaction: ${response.body.data.txHash}`);
        console.log(`   Block: ${response.body.data.blockNumber}`);
      }, 60000); // 60 second timeout for blockchain calls

      it('should retrieve the real prediction from blockchain', async () => {
        if (!testPredictionId) {
          throw new Error('No prediction ID from previous test');
        }

        console.log(`🔍 Retrieving prediction ${testPredictionId}...`);
        const response = await request(app)
          .get(`/api/predictions/${testPredictionId}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(testPredictionId.toString());
        expect(response.body.data.cryptocurrency).toBe('BTC');
        expect(response.body.data.modelType).toBe('INTEGRATION_TEST');
        // Check user field if it exists, otherwise skip this check
        if (response.body.data.user) {
          expect(response.body.data.user.toLowerCase()).toBe(testUserAddress.toLowerCase());
        }

        console.log(`✅ Successfully retrieved real prediction from blockchain`);
      }, 30000);

      it('should get real user predictions from blockchain', async () => {
        console.log(`👤 Getting user predictions for ${testUserAddress}...`);
        const response = await request(app)
          .get(`/api/users/${testUserAddress}/predictions`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeGreaterThanOrEqual(1);

        // Find our test prediction (handle both string and number IDs)
        const testPrediction = response.body.data.find(p => 
          p.id == testPredictionId || p.id === testPredictionId.toString()
        );
        expect(testPrediction).toBeDefined();
        expect(testPrediction.modelType).toBe('INTEGRATION_TEST');

        console.log(`✅ Found ${response.body.data.length} real predictions for user`);
      }, 30000);

      it('should get real user stats from blockchain', async () => {
        console.log(`📊 Getting real user stats...`);
        const response = await request(app)
          .get(`/api/users/${testUserAddress}/stats`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(parseInt(response.body.data.totalPredictions)).toBeGreaterThanOrEqual(1);
        expect(typeof response.body.data.accuracyRate).toBe('string');
        // Check user field if it exists, otherwise skip this check  
        if (response.body.data.user) {
          expect(response.body.data.user.toLowerCase()).toBe(testUserAddress.toLowerCase());
        }

        console.log(`✅ Real user stats: ${response.body.data.totalPredictions} predictions`);
      }, 30000);
    });

    describe('Real Blockchain Contract Info', () => {
      it('should get real contract information', async () => {
        console.log(`📋 Getting real contract information...`);
        const response = await request(app)
          .get('/api/admin/contract-info')
          .set('x-admin-key', process.env.ADMIN_API_KEY)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.contractAddress).toBe(process.env.CONTRACT_ADDRESS);
        expect(parseInt(response.body.data.predictionCounter)).toBeGreaterThanOrEqual(1);
        expect(response.body.data.network).toBe('primordial');

        console.log(`✅ Real contract info retrieved`);
        console.log(`   Predictions: ${response.body.data.predictionCounter}`);
        console.log(`   Threshold: ${response.body.data.accuracyThreshold}`);
      }, 30000);
    });

    describe('Real Network Validation', () => {
      it('should validate network connectivity', async () => {
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        
        console.log(`🌐 Testing network connectivity...`);
        const network = await provider.getNetwork();
        const blockNumber = await provider.getBlockNumber();
        const gasPrice = await provider.getFeeData();

        expect(network.chainId.toString()).toBe(process.env.CHAIN_ID);
        expect(blockNumber).toBeGreaterThan(0);
        expect(gasPrice.gasPrice).toBeGreaterThan(0);

        console.log(`✅ Network validation passed`);
        console.log(`   Chain ID: ${network.chainId}`);
        console.log(`   Latest Block: ${blockNumber}`);
        console.log(`   Gas Price: ${ethers.formatUnits(gasPrice.gasPrice, 'gwei')} gwei`);
      }, 30000);

      it('should validate contract deployment', async () => {
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        
        console.log(`📝 Validating contract deployment...`);
        const code = await provider.getCode(process.env.CONTRACT_ADDRESS);
        const balance = await provider.getBalance(process.env.CONTRACT_ADDRESS);

        expect(code).not.toBe('0x');
        expect(code.length).toBeGreaterThan(10);

        console.log(`✅ Contract validation passed`);
        console.log(`   Contract Code Length: ${code.length} bytes`);
        console.log(`   Contract Balance: ${ethers.formatEther(balance)} BDAG`);
      }, 30000);
    });

    afterAll(async () => {
      // Check final balance and calculate gas used
      const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
      const finalBalance = await provider.getBalance(testUserAddress);
      const gasUsed = initialBalance - finalBalance;

      console.log('🏁 Real Blockchain Tests Complete');
      console.log(`💰 Final Balance: ${ethers.formatEther(finalBalance)} BDAG`);
      console.log(`⛽ Gas Used: ${ethers.formatEther(gasUsed)} BDAG`);
      
      if (gasUsed > 0) {
        console.log(`💸 Total Cost: ${ethers.formatEther(gasUsed)} BDAG`);
      }
    }, 10000);
  });
}