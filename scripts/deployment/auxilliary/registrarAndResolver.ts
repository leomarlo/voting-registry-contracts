import { ethers, network } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { IVOTINGCONTRACT_ID, IERC165_ID } from "../../utils/interfaceIds";
import { ContractDeploymentInfo } from "../../interfaces/deployment"

import {  basePath } from "../../utils/paths";

import {
    ControllableRegistrar,
    VotingRegistry,
    SimpleSnapshotWithoutToken, 
    MajorityVoteWithNFTQuorumAndOptionalDVGuard,
    ResolverWithControl
} from "../../../typechain"

import { ControllableRegistrarInterface } from "../../../typechain/ControllableRegistrar";

const abi = ethers.utils.defaultAbiCoder 

async function deployOnlyRegistrarAndResolver(
    signer: SignerWithAddress,
    registryAddress: string, 
    nftWeightedVotingAddress: string, 
    verbosity: number): Promise<ContractDeploymentInfo> 
{
    let info : ContractDeploymentInfo = {}

    let contractName = "ResolverWithControl"
    let ResolverFactory = await ethers.getContractFactory("ResolverWithControl")
    let resolver: ResolverWithControl = await ResolverFactory.connect(signer).deploy() 
    let resolverTx = await resolver.deployed()

    info = Object.assign(info, { "ResolverWithControl": 
      {
        "address": resolver.address,
        "date": Date().toLocaleString(),
        "gasLimit": resolverTx.deployTransaction.gasLimit.toNumber(),    
        "path": basePath + "implementations/registration/Resolver.sol",
        "arguments": []
      }}) 


    if (verbosity>0) console.log(`--> Deployed ${contractName}`)
    if (verbosity>1) console.log(`\t address: ${resolver.address}\n\t network: ${network.name}`)

    contractName = "ControllableRegistrar"
    // let nftName = "First Registrar"
    // let nftSymbol = "REG1"
    let RegistrarFactory = await ethers.getContractFactory("ControllableRegistrar")
    let registrar: ControllableRegistrar = await RegistrarFactory.connect(signer).deploy(
        nftWeightedVotingAddress,
        registryAddress,
        resolver.address)
    //     nftName,
    //     nftSymbol,
    //     resolver.address)
    // let registrar: ControllableRegistrar = await RegistrarFactory.connect(signer).deploy()
    let registrarTx = await registrar.deployed()

    info = Object.assign(info, { "ControllableRegistrar": 
      {
        "address": registrar.address,
        "date": Date().toLocaleString(),
        "gasLimit": registrarTx.deployTransaction.gasLimit.toNumber(),    
        "path": basePath + "implementations/registration/RegistrarAndResolver.sol",
        "arguments": [
            `"${nftWeightedVotingAddress}"`,
            `"${registryAddress}"`,
            `"${resolver.address}"`
        ]
        // "arguments": [
            // `"${nftWeightedVotingAddress}"`,
            // `"${registryAddress}"`,
        //     `"${nftName}"`,
        //     `"${nftSymbol}"`,
        //     `"${resolver.address}"`]
      }}) 
    

    if (verbosity>0) console.log(`--> Deployed ${contractName}`)
    if (verbosity>1) console.log(`\t address: ${registrar.address}\n\t network: ${network.name}`)
 
    return info
}




export {
    deployOnlyRegistrarAndResolver
}