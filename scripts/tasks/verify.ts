// // import { ethers } from "hardhat";
import { task } from "hardhat/config";
import { getVerificationCommand, execShellCommand } from "../verification/utils"

export default task("verification", "Prints an account's balance")
.addParam("contractName", "The name of the contract that should be verified")
.addParam("networkName", "The name of the network on which the contract should be verified")
.setAction(async (taskArgs, hre) => {
  let cmd : string = getVerificationCommand(taskArgs.contractName, taskArgs.networkName)
  await execShellCommand(cmd);
});


