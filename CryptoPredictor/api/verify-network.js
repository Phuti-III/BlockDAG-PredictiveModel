// Verify Network Connection and Transaction
const { ethers } = require('ethers');
require('dotenv').config();

async function verifyNetwork() {
  console.log('🔍 Verifying Network Connection...\n');
  
  try {
    // Initialize provider
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    
    // Get network info
    const network = await provider.getNetwork();
    const latestBlock = await provider.getBlockNumber();
    
    console.log('📋 Network Information:');
    console.log(`   Chain ID: ${network.chainId}`);
    console.log(`   Chain Name: ${network.name}`);
    console.log(`   RPC URL: ${process.env.RPC_URL}`);
    console.log(`   Latest Block: ${latestBlock}`);
    
    // Check our contract
    const contractAddress = process.env.CONTRACT_ADDRESS;
    const contractCode = await provider.getCode(contractAddress);
    
    console.log('\n📝 Contract Information:');
    console.log(`   Contract Address: ${contractAddress}`);
    console.log(`   Contract Code Length: ${contractCode.length} bytes`);
    console.log(`   Contract Deployed: ${contractCode !== '0x' ? 'YES' : 'NO'}`);
    
    // Check wallet balance
    const walletAddress = process.env.DEFAULT_PREDICTOR_ADDRESS;
    const balance = await provider.getBalance(walletAddress);
    
    console.log('\n💰 Wallet Information:');
    console.log(`   Wallet Address: ${walletAddress}`);
    console.log(`   Balance: ${ethers.formatEther(balance)} BDAG`);
    
    // Check recent transaction
    const txHash = '0x22966d5a567a57c927eaa9846c4d25781a2ef2ce3db03fb258778bd5506a011f';
    console.log('\n🔗 Checking Recent Transaction:');
    console.log(`   TX Hash: ${txHash}`);
    
    try {
      const txReceipt = await provider.getTransactionReceipt(txHash);
      if (txReceipt) {
        console.log(`   ✅ Transaction Found!`);
        console.log(`   Block Number: ${txReceipt.blockNumber}`);
        console.log(`   Block Hash: ${txReceipt.blockHash}`);
        console.log(`   Gas Used: ${txReceipt.gasUsed.toString()}`);
        console.log(`   Status: ${txReceipt.status ? 'SUCCESS' : 'FAILED'}`);
        console.log(`   Contract Address: ${txReceipt.to}`);
        
        // Get block details
        const block = await provider.getBlock(txReceipt.blockNumber);
        console.log(`   Block Timestamp: ${new Date(block.timestamp * 1000).toISOString()}`);
        console.log(`   Block Miner: ${block.miner || 'N/A'}`);
        
        // Explorer URLs
        console.log('\n🌐 Explorer URLs:');
        console.log(`   Primordial Explorer: https://primordial.bdagscan.com/tx/${txHash}?chain=EVM`);
        console.log(`   Alternative URL: https://primordial.bdagscan.com/tx/${txHash}`);
        
      } else {
        console.log(`   ❌ Transaction not found in blockchain`);
        console.log('   This could mean:');
        console.log('   - Transaction is still pending');
        console.log('   - Wrong network/chain');
        console.log('   - Transaction failed');
      }
    } catch (txError) {
      console.log(`   ❌ Error getting transaction: ${txError.message}`);
    }
    
    // Network validation
    console.log('\n✅ Network Validation:');
    if (network.chainId.toString() === '1043') {
      console.log('   ✅ Connected to BlockDAG Primordial (Chain ID: 1043)');
    } else {
      console.log(`   ⚠️  Connected to different network (Chain ID: ${network.chainId})`);
    }
    
    if (contractCode !== '0x') {
      console.log('   ✅ Smart contract is deployed and accessible');
    } else {
      console.log('   ❌ Smart contract not found at specified address');
    }
    
  } catch (error) {
    console.error('❌ Network verification failed:');
    console.error('Error:', error.message);
  }
}

verifyNetwork();