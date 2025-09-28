// Setup for Real Blockchain Integration Tests
// This setup file bypasses all mocking and uses real blockchain services

// CRITICAL: Disable Jest mocking completely for real blockchain tests
jest.unmock('../services/blockchain');
jest.unmock('../routes/predictions');
jest.unmock('../routes/users');
jest.unmock('../routes/admin');

// Clear any existing mocks
jest.clearAllMocks();
jest.resetAllMocks();
jest.restoreAllMocks();

// Environment setup for blockchain tests
require('dotenv').config();
process.env.NODE_ENV = 'test';
process.env.TEST_WITH_BLOCKCHAIN = 'true';

// Check if we should use real blockchain
const useRealBlockchain = process.env.TEST_WITH_BLOCKCHAIN === 'true';

if (useRealBlockchain) {
  console.log('🔧 Setting up Real Blockchain Integration Tests...');

  // Ensure required environment variables are set
  const requiredEnvVars = [
    'RPC_URL',
    'CONTRACT_ADDRESS', 
    'PRIVATE_KEY',
    'DEFAULT_PREDICTOR_ADDRESS',
    'ADMIN_API_KEY',
    'CHAIN_ID'
  ];

  // Validate environment variables
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars);
    console.error('   Make sure your .env file is properly configured');
    process.exit(1);
  }

  // Log blockchain configuration
  console.log('📋 Blockchain Configuration:');
  console.log(`   RPC URL: ${process.env.RPC_URL}`);
  console.log(`   Chain ID: ${process.env.CHAIN_ID}`);
  console.log(`   Contract: ${process.env.CONTRACT_ADDRESS}`);
  console.log(`   Predictor: ${process.env.DEFAULT_PREDICTOR_ADDRESS}`);

  // DO NOT mock blockchain service for integration tests
  // This allows real blockchain calls to go through
  console.log('🌐 Using REAL blockchain service - gas will be consumed!');
} else {
  console.log('🧪 Using mocked blockchain service for safe testing');
}

// Set longer timeouts for blockchain operations
jest.setTimeout(120000); // 2 minutes for blockchain calls

// Global test utilities for blockchain integration
global.blockchainTestUtils = {
  // Helper to wait for transaction confirmation
  waitForTransaction: async (provider, txHash, confirmations = 1) => {
    console.log(`⏳ Waiting for transaction ${txHash}...`);
    const receipt = await provider.waitForTransaction(txHash, confirmations);
    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
    return receipt;
  },

  // Helper to check if address has sufficient balance
  checkBalance: async (provider, address, minBalance = '0.001') => {
    const balance = await provider.getBalance(address);
    const minBalanceWei = ethers.parseEther(minBalance);
    
    console.log(`💰 Balance check: ${ethers.formatEther(balance)} BDAG`);
    
    if (balance < minBalanceWei) {
      throw new Error(`Insufficient balance: ${ethers.formatEther(balance)} BDAG (minimum: ${minBalance} BDAG required)`);
    }
    
    return balance;
  },

  // Helper to generate unique test data
  generateTestData: () => ({
    cryptocurrency: 'BTC',
    currentPrice: 45000 + Math.floor(Math.random() * 10000),
    predictedPrice: 50000 + Math.floor(Math.random() * 10000), 
    targetTimestamp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
    modelType: `TEST_${Date.now()}`,
    additionalData: JSON.stringify({
      testRun: true,
      timestamp: new Date().toISOString(),
      randomId: Math.random().toString(36).substr(2, 9)
    })
  })
};

// Global setup warning
console.log('⚠️  WARNING: These tests will interact with real blockchain!');
console.log('   • Transactions will cost real gas');
console.log('   • Data will be permanently stored on blockchain');
console.log('   • Make sure you have sufficient BDAG balance');
console.log('');