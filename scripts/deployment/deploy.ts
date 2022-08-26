import { ContractReceipt, BigNumber, Signer } from "ethers";
import { ethers, network } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { IVOTINGCONTRACT_ID, IERC165_ID } from "../utils/interfaceIds";
import { getEventArgs } from "../utils/getEventArgs";
import { durations, types } from "../utils/playgroundVotingContracts";
import { saveToFile } from "../utils/saveToFile";
import { deploymentInfoPath } from "../utils/paths";
import { saveDeploymentArgumentsToFile} from "../verification/utils"


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

let ALICE: SignerWithAddress
let BOB: SignerWithAddress
let CHARLIE: SignerWithAddress

async function main(minQuorum: number, verbosity: number) {
    
    if (verbosity>0) console.log("--> Start Deployment")
    let contractName : string;
    let basePath : string = "src/"

    const abi = ethers.utils.defaultAbiCoder;
  
    [ALICE, BOB, CHARLIE] = await ethers.getSigners()

    interface Deployment {
        address: string,
        path: string,
        arguments: Array<string>
    }

    let rawdata = fs.readFileSync(deploymentInfoPath);
    
    let deploymentVariables : { [key: string]: { [key: string]: Deployment  }  } =
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
    
    contractName = "VotingRegistry"
    let RegistryFactory = await ethers.getContractFactory("VotingRegistry")
    let registry: VotingRegistry = await RegistryFactory.connect(ALICE).deploy(IVOTINGCONTRACT_ID)
    await registry.deployed() 
    deploymentVariables[network.name]["VotingRegistry"] = {
      "address": registry.address,
      "path": basePath + "registration/registry/VotingRegistry.sol",
      "arguments": [`"${IVOTINGCONTRACT_ID}"`]} 
    
    if (verbosity>0) console.log(`--> Deployed ${contractName}`)
    if (verbosity>1) console.log(`\t address: ${registry.address}\n\t network: ${network.name}`)
    
    contractName = "DummyNFT"
    let ERC721Factory = await ethers.getContractFactory("DummyNFT")
    let nft: DummyNFT = await ERC721Factory.connect(ALICE).deploy()
    await nft.deployed() 
    deploymentVariables[network.name]["DummyNFT"] = {
      "address": nft.address,
      "path": basePath + "examples/dummies/ERC721Token.sol",
      "arguments": [`"${IVOTINGCONTRACT_ID}"`]} 
    
    if (verbosity>0) console.log(`--> Deployed ${contractName}`)
    if (verbosity>1) console.log(`\t address: ${nft.address}\n\t network: ${network.name}`)
    

    // prelude to voting playground deployment
    let BadgeFactory = await ethers.getContractFactory("PlaygroundVotingBadge")
    const playgroundMockup = await ethers.getContractAt("VotingPlayground", ethers.constants.AddressZero);
    let playgroundInterface = playgroundMockup.interface;
    
    let flagAndSelectors : Array<string> = []
    let votingContracts : Array<string> = []
    let minDurations : Array<number> = []
    let minQuorums : Array<number> = []
    let badgeWeightedVote : Array<boolean> = []

    let functions = Object.keys(types)
    for (let i=0; i<functions.length; i++){
        let fct : string = functions[i].toString();
        flagAndSelectors.push(
            (types[fct].security=="secure" ? "0x01": "0x00") + playgroundInterface.getSighash(fct).slice(2,)
        )
        votingContracts.push(
            types[fct].badgeWeightedVote ? majorityWithNftToken.address : majorityWithoutToken.address
        )
        badgeWeightedVote.push(types[fct].badgeWeightedVote as boolean)
        if (types[fct].duration)
        minDurations.push(types[fct].duration as number)
        minQuorums.push(minQuorum)
    }

    let deployArgumentArray = ["Playground Voting Badge", "PLAY"]
    let deployArguments = abi.encode(["string", "string"], deployArgumentArray)
    let rawByteCode = BadgeFactory.bytecode + deployArguments.slice(2,);
    // let salt = abi.encode(["uint256"], [666])
    let hashedBytecode = ethers.utils.keccak256(rawByteCode)
    contractName = "VotingPlayground"
    let PlaygroundFactory = await ethers.getContractFactory("VotingPlayground")
    let playground: VotingPlayground = await PlaygroundFactory.connect(ALICE).deploy(
        registry.address,
        flagAndSelectors,
        votingContracts,
        minDurations,
        minQuorums,
        badgeWeightedVote,
        hashedBytecode
    )
    await playground.deployed()
    
    deploymentVariables[network.name]["VotingPlayground"] = {
      "address": playground.address,
      "path": basePath + "examples/playground/Playground.sol",
      "arguments": [
        `"${registry.address}"`,
        `[${flagAndSelectors.map((v)=>{return `"${v}"`})}]`,
        `[${votingContracts.map((v)=>{return `"${v}"`})}]`,
        `[${minDurations}]`,
        `[${minQuorums}]`,
        `[${badgeWeightedVote}]`,
        `"${hashedBytecode}"`
      ]} 
    
    if (verbosity>0) console.log(`--> Deployed ${contractName}`)
    if (verbosity>1) console.log(`\t address: ${playground.address}\n\t network: ${network.name}`)
    
    contractName = "PlaygroundVotingBadge"
    let badge = await ethers.getContractAt("PlaygroundVotingBadge", await playground.badges(0));
    deploymentVariables[network.name]["PlaygroundVotingBadge"] = {
      "address": badge.address,
      "path": basePath + "examples/playground/Playground.sol",
      "arguments": [`"${deployArgumentArray[0]}"`, `"${deployArgumentArray[1]}"`]} 
    
    if (verbosity>0) console.log(`--> Deployed ${contractName}`)
    if (verbosity>1) console.log(`\t address: ${badge.address}\n\t network: ${network.name}`)
    
    saveToFile(deploymentVariables, deploymentInfoPath)
    saveDeploymentArgumentsToFile(network.name)

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.

let minQuorum: number = 2;
main(minQuorum, 2).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
