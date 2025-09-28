const { ethers } = require('ethers');
require('dotenv').config();

async function checkBlockchainReadiness() {
  console.log('🔍 Checking Blockchain Integration Test Readiness...\n');

  try {
    // Check environment variables
    const requiredVars = [
      'RPC_URL', 'CONTRACT_ADDRESS', 'PRIVATE_KEY', 
      'DEFAULT_PREDICTOR_ADDRESS', 'ADMIN_API_KEY', 'CHAIN_ID'
    ];

    console.log('📋 Environment Variables:');
    const missingVars = [];
    
    requiredVars.forEach(varName => {
      if (process.env[varName]) {
        console.log(`   ✅ ${varName}: ${varName.includes('KEY') ? '[HIDDEN]' : process.env[varName]}`);
      } else {
        console.log(`   ❌ ${varName}: MISSING`);
        missingVars.push(varName);
      }
    });

    if (missingVars.length > 0) {
      console.log(`\n❌ Missing environment variables: ${missingVars.join(', ')}`);
      process.exit(1);
    }

    // Initialize provider
    console.log('\n🌐 Network Connectivity:');
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    
    // Test network connection
    const network = await provider.getNetwork();
    console.log(`   ✅ Connected to Chain ID: ${network.chainId}`);
    console.log(`   ✅ Expected Chain ID: ${process.env.CHAIN_ID}`);
    
    if (network.chainId.toString() !== process.env.CHAIN_ID) {
      console.log(`   ❌ Chain ID mismatch! Connected: ${network.chainId}, Expected: ${process.env.CHAIN_ID}`);
      process.exit(1);
    }

    // Check latest block
    const blockNumber = await provider.getBlockNumber();
    console.log(`   ✅ Latest Block: ${blockNumber}`);

    // Check gas price
    const feeData = await provider.getFeeData();
    console.log(`   ✅ Gas Price: ${ethers.formatUnits(feeData.gasPrice, 'gwei')} gwei`);

    // Check contract deployment
    console.log('\n📝 Contract Validation:');
    const contractCode = await provider.getCode(process.env.CONTRACT_ADDRESS);
    
    if (contractCode === '0x') {
      console.log(`   ❌ Contract not deployed at ${process.env.CONTRACT_ADDRESS}`);
      process.exit(1);
    }
    
    console.log(`   ✅ Contract deployed: ${contractCode.length} bytes`);
    
    const contractBalance = await provider.getBalance(process.env.CONTRACT_ADDRESS);
    console.log(`   ✅ Contract Balance: ${ethers.formatEther(contractBalance)} BDAG`);

    // Check predictor address balance
    console.log('\n💰 Predictor Address Balance:');
    const predictorBalance = await provider.getBalance(process.env.DEFAULT_PREDICTOR_ADDRESS);
    const balanceEther = ethers.formatEther(predictorBalance);
    
    console.log(`   Address: ${process.env.DEFAULT_PREDICTOR_ADDRESS}`);
    console.log(`   Balance: ${balanceEther} BDAG`);

    // Estimate gas costs for typical operations
    const estimatedGasForPrediction = 150000n; // Rough estimate
    const estimatedCost = feeData.gasPrice * estimatedGasForPrediction;
    const estimatedCostEther = ethers.formatEther(estimatedCost);

    console.log(`   Estimated gas per prediction: ~${estimatedCostEther} BDAG`);

    // Check if balance is sufficient
    const minimumBalance = ethers.parseEther('0.01'); // 0.01 BDAG minimum
    const recommendedBalance = ethers.parseEther('0.1'); // 0.1 BDAG recommended

    if (predictorBalance < minimumBalance) {
      console.log(`   ❌ Insufficient balance! Need at least 0.01 BDAG for testing`);
      console.log(`   💡 Add BDAG to ${process.env.DEFAULT_PREDICTOR_ADDRESS}`);
      process.exit(1);
    } else if (predictorBalance < recommendedBalance) {
      console.log(`   ⚠️  Low balance! Recommended: 0.1 BDAG for comprehensive testing`);
    } else {
      console.log(`   ✅ Sufficient balance for testing`);
    }

    // Test wallet connection
    console.log('\n🔐 Wallet Connection:');
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const walletAddress = await wallet.getAddress();
    
    if (walletAddress.toLowerCase() !== process.env.DEFAULT_PREDICTOR_ADDRESS.toLowerCase()) {
      console.log(`   ❌ Private key mismatch!`);
      console.log(`   Wallet Address: ${walletAddress}`);
      console.log(`   Expected: ${process.env.DEFAULT_PREDICTOR_ADDRESS}`);
      process.exit(1);
    }
    
    console.log(`   ✅ Private key matches predictor address`);

    // Summary
    console.log('\n🎉 Blockchain Integration Test Readiness: PASSED');
    console.log('\n📊 Test Cost Estimates:');
    console.log(`   • Single prediction: ~${estimatedCostEther} BDAG`);
    console.log(`   • Full test suite: ~${ethers.formatEther(estimatedCost * 5n)} BDAG`);
    console.log(`   • Available balance: ${balanceEther} BDAG`);
    
    console.log('\n🚀 Ready to run blockchain integration tests!');
    console.log('   Command: npm run test:blockchain-integration');

  } catch (error) {
    console.log('\n❌ Blockchain readiness check failed:');
    console.error(error.message);
    process.exit(1);
  }
}

// Run the check
checkBlockchainReadiness();