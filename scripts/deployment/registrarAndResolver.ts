import { ethers, network } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { IVOTINGCONTRACT_ID, IERC165_ID } from "../utils/interfaceIds";
import { ContractDeploymentInfo } from "../interfaces/deployment"

import {  basePath } from "../utils/paths";

import {
    ControllableRegistrar,
    VotingRegistry,
    SimpleSnapshotWithoutToken, 
    MajorityVoteWithNFTQuorumAndOptionalDVGuard,
    ResolverWithControl
} from "../../typechain"

import { ControllableRegistrarInterface } from "../../typechain/ControllableRegistrar";

const abi = ethers.utils.defaultAbiCoder 

async function deployOnlyRegistrarAndResolver(
    signer: SignerWithAddress,
    registryAddress: string, 
    nftWeightedVotingAddress: string, 
    verbosity: number): Promise<ContractDeploymentInfo> 
{
    let info : ContractDeploymentInfo = {}

    let ResolverFactory = await ethers.getContractFactory("ResolverWithControl")

    let contractName = "ControllableRegistrar"
    let RegistrarFactory = await ethers.getContractFactory("ControllableRegistrar")
    let salt = abi.encode(["uint256"],[1]);
    let registrar: ControllableRegistrar = await RegistrarFactory.connect(signer).deploy(
        nftWeightedVotingAddress,
        registryAddress,
        "TestRegistrar",
        "REG",
        salt,
        ResolverFactory.bytecode)
    await registrar.deployed()

    info = Object.assign(info, { "ControllableRegistrar": 
      {
        "address": registrar.address,
        "path": basePath + "implementations/registration/RegistrarAndResolver.sol",
        "arguments": [
            `"${nftWeightedVotingAddress}"`,
            `"${registryAddress}"`,
            `"TestRegistrar"`,
            `"REG"`,
            `"${salt}"`,
            `"${ResolverFactory.bytecode}"`]
      }}) 
    

    if (verbosity>0) console.log(`--> Deployed ${contractName}`)
    if (verbosity>1) console.log(`\t address: ${registrar.address}\n\t network: ${network.name}`)

    // let resolver: ResolverWithControl = await ethers.getContractAt("ResolverWithControl", await registrar.RESOLVER(), Alice)
    contractName = "ResolverWithControl"
    let resolverAddress = await registrar.RESOLVER()
    info = Object.assign(info, { "ResolverWithControl": 
        {
            "address": resolverAddress,
            "path": basePath + "implementations/registration/Resolver.sol",
            "arguments": []
        }})   

    if (verbosity>0) console.log(`--> Deployed ${contractName}`)
    if (verbosity>1) console.log(`\t address: ${resolverAddress}\n\t network: ${network.name}`)

    return info
}




export {
    deployOnlyRegistrarAndResolver
}