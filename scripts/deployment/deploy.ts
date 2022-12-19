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
import { deployOnlyTournament } from "./auxilliary/tournament";
import { deployOnlyMajorityWithNFTWeighting } from "./auxilliary/majorityWithNftWeightedVoting"
import { deployOnlySimpleMajorityWithQuorum } from "./auxilliary/plainMajorityVoteWithQuorum"
import { alreadyDeployed } from "./auxilliary/checkDeployment"

// helper functions
import { saveToFile } from "../utils/saveToFile";
import { deploymentInfoPath, basePath } from "../utils/paths";
import { saveDeploymentArgumentsToFile} from "../verification/utils"
import { Deployment, AlreadyDeployed, NetworkToContractDeploymentInfo } from "../interfaces/deployment"


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
  if (verbosity>0) console.log(`--> Saved deployment information to the file ${deploymentInfoPath}deploymentInfo.json`)
  
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
  if (verbosity>0) console.log(`--> Saved deployment information to the file ${deploymentInfoPath}deploymentInfo.json`)
  
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
  if (verbosity>0) console.log(`--> Saved deployment information to the file ${deploymentInfoPath}deploymentInfo.json`)
  
  saveDeploymentArgumentsToFile(network.name)
  if (verbosity>0) console.log(`--> Saved deployment arguments for verification to js-files.`)

}




async function deploy(what:Array<string>, verbosity: number, gasPrice: BigNumber){
    for (let i=0; i<what.length; i++){
      if (what[i]=='registry'){
        await deployRegistry(verbosity, gasPrice)
      } else if (what[i]=='registrarAndResolver'){
        await deployRegistrarAndResolver(verbosity, gasPrice)
      } else if (what[i]=='nftWeightedVotingContract') {
        await deployNftWeightedMajorityVC(verbosity, gasPrice)
      } else if (what[i]=='plainMajorityWithQuorum') {
        await deployPlainMajorityWithQuorumVC(verbosity, gasPrice)
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
  'nftWeightedVotingContract',
  'registrarAndResolver']
  // 'plainMajorityWithQuorum']
deploy(what, verbosity, gasPrice)
      .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });

