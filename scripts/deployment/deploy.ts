// external libraries
import * as dotenv from "dotenv";
import { ContractReceipt, BigNumber, Signer, Contract } from "ethers";
import hre, { ethers, network } from "hardhat";
import fs from 'fs'
dotenv.config()

// deployment functions from the auxiliary folder
import { deployOnlyRegistry } from "./auxilliary/registry";
// import { deployOnlyPlaygroundAndBadge } from "./playground";
import { deployOnlyRegistrarAndResolver } from "./auxilliary/registrarAndResolver";
import { deployOnlyPlaygroundAndBadge, startVotingInstances} from "./auxilliary/playground";
import { deployOnlySnapshotWithoutToken } from "./auxilliary/snapshotWithoutToken";
import { deployOnlyTournament } from "./auxilliary/tournament";
import { deployOnlyMajorityWithNFTWeighting } from "./auxilliary/majorityWithNftWeightedVoting"
import { deployOnlySimpleMajorityWithQuorum } from "./auxilliary/plainMajorityVoteWithQuorum"
import { deployOnlyDummyERC20, deployOnlyDummyERC721 } from "./auxilliary/dummyTokens";
import { alreadyDeployed } from "./auxilliary/checkDeployment"

// helper functions
import { saveToFile } from "../utils/saveToFile";
import { deploymentInfoPath, basePath } from "../utils/paths";
import { saveDeploymentArgumentsToFile} from "../verification/utils"
import { Deployment, AlreadyDeployed, NetworkToContractDeploymentInfo } from "../interfaces/deployment"
import { ExpectReturnValue } from "../../typechain";


async function deployRegistry(verbosity: number, gasPrice: BigNumber) {

  const [LEO] = await ethers.getSigners()

  // retrieving existing deployment info from a file (scripts/verification/deploymentInfo.json)
  let rawdata = fs.readFileSync(deploymentInfoPath);

  // saving all the deployment info into an Object
  let deploymentVariables : NetworkToContractDeploymentInfo =
    (rawdata.length==0) ? {} : JSON.parse(rawdata.toString())
  
  // deploy the registry
  let registryDeploymentInfo = await deployOnlyRegistry(LEO, gasPrice, verbosity)
  
  // adding the new deployment info into that object
  if (network.name in deploymentVariables){
    deploymentVariables[network.name] = Object.assign(deploymentVariables[network.name], registryDeploymentInfo)  
  } else {
    deploymentVariables[network.name] = registryDeploymentInfo
  }
  
  saveToFile(deploymentVariables, deploymentInfoPath)
  if (verbosity>0) console.log(`--> Saved deployment information to the file ${deploymentInfoPath}`)
  
  saveDeploymentArgumentsToFile(network.name)
  if (verbosity>0) console.log(`--> Saved deployment arguments for verification to js-files.`)

}

async function deployNftWeightedMajorityVC(verbosity: number, gasPrice: BigNumber) {

  const [LEO] = await ethers.getSigners()

  // retrieving existing deployment info from a file (scripts/verification/deploymentInfo.json)
  let rawdata = fs.readFileSync(deploymentInfoPath);

  // saving all the deployment info into an Object
  let deploymentVariables : NetworkToContractDeploymentInfo =
    (rawdata.length==0) ? {} : JSON.parse(rawdata.toString())
  
  // deploy the registry
  let registryDeploymentInfo = await deployOnlyMajorityWithNFTWeighting(LEO, gasPrice, verbosity)
  
  // adding the new deployment info into that object
  if (network.name in deploymentVariables){
    deploymentVariables[network.name] = Object.assign(deploymentVariables[network.name], registryDeploymentInfo)  
  } else {
    deploymentVariables[network.name] = registryDeploymentInfo
  }
  
  saveToFile(deploymentVariables, deploymentInfoPath)
  if (verbosity>0) console.log(`--> Saved deployment information to the file ${deploymentInfoPath}`)
  
  saveDeploymentArgumentsToFile(network.name)
  if (verbosity>0) console.log(`--> Saved deployment arguments for verification to js-files.`)

}


async function deployPlainMajorityWithQuorumVC(verbosity: number, gasPrice: BigNumber) {

  const [LEO] = await ethers.getSigners()

  // retrieving existing deployment info from a file (scripts/verification/deploymentInfo.json)
  let rawdata = fs.readFileSync(deploymentInfoPath);

  // saving all the deployment info into an Object
  let deploymentVariables : NetworkToContractDeploymentInfo =
    (rawdata.length==0) ? {} : JSON.parse(rawdata.toString())
  
  // deploy the registry
  let registryDeploymentInfo = await deployOnlySimpleMajorityWithQuorum(LEO, gasPrice, verbosity)
  
  // adding the new deployment info into that object
  if (network.name in deploymentVariables){
    deploymentVariables[network.name] = Object.assign(deploymentVariables[network.name], registryDeploymentInfo)  
  } else {
    deploymentVariables[network.name] = registryDeploymentInfo
  }
  
  // console.log('deplyoment Variables', deploymentVariables[hre.network.name])
  saveToFile(deploymentVariables, deploymentInfoPath)
  if (verbosity>0) console.log(`--> Saved deployment information to the file ${deploymentInfoPath}.`)
  
  saveDeploymentArgumentsToFile(network.name)
  if (verbosity>0) console.log(`--> Saved deployment arguments for verification to js-files.`)

}


async function deployDummyERC20(verbosity: number, gasPrice: BigNumber) {

  const [LEO] = await ethers.getSigners()

  // retrieving existing deployment info from a file (scripts/verification/deploymentInfo.json)
  let rawdata = fs.readFileSync(deploymentInfoPath);

  // saving all the deployment info into an Object
  let deploymentVariables : NetworkToContractDeploymentInfo =
    (rawdata.length==0) ? {} : JSON.parse(rawdata.toString())
  
  // deploy the registry
  let registryDeploymentInfo = await deployOnlyDummyERC20(LEO, gasPrice, verbosity)
  
  // adding the new deployment info into that object
  if (network.name in deploymentVariables){
    deploymentVariables[network.name] = Object.assign(deploymentVariables[network.name], registryDeploymentInfo)  
  } else {
    deploymentVariables[network.name] = registryDeploymentInfo
  }
  
  // console.log('deplyoment Variables', deploymentVariables[hre.network.name])
  saveToFile(deploymentVariables, deploymentInfoPath)
  if (verbosity>0) console.log(`--> Saved deployment information to the file ${deploymentInfoPath}.`)
  
  saveDeploymentArgumentsToFile(network.name)
  if (verbosity>0) console.log(`--> Saved deployment arguments for verification to js-files.`)

}


async function deployDummyERC721(verbosity: number, gasPrice: BigNumber) {

  const [LEO] = await ethers.getSigners()

  // retrieving existing deployment info from a file (scripts/verification/deploymentInfo.json)
  let rawdata = fs.readFileSync(deploymentInfoPath);

  // saving all the deployment info into an Object
  let deploymentVariables : NetworkToContractDeploymentInfo =
    (rawdata.length==0) ? {} : JSON.parse(rawdata.toString())
  
  // deploy the registry
  let registryDeploymentInfo = await deployOnlyDummyERC721(LEO, gasPrice, verbosity)
  
  // adding the new deployment info into that object
  if (network.name in deploymentVariables){
    deploymentVariables[network.name] = Object.assign(deploymentVariables[network.name], registryDeploymentInfo)  
  } else {
    deploymentVariables[network.name] = registryDeploymentInfo
  }
  
  // console.log('deplyoment Variables', deploymentVariables[hre.network.name])
  saveToFile(deploymentVariables, deploymentInfoPath)
  if (verbosity>0) console.log(`--> Saved deployment information to the file ${deploymentInfoPath}.`)
  
  saveDeploymentArgumentsToFile(network.name)
  if (verbosity>0) console.log(`--> Saved deployment arguments for verification to js-files.`)

}


async function deploySnapshotWithoutToken(verbosity: number, gasPrice: BigNumber) {

  const [LEO] = await ethers.getSigners()

  // retrieving existing deployment info from a file (scripts/verification/deploymentInfo.json)
  let rawdata = fs.readFileSync(deploymentInfoPath);

  // saving all the deployment info into an Object
  let deploymentVariables : NetworkToContractDeploymentInfo =
    (rawdata.length==0) ? {} : JSON.parse(rawdata.toString())
  
  // deploy the registry
  let registryDeploymentInfo = await deployOnlySnapshotWithoutToken(LEO, gasPrice, verbosity)
  
  // adding the new deployment info into that object
  if (network.name in deploymentVariables){
    deploymentVariables[network.name] = Object.assign(deploymentVariables[network.name], registryDeploymentInfo)  
  } else {
    deploymentVariables[network.name] = registryDeploymentInfo
  }
  
  // console.log('deplyoment Variables', deploymentVariables[hre.network.name])
  saveToFile(deploymentVariables, deploymentInfoPath)
  if (verbosity>0) console.log(`--> Saved deployment information to the file ${deploymentInfoPath}.`)
  
  saveDeploymentArgumentsToFile(network.name)
  if (verbosity>0) console.log(`--> Saved deployment arguments for verification to js-files.`)

}


async function deployRegistrarAndResolver(verbosity: number, gasPrice: BigNumber) {

  // check prerequisites first
  // has the registry been deployed already on the current network?
  let _alreadyDeployed : AlreadyDeployed = alreadyDeployed(
    hre.network.name, 
    [
      "VotingRegistry",
      "MajorityVoteWithNFTQuorumAndOptionalDVGuard"
    ]) 
  if (!_alreadyDeployed["flag"]){
    console.log(_alreadyDeployed["contracts"])
    throw(`Some contracts still need to be deployed.`)
  }

  const [LEO] = await ethers.getSigners()

  // retrieving existing deployment info from a file (scripts/verification/deploymentInfo.json)
  let rawdata = fs.readFileSync(deploymentInfoPath);

  // saving all the deployment info into an Object
  let deploymentVariables : NetworkToContractDeploymentInfo =
    (rawdata.length==0) ? {} : JSON.parse(rawdata.toString())

  let registryDeploymentInfo = await deployOnlyRegistrarAndResolver(
    LEO, 
    _alreadyDeployed["contracts"]["VotingRegistry"]["address"],
    _alreadyDeployed["contracts"]["MajorityVoteWithNFTQuorumAndOptionalDVGuard"]["address"],
    verbosity
    )

  // adding the new deployment info into that object
  if (network.name in deploymentVariables){
    deploymentVariables[network.name] = Object.assign(deploymentVariables[network.name], registryDeploymentInfo)  
  } else {
    deploymentVariables[network.name] = registryDeploymentInfo
  }
  
  saveToFile(deploymentVariables, deploymentInfoPath)
  if (verbosity>0) console.log(`--> Saved deployment information to the file ${deploymentInfoPath}`)
  
  saveDeploymentArgumentsToFile(network.name)
  if (verbosity>0) console.log(`--> Saved deployment arguments for verification to js-files.`)

}


async function deployPlaygroundAndBadge(minQuorum: number, verbosity: number, gasPrice: BigNumber) {
  // check prerequisites first
  // has the registry been deployed already on the current network?
 
  let _alreadyDeployed : AlreadyDeployed = alreadyDeployed(
    hre.network.name, 
    [
      "VotingRegistry",
      "MajorityVoteWithNFTQuorumAndOptionalDVGuard",
      "PlainMajorityVoteWithQuorum"
    ]) 
  if (!_alreadyDeployed["flag"]){
    console.log(_alreadyDeployed["contracts"])
    throw(`Some contracts still need to be deployed.`)
  }

  const [LEO] = await ethers.getSigners()

  // retrieving existing deployment info from a file (scripts/verification/deploymentInfo.json)
  let rawdata = fs.readFileSync(deploymentInfoPath);

  // saving all the deployment info into an Object
  let deploymentVariables : NetworkToContractDeploymentInfo =
  (rawdata.length==0) ? {} : JSON.parse(rawdata.toString())

  let registryDeploymentInfo = await deployOnlyPlaygroundAndBadge(
    LEO, 
    _alreadyDeployed["contracts"]["VotingRegistry"]["address"],
    _alreadyDeployed["contracts"]["MajorityVoteWithNFTQuorumAndOptionalDVGuard"]["address"],
    _alreadyDeployed["contracts"]["PlainMajorityVoteWithQuorum"]["address"],
    minQuorum, 
    gasPrice,
    verbosity
    )
  // adding the new deployment info into that object
  if (network.name in deploymentVariables){
    deploymentVariables[network.name] = Object.assign(deploymentVariables[network.name], registryDeploymentInfo)  
  } else {
    deploymentVariables[network.name] = registryDeploymentInfo
  }
  
  saveToFile(deploymentVariables, deploymentInfoPath)
  if (verbosity>0) console.log(`--> Saved deployment information to the file ${deploymentInfoPath}`)
  
  saveDeploymentArgumentsToFile(network.name)
  if (verbosity>0) console.log(`--> Saved deployment arguments for verification to js-files.`)

}

async function startVotingInstancesForPlayground(minQuorum: number, verbosity: number) {
  let _alreadyDeployed : AlreadyDeployed = alreadyDeployed(
    hre.network.name, 
    [
      "VotingPlayground",
      "DummyNFT"
    ]) 
  if (!_alreadyDeployed["flag"]){
    console.log(_alreadyDeployed["contracts"])
    throw(`Some contracts still need to be deployed.`)
  }

  const [LEO] = await ethers.getSigners()
  const expectReturnValue = false
  await startVotingInstances(
    LEO, 
    _alreadyDeployed["contracts"]["VotingPlayground"]["address"],
    _alreadyDeployed["contracts"]["DummyNFT"]["address"],
    minQuorum, 
    expectReturnValue,
    verbosity
    )

  
}



const minQuorum = 2;


async function deploy(what:Array<string>, verbosity: number, gasPrice: BigNumber){
    for (let i=0; i<what.length; i++){
      if (what[i]=='registry'){
        await deployRegistry(verbosity, gasPrice)
      } else if (what[i]=='registrarAndResolver'){
        await deployRegistrarAndResolver(verbosity, gasPrice)
      } else if (what[i]=='MajorityVoteWithNFTQuorumAndOptionalDVGuard') {
        await deployNftWeightedMajorityVC(verbosity, gasPrice)
      } else if (what[i]=='SimpleSnapshotWithoutToken') {
        await deploySnapshotWithoutToken(verbosity, gasPrice)
      } else if (what[i]=='PlainMajorityVoteWithQuorum') {
        await deployPlainMajorityWithQuorumVC(verbosity, gasPrice)
      } else if (what[i]=='DummyToken') {
        await deployDummyERC20(verbosity, gasPrice)
      } else if (what[i]=='DummyNFT') {
        await deployDummyERC721(verbosity, gasPrice)
      } else if (what[i]=='playgroundAndBadge') {
        await deployPlaygroundAndBadge(minQuorum, verbosity, gasPrice)
      } else {
        continue
      }
    }
}




// set gasPrice to "0" if you want it to be determined automatically.
// set it to a positive value if you want to fix the gas price!
var gasPrice: BigNumber = ethers.utils.parseUnits("0", "gwei")
var verbosity: number = 2
// var what = 'registry'
// var what = 'nftWeightedVotingContract'
var what = [
  'registry',
  'MajorityVoteWithNFTQuorumAndOptionalDVGuard',
  'registrarAndResolver',
  'PlainMajorityVoteWithQuorum',
  'playgroundAndBadge',
  'DummyToken',
  'DummyNFT'
]

deploy(what, verbosity, gasPrice)
      .then(()=>{
        let _alreadyDeployed = alreadyDeployed(hre.network.name, ["VotingPlayground", "DummyNFT"]) 
        if (_alreadyDeployed["flag"]){
          startVotingInstancesForPlayground(minQuorum, verbosity)
          .then(()=>(console.log("Everything went smooth!")))
          .catch((error) => {
            console.error(error);
            process.exitCode = 1;
          })
        } else {
          console.log('No Playground was deployed.')
        }
        
      })
      .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });

