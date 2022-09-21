import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "./scripts/tasks/verify"
// import "hardhat-gas-reporter"
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "hardhat-contract-sizer";
import { saveDeploymentArgumentsToFile, getVerificationCommand, execShellCommand } from "./scripts/verification/utils"
import { getGanacheCommand } from "./scripts/ganache/getGanache"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {deployOnlyRegistry} from './scripts/deployment/registry'
// import { deployPlayground } from "./scripts/deployment/playground"
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

// task("deployRegistry", "Deploys just the registry")
// .addParam("gaspriceingwei", "The amount of gwei paid for the gas")
// .addParam("verbosity", "Level of verbosity")
// .setAction(async (taskArgs, hre) => {

//   var verbosity: number = taskArgs.verbosity
//   const gasPrice = hre.ethers.utils.parseUnits(
//     taskArgs.gaspriceingwei,
//     "gwei"
//   )
//   const [LEO] = await hre.ethers.getSigners()
//   await deployOnlyRegistry(LEO, gasPrice, verbosity)
//   console.log("Saving the deployment arguments")
//   saveDeploymentArgumentsToFile(taskArgs.networkname)
// });

task("getGanache", "print the statement that would start ganache with the correct settings")
  .setAction(async () => {
    console.log(getGanacheCommand())
  })

// task("deployPlayground", "Deploy the playground")
//   .addParam("minquorum", "The initial MinQuorum")
//   .addParam("verbosity", "The verbosity")
//   .setAction(async (taskArgs, hre) => {
//     deployPlayground(hre, taskArgs.minquorum, taskArgs.verbosity)
//       .catch((error) => {
//       console.error(error);
//       process.exitCode = 1;
//     });
// })

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more
let network: string = "mainnet"
const config: HardhatUserConfig = {
  solidity: "0.8.13",
  defaultNetwork: network,
  networks: {
    localhost: {
      url: process.env.LOCALHOST + ":" + process.env.LOCALPORT,
      accounts: [process.env.ALICE as string, process.env.BOB as string, process.env.CHARLIE as string]
    },
    mainnet: {
      url: process.env.RINKEBY_RPC_ENDPOINT || "",
      accounts: [process.env.LEO as string]
    },
    rinkeby: {
      url: process.env.RINKEBY_RPC_ENDPOINT || "",
      accounts: [process.env.ALICE as string, process.env.BOB as string, process.env.CHARLIE as string]
    },
    polygon: {
      url: process.env.POLYGON_RPC_ENDPOINT,
      accounts: [process.env.LEO as string]
    },
    mumbai: {
      url: process.env.MUMBAI_RPC_ENDPOINT,
      accounts: [process.env.ALICE as string, process.env.BOB as string, process.env.CHARLIE as string]
    },
    goerli: {
      url: process.env.GOERLI_RPC_ENDPOINT,
      accounts: [process.env.ALICE as string, process.env.BOB as string, process.env.CHARLIE as string]
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_ENDPOINT,
      accounts: [process.env.ALICE as string, process.env.BOB as string, process.env.CHARLIE as string]
    }
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: (network=="mumbai" || network=="polygon")? process.env.POLYGONSCAN_API_KEY: process.env.ETHERSCAN_API_KEY,
  },
  
  paths: {
    sources: "./src",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
};

export default config;

