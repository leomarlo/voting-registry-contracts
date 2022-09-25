import hre, { ethers, network } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { IVOTINGCONTRACT_ID, IERC165_ID } from "../utils/interfaceIds";
import { ContractDeploymentInfo } from "../interfaces/deployment"
import { alreadyDeployed } from "../deployment/auxilliary/checkDeployment"
import { AlreadyDeployed } from "../interfaces/deployment"

import {  basePath } from "../utils/paths";

import {
    ControllableRegistrar,
    VotingRegistry, 
    MajorityVoteWithNFTQuorumAndOptionalDVGuard,
    ResolverWithControl,
    PlainMajorityVoteWithQuorum
} from "../../typechain"
import { keccak256 } from "ethers/lib/utils";

const abi = ethers.utils.defaultAbiCoder


async function registerAndChange(verbosity: number) {

  let _alreadyDeployed : AlreadyDeployed = alreadyDeployed(
    hre.network.name, 
    [
      "VotingRegistry",
      "ControllableRegistrar",
      "ResolverWithControl",
      "MajorityVoteWithNFTQuorumAndOptionalDVGuard"
    ]) 
  if (!_alreadyDeployed["flag"]){
    console.log(_alreadyDeployed["contracts"])
    throw(`Some contracts still need to be deployed.`)
  }

  const [signer] = await ethers.getSigners()
  let contractName: string
  

  // connect to majority nft voting contract
  contractName = "MajorityVoteWithNFTQuorumAndOptionalDVGuard"
  let majorityNFT = await ethers.getContractAt(
    "MajorityVoteWithNFTQuorumAndOptionalDVGuard",
    _alreadyDeployed["contracts"][contractName]["address"],
    signer)
  if (verbosity>0){ console.log(`--> Connected to majority voting contract with nfts weights: ${majorityNFT.address}`)}

  // connect to voting registry
  contractName = "VotingRegistry"
  let registry = await ethers.getContractAt(
    "VotingRegistry",
    _alreadyDeployed["contracts"][contractName]["address"],
    signer)
  if (verbosity>0){ console.log(`--> Connected to voting registry: ${registry.address}`)}


  // connect to controllable registrar
  contractName = "ControllableRegistrar"
  let registrar = await ethers.getContractAt(
    "ControllableRegistrar",
    _alreadyDeployed["contracts"][contractName]["address"],
    signer)
  if (verbosity>0){ console.log(`--> Connected to controllable registrar: ${registrar.address}`)}

  // connect to controlled resolver
  contractName = "ResolverWithControl"
  let resolver = await ethers.getContractAt(
    "ResolverWithControl",
    _alreadyDeployed["contracts"][contractName]["address"],
    signer)
  if (verbosity>0){ console.log(`--> Connected to resolver ${resolver.address}`)}

  // deploy a voting contract 
  let VCFactory = await ethers.getContractFactory("PlainMajorityVoteWithQuorum")
  let vc = await VCFactory.connect(signer).deploy()
  if (verbosity>1){ console.log(`--> We have sent the deployment transaction of contract ${vc.address}`)}
  await vc.deployed()
  if (verbosity>0){ console.log(`--> Deployed Voting Contract to ${vc.address}`)}

  // register the voting contract
  let tx = await registrar["register(address)"](vc.address);
  await tx.wait()
  if (verbosity>0){ console.log(`--> Registered a new voting contract`)}

  // check whether it has been registered
  let registrarAddress = await registry.getRegistrar(majorityNFT.address)
  let resolverAddress = await registry.getResolver(majorityNFT.address)
  if (verbosity>0){ console.log(`--> At the registry the resolver is ${resolverAddress} and the registrar is ${registrarAddress}.`)}

  // set information to the resolver
  let uselessInfoString: string = "SomeUselessInfo"
  let uselessKey = keccak256(abi.encode(["string"], [uselessInfoString]))
  let uselessValue = 3
  tx = await resolver["setInformation(bytes32,address,uint256)"](
    uselessKey,
    vc.address,
    uselessValue
  )
  if (verbosity>0){ console.log(`--> We set information directly to the resolver. Key is ${uselessKey} and value is ${uselessValue}.`)}

  // retrieve the value:
  let retrieveValueBytes = await resolver["getInformation(bytes32,address)"](uselessKey, vc.address) 
  if (verbosity>0){ console.log(`--> We get information directly from the resolver: Key is ${uselessKey} and value is ${retrieveValueBytes}.`)}
  let retrieveValueString = await resolver["getInformation(string,address)"](uselessInfoString, vc.address) 
  if (verbosity>0){ console.log(`--> We get information directly from the resolver: Key is ${uselessInfoString} and value is ${retrieveValueString}.`)}

  // we set the information via string
  let anotherUselessvalue: number = 4
  tx = await resolver["setInformation(string,address,uint256)"](
    uselessInfoString,
    vc.address,
    anotherUselessvalue
  )
  if (verbosity>0){ console.log(`--> We set information directly to the resolver. Key is ${uselessInfoString} and value is ${anotherUselessvalue}.`)}
  retrieveValueString = await resolver["getInformation(string,address)"](uselessInfoString, vc.address) 
  if (verbosity>0){ console.log(`--> We get information directly from the resolver: Key is ${uselessInfoString} and value is ${retrieveValueString}.`)}

  
}

let verbosity: number = 2
registerAndChange(verbosity)
      .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
