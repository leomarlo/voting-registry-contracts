import { ethers, network } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { durations, types } from "../utils/playgroundVotingContracts";
import { deploymentInfoPath, basePath } from "../utils/paths";
import { ContractDeploymentInfo } from "../interfaces/deployment"

import fs from 'fs'

import {
  VotingPlayground
} from "../../typechain"


async function deployOnlyPlaygroundAndBadge(
  signer: SignerWithAddress,
  minQuorum: number, 
  registryAddress: string, 
  nftWeightedVotingAddress: string, 
  otherVotingAddress: string, 
  verbosity: number): Promise<ContractDeploymentInfo> {
    
    let contractName : string;

    const abi = ethers.utils.defaultAbiCoder;
    
    let info : ContractDeploymentInfo = {}
    

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
            types[fct].badgeWeightedVote ? nftWeightedVotingAddress : otherVotingAddress
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
    let playground: VotingPlayground = await PlaygroundFactory.connect(signer).deploy(
        registryAddress,
        flagAndSelectors,
        votingContracts,
        minDurations,
        minQuorums,
        badgeWeightedVote,
        hashedBytecode
    )
    await playground.deployed()
    
    info = Object.assign(info, { "VotingPlayground": 
      {
        "address": playground.address,
        "path": basePath + "examples/playground/Playground.sol",
        "arguments": [
          `"${registryAddress}"`,
          `[${flagAndSelectors.map((v)=>{return `"${v}"`})}]`,
          `[${votingContracts.map((v)=>{return `"${v}"`})}]`,
          `[${minDurations}]`,
          `[${minQuorums}]`,
          `[${badgeWeightedVote}]`,
          `"${hashedBytecode}"`
        ]} 
    });
    
    if (verbosity>0) console.log(`--> Deployed ${contractName}`)
    if (verbosity>1) console.log(`\t address: ${playground.address}\n\t network: ${network.name}`)
    if (verbosity>1) console.log(`\t deployNewBadgeSelector: ${playgroundInterface.getSighash("deployNewBadge")}}`)
    
    let tx = await playground.connect(signer).deployNewBadge(ethers.constants.HashZero, rawByteCode, signer.address)
    await tx.wait()

    contractName = "PlaygroundVotingBadge"
    let badge = await ethers.getContractAt("PlaygroundVotingBadge", await playground.badges(0));
    
    info = Object.assign(info, { "PlaygroundVotingBadge": 
      {
        "address": badge.address,
        "path": basePath + "examples/playground/VotingBadge.sol",
        "arguments": [`"${deployArgumentArray[0]}"`, `"${deployArgumentArray[1]}"`]
      }}) 
    
    if (verbosity>0) console.log(`--> Deployed ${contractName}`)
    if (verbosity>1) console.log(`\t address: ${badge.address}\n\t network: ${network.name}`)

    return info
}



export { 
  deployOnlyPlaygroundAndBadge
}
