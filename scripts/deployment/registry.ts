import { ethers, network } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { IVOTINGCONTRACT_ID, IERC165_ID } from "../utils/interfaceIds";
import { ContractDeploymentInfo } from "../interfaces/deployment"

import {  basePath } from "../utils/paths";


import {
  VotingRegistry
} from "../../typechain"
import { BigNumber } from "ethers";



async function deployOnlyRegistry(signer: SignerWithAddress, gasPrice: BigNumber, verbosity: number): Promise<ContractDeploymentInfo>{
    let contractName = "VotingRegistry"
    let RegistryFactory = await ethers.getContractFactory("VotingRegistry")
    let registry: VotingRegistry
    if (gasPrice > BigNumber.from("0")){
        let gasLimit: BigNumber =  BigNumber.from("603731")
        registry = await RegistryFactory.connect(signer).deploy(IVOTINGCONTRACT_ID, {gasPrice, gasLimit})
    } else {
        registry = await RegistryFactory.connect(signer).deploy(IVOTINGCONTRACT_ID)   
    }
    let tx = await registry.deployed() 
    console.log('Tx is', tx)
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

// let LEO: SignerWithAddress
// var verbosity: number = 2
// var gasPrice: BigNumber = ethers.utils.parseUnits("5", "gwei")

// async function deployRegistry(gasPrice: BigNumber, verbosity: number){
//     [LEO] = await ethers.getSigners()
//     await deployOnlyRegistry(LEO, gasPrice, verbosity)
// }

export {
    deployOnlyRegistry
}