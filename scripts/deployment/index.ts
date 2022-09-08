import { ContractReceipt, BigNumber, Signer } from "ethers";
import { ethers, network } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { IVOTINGCONTRACT_ID, IERC165_ID } from "../utils/interfaceIds";
import { getEventArgs } from "../utils/getEventArgs";
import { durations, types } from "../utils/playgroundVotingContracts";
import { saveToFile } from "../utils/saveToFile";
import { deploymentInfoPath, basePath } from "../utils/paths";
import { saveDeploymentArgumentsToFile} from "../verification/utils"
import { Deployment, NetworkToContractDeploymentInfo } from "../interfaces/deployment"
import { deployOnlyRegistry } from "./registry";
import { deployOnlyPlaygroundAndBadge } from "./playground";

import fs from 'fs'

import {
  PlaygroundVotingBadge,
  VotingPlayground,
  PlainMajorityVoteWithQuorum,
  SimpleSnapshotWithoutToken,
  MajorityVoteWithNFTQuorumAndOptionalDVGuard,
  DummyNFT,
  DummyToken,
  VotingRegistry,
  ExpectReturnValue,
  PlaygroundVotingBadge__factory,
  DummyToken__factory
} from "../../typechain"

import { VotingPlaygroundInterface } from "../../typechain/VotingPlayground";
import { HardhatRuntimeEnvironment } from "hardhat/types";

let ALICE: SignerWithAddress
let BOB: SignerWithAddress
let CHARLIE: SignerWithAddress

async function deployPlayground(minQuorum: number, verbosity: number) {
    
    if (verbosity>0) console.log("--> Start Deployment")
    let contractName : string;

    const abi = ethers.utils.defaultAbiCoder;
  
    [ALICE] = await ethers.getSigners()

    let rawdata = fs.readFileSync(deploymentInfoPath);
    
    let deploymentVariables : NetworkToContractDeploymentInfo =
      (rawdata.length==0) ? {} : JSON.parse(rawdata.toString())


    // deploy the playground
    contractName = "MajorityVoteWithNFTQuorumAndOptionalDVGuard"
    let MajorityWithtokenFactory = await ethers.getContractFactory("MajorityVoteWithNFTQuorumAndOptionalDVGuard")
    let majorityWithNftToken: MajorityVoteWithNFTQuorumAndOptionalDVGuard = await MajorityWithtokenFactory.connect(ALICE).deploy()
    await majorityWithNftToken.deployed()
    deploymentVariables[network.name] = {};
    deploymentVariables[network.name]["MajorityVoteWithNFTQuorumAndOptionalDVGuard"] = {
      "address": majorityWithNftToken.address,
      "path": basePath + "implementations/votingContracts/SimpleMajorityVote/MajorityVoteWithNFTQuorumAndOptionalDVGuard.sol",
      "arguments": []}

    if (verbosity>0) console.log(`--> Deployed ${contractName}`)
    if (verbosity>1) console.log(`\t address: ${majorityWithNftToken.address}\n\t network: ${network.name}`)
    
    
    contractName = "PlainMajorityVoteWithQuorum"
    let MajorityWithoutTokenFactory = await ethers.getContractFactory("PlainMajorityVoteWithQuorum")
    let majorityWithoutToken: PlainMajorityVoteWithQuorum = await MajorityWithoutTokenFactory.connect(ALICE).deploy()
    await majorityWithoutToken.deployed()
    deploymentVariables[network.name]["PlainMajorityVoteWithQuorum"] = {
      "address": majorityWithoutToken.address,
      "path": basePath + "implementations/votingContracts/SimpleMajorityVote/PlainMajorityVoteWithQuorum.sol",
      "arguments": []}
    
    if (verbosity>0) console.log(`--> Deployed ${contractName}`)
    if (verbosity>1) console.log(`\t address: ${majorityWithoutToken.address}\n\t network: ${network.name}`)
  
    contractName = "SimpleSnapshotWithoutToken"
    let SnapshotFactory = await ethers.getContractFactory("SimpleSnapshotWithoutToken")
    let snapshot: SimpleSnapshotWithoutToken = await SnapshotFactory.connect(ALICE).deploy()
    await snapshot.deployed() 
    deploymentVariables[network.name]["SimpleSnapshotWithoutToken"] = {
      "address": snapshot.address,
      "path": basePath + "implementations/votingContracts/OnlyStartAndVote/SimpleSnapshotWithoutToken.sol",
      "arguments": []}  
    
    if (verbosity>0) console.log(`--> Deployed ${contractName}`)
    if (verbosity>1) console.log(`\t address: ${snapshot.address}\n\t network: ${network.name}`)
    
    let registryDeploymentInfo = await deployOnlyRegistry(ALICE, verbosity)
    deploymentVariables[network.name] = Object.assign(
      deploymentVariables[network.name], registryDeploymentInfo)
    
    let playgroundDeploymentInfo = await deployOnlyPlaygroundAndBadge(
      ALICE, 
      minQuorum, 
      deploymentVariables[network.name]["VotingRegistry"].address,
      majorityWithNftToken.address,
      majorityWithoutToken.address,
      verbosity)
    deploymentVariables[network.name] = Object.assign(
      deploymentVariables[network.name], playgroundDeploymentInfo)
    
    saveToFile(deploymentVariables, deploymentInfoPath)
    if (verbosity>0) console.log(`--> Saved deployment information to the file ${deploymentInfoPath}deploymentInfo.json`)
    
    saveDeploymentArgumentsToFile(network.name)
    if (verbosity>0) console.log(`--> Saved deployment arguments for verification to js-files.`)

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors
let verbosity = 2
let minquorum = 2
deployPlayground(minquorum, verbosity)
      .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });

export { 
  deployPlayground
}
