import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "./scripts/tasks/verify"
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "hardhat-contract-sizer";
import { saveDeploymentArgumentsToFile, getVerificationCommand, execShellCommand } from "./scripts/verification/utils"

dotenv.config();

task("verifying", "Prints an account's balance")
.addParam("contract", "The name of the contract that should be verified")
.addParam("networkname", "The name of the network on which the contract should be verified")
.setAction(async (taskArgs, hre) => {
  let cmd : string = getVerificationCommand(taskArgs.contract, taskArgs.networkname)
  await execShellCommand(cmd);
});

task("saveDeploymentArgs", "Saves all the deployment Arguments")
.addParam("networkname", "The name of the network on which the contract should be verified")
.setAction(async (taskArgs, hre) => {
  console.log("Saving the deployment arguments")
  saveDeploymentArgumentsToFile(taskArgs.networkname)
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more
let network: string = "hardhat"
const config: HardhatUserConfig = {
  solidity: "0.8.13",
  defaultNetwork: network,
  networks: {
    localhost: {
      url: process.env.LOCALHOST + ":" + process.env.LOCALPORT,
      accounts: [process.env.ALICE as string, process.env.BOB as string, process.env.CHARLIE as string]
    },
    rinkeby: {
      url: process.env.RINKEBY_RPC_ENDPOINT || "",
      accounts: [process.env.ALICE as string, process.env.BOB as string, process.env.CHARLIE as string]
    },
    polygon: {
      url: process.env.POLYGON_RPC_ENDPOINT,
      accounts: [process.env.ALICE as string, process.env.BOB as string, process.env.CHARLIE as string]
    },
    mumbai: {
      url: process.env.MUMBAI_RPC_ENDPOINT,
      accounts: [process.env.ALICE as string, process.env.BOB as string, process.env.CHARLIE as string]
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: network=="mumbai"? process.env.POLYGONSCAN_API_KEY: process.env.ETHERSCAN_API_KEY,
  },
  
  paths: {
    sources: "./src",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
};

export default config;

