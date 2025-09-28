const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());
  
  // Deploy PredictionLogger contract
  const PredictionLogger = await ethers.getContractFactory("PredictionLogger");
  console.log("Deploying PredictionLogger...");
  
  const predictionLogger = await PredictionLogger.deploy();
  await predictionLogger.waitForDeployment();
  
  const contractAddress = await predictionLogger.getAddress();
  console.log("PredictionLogger deployed to:", contractAddress);
  
  // Save deployment info to JSON file
  const deploymentInfo = {
    network: network.name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    PredictionLogger: {
      address: contractAddress,
      deployer: deployer.address,
      deploymentTime: new Date().toISOString(),
      blockNumber: await ethers.provider.getBlockNumber(),
      transactionHash: predictionLogger.deploymentTransaction()?.hash
    }
  };
  
  // Ensure deployments directory exists
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  // Save to file
  const deploymentPath = path.join(deploymentsDir, `${network.name}.json`);
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("\n=== DEPLOYMENT COMPLETE ===");
  console.log("Contract Address:", contractAddress);
  console.log("Network:", network.name);
  console.log("Deployment saved to:", deploymentPath);
  console.log("\nUpdate your .env file with:");
  console.log(`CONTRACT_ADDRESS=${contractAddress}`);
  
  // Verify contract if on a testnet/mainnet
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    await predictionLogger.deploymentTransaction().wait(2);
    
    try {
      console.log("Verifying contract...");
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
    } catch (error) {
      console.log("Verification failed:", error.message);
    }
  }
  
  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });