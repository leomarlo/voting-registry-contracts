import { ethers, network } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { IVOTINGCONTRACT_ID, IERC165_ID } from "../utils/interfaceIds";
import { ContractDeploymentInfo } from "../interfaces/deployment"

import {  basePath } from "../utils/paths";


import {
  VotingRegistry
} from "../../typechain"



async function deployOnlyRegistry(signer: SignerWithAddress, verbosity: number): Promise<ContractDeploymentInfo>{
    let contractName = "VotingRegistry"
    let RegistryFactory = await ethers.getContractFactory("VotingRegistry")
    let registry: VotingRegistry = await RegistryFactory.connect(signer).deploy(IVOTINGCONTRACT_ID)
    await registry.deployed() 
    let info: ContractDeploymentInfo = {
        "VotingRegistry": {
            "address": registry.address,
            "path": basePath + "registration/registry/VotingRegistry.sol",
            "arguments": [`"${IVOTINGCONTRACT_ID}"`]} 
    }
    
    if (verbosity>0) console.log(`--> Deployed ${contractName}`)
    if (verbosity>1) console.log(`\t address: ${registry.address}\n\t network: ${network.name}`)
    
    return info
}

export {
    deployOnlyRegistry
}