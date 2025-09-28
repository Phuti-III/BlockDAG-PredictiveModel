import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();
// Validate environment variables
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;

if (!DEPLOYER_PRIVATE_KEY) {
  console.warn("  DEPLOYER_PRIVATE_KEY not found in .env file");
  console.warn("   Create a .env file with your private key to deploy to networks");
}

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
        details: {
          yul: true,
          yulDetails: {
            stackAllocation: true,
            optimizerSteps: 'dhfoDgvulfnTUtnIf'
          }
        }
      },
      viaIR: true
    }
  },
  networks: {
    primordial: {
      url: "https://rpc.primordial.bdagscan.com",
      accounts: [process.env.DEPLOYER_PRIVATE_KEY || ""],
      chainId: 1043,
      gasPrice: 50000000000, // 50 gwei
      timeout: 200000,
      httpHeaders: {
        "User-Agent": "Hardhat/BlockDAG-Client"
      }
    },
    hardhat: {
      chainId: 31337,
      gas: 12000000,
      blockGasLimit: 12000000,
      allowUnlimitedContractSize: true
    },
    localhost: {
      url: "http://localhost:8545",
      timeout: 60000
    }
  },
  etherscan: {
    apiKey: {
      primordial: "no-api-key-needed"
    },
    customChains: [
      {
        network: "primordial",
        chainId: 1043,
        urls: {
          apiURL: "https://primordial.bdagscan.com/api",
          browserURL: "https://primordial.bdagscan.com"
        }
      }
    ]
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 60000
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD"
  }
} as const;

export default config;
