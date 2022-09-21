import * as dotenv from "dotenv";
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
import { deployOnlyRegistrarAndResolver } from "./registrarAndResolver";
import { deployOnlyTournament } from "./tournament";
import http from 'http';
dotenv.config()
import fs from 'fs'

import {
  PlaygroundVotingBadge,
  VotingPlayground,
  PlainMajorityVoteWithQuorum,
  SimpleSnapshotWithoutToken,
  MajorityVoteWithNFTQuorumAndOptionalDVGuard,
  Counter,
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
let LEO: SignerWithAddress

async function deployPlayground(minQuorum: number, gasPrice: BigNumber, verbosity: number) {
    
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
    
    let registryDeploymentInfo = await deployOnlyRegistry(ALICE, gasPrice, verbosity)
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


async function deployRegistryRegistrarAndPlayground(minQuorum: number, gasPrice: BigNumber, verbosity: number) {
  // deploy registry first
  if (verbosity>0) console.log("--> Start Deployment")
  let contractName : string;

  [ALICE] = await ethers.getSigners()

  let rawdata = fs.readFileSync(deploymentInfoPath);
  
  let deploymentVariables : NetworkToContractDeploymentInfo =
    (rawdata.length==0) ? {} : JSON.parse(rawdata.toString())

  let registryDeploymentInfo = await deployOnlyRegistry(ALICE, gasPrice, verbosity)
  deploymentVariables[network.name] = Object.assign(
      deploymentVariables[network.name], registryDeploymentInfo)


  contractName = "Counter"
  let CounterFactory = await ethers.getContractFactory("Counter")
  let counter: Counter = await CounterFactory.connect(ALICE).deploy()
  await counter.deployed()
  deploymentVariables[network.name]["Counter"] = {
    "address": counter.address,
    "path": basePath + "examples/dummies/Counter.sol",
    "arguments": []}
  
  if (verbosity>0) console.log(`--> Deployed ${contractName}`)
  if (verbosity>1) console.log(`\t address: ${counter.address}\n\t network: ${network.name}`)
 

  contractName = "MajorityVoteWithNFTQuorumAndOptionalDVGuard"
  let MajorityWithtokenFactory = await ethers.getContractFactory("MajorityVoteWithNFTQuorumAndOptionalDVGuard")
  let majorityWithNftToken: MajorityVoteWithNFTQuorumAndOptionalDVGuard = await MajorityWithtokenFactory.connect(ALICE).deploy()
  await majorityWithNftToken.deployed()
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
 
  console.log('deployment variables:', deploymentVariables[network.name])
  let registrarDeploymentInfo = await deployOnlyRegistrarAndResolver(
    ALICE,
    deploymentVariables[network.name]["VotingRegistry"].address,
    majorityWithNftToken.address,
    verbosity)
  deploymentVariables[network.name] = Object.assign(
    deploymentVariables[network.name], registrarDeploymentInfo)

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

async function deployTournament(gasPrice: BigNumber, verbosity: number){
  if (verbosity>0) console.log("--> Start Deployment");

  [ALICE] = await ethers.getSigners()

  let rawdata = fs.readFileSync(deploymentInfoPath);
  let deploymentVariables : NetworkToContractDeploymentInfo =
    (rawdata.length==0) ? {} : JSON.parse(rawdata.toString())

  // console.log(deploymentVariables)
  let registryDeploymentInfo = await deployOnlyRegistry(ALICE, gasPrice, verbosity)
  deploymentVariables[network.name] = Object.assign(
      deploymentVariables[network.name], registryDeploymentInfo)

  saveToFile(deploymentVariables, deploymentInfoPath)
  if (verbosity>0) console.log(`--> Saved deployment information to the file ${deploymentInfoPath}deploymentInfo.json`)
  
  saveDeploymentArgumentsToFile(network.name)
  if (verbosity>0) console.log(`--> Saved deployment arguments for verification to js-files.`)

}

async function deployRegistry(verbosity: number, gasPrice: BigNumber) {

  const [LEO] = await ethers.getSigners()

  // retrieving existing deployment info from a file (scripts/verification/deploymentInfo.json)
  let rawdata = fs.readFileSync(deploymentInfoPath);

  // saving all the deployment info into an Object
  let deploymentVariables : NetworkToContractDeploymentInfo =
    (rawdata.length==0) ? {} : JSON.parse(rawdata.toString())

  let registryDeploymentInfo = await deployOnlyRegistry(LEO, gasPrice, verbosity)
  // adding the new deployment info into that object
  if (network.name in deploymentVariables){
    deploymentVariables[network.name] = Object.assign(
      deploymentVariables[network.name], registryDeploymentInfo)  
  } else {
    deploymentVariables[network.name] = registryDeploymentInfo
  }
  
  saveToFile(deploymentVariables, deploymentInfoPath)
  if (verbosity>0) console.log(`--> Saved deployment information to the file ${deploymentInfoPath}deploymentInfo.json`)
    
  saveDeploymentArgumentsToFile(network.name)
  if (verbosity>0) console.log(`--> Saved deployment arguments for verification to js-files.`)


}

// maximum verbosity is 2
var verbosity: number = 2
// set gasPrice to "0" if you want it to be determined automatically.
// set it to a positive value if you want to fix the gas price!
var gasPrice: BigNumber = ethers.utils.parseUnits("4", "gwei")

deployRegistry(verbosity, gasPrice)
      .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });


// async function getLatestGasPrice() {
//   let bl = await ethers.provider.getBlock("latest")
//   console.log(bl)
//   const http = new XMLHttpRequest()
//   let apiKey: string
//   if (network.name=="polygon" || network.name=="mumbai"){
//     apiKey = process.env.POLYGONSCAN_API_KEY as string
//   } else {
//     apiKey = process.env.ETHERSCAN_API_KEY as string
//   }
//   const re = http.open("GET", `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${apiKey}`)
// }
// getLatestGasPrice()


// let verbosity = 2
// let minquorum = 1
// deployPlayground(minquorum, verbosity)
//       .catch((error) => {
//       console.error(error);
//       process.exitCode = 1;
//     });

// let verbosity = 2
// let minquorum = 1
// deployRegistryRegistrarAndPlayground(minquorum, verbosity)
//       .catch((error) => {
//       console.error(error);
//       process.exitCode = 1;
//     });

