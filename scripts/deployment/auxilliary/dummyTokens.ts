import { ethers, network } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { IVOTINGCONTRACT_ID, IERC165_ID } from "../../utils/interfaceIds";
import { ContractDeploymentInfo } from "../../interfaces/deployment"

import {  basePath } from "../../utils/paths";


import {
    DummyNFT,
    DummyToken
} from "../../../typechain"
import { BigNumber } from "ethers";



async function deployOnlyDummyERC20(signer: SignerWithAddress, gasPrice: BigNumber, verbosity: number): Promise<ContractDeploymentInfo>{
    let contractName = "DummyToken"
    let tokenFactory = await ethers.getContractFactory("DummyToken")
    let token: DummyToken
    if (gasPrice > BigNumber.from("0")){
        // let gasLimit: BigNumber =  BigNumber.from("603731")
        token = await tokenFactory.connect(signer).deploy({gasPrice})
    } else {
        token = await tokenFactory.connect(signer).deploy()   
    }
    let tx = await token.deployed() 
    // console.log('Tx is', tx)
    let info: ContractDeploymentInfo = {
        "DummyToken": {
            "address": token.address,
            "date": Date().toLocaleString(),
            "gasLimit": tx.deployTransaction.gasLimit.toNumber(),
            "path": basePath + "examples/dummies/ERC20Token.sol",
            "arguments": []} 
    }
    
    if (verbosity>0) console.log(`--> Deployed ${contractName}`)
    if (verbosity>1) console.log(`\t address: ${token.address}\n\t network: ${network.name}`)
    
    return info
}


async function deployOnlyDummyERC721(signer: SignerWithAddress, gasPrice: BigNumber, verbosity: number): Promise<ContractDeploymentInfo>{
    let contractName = "DummyNFT"
    let tokenFactory = await ethers.getContractFactory("DummyNFT")
    let token: DummyNFT
    if (gasPrice > BigNumber.from("0")){
        // let gasLimit: BigNumber =  BigNumber.from("603731")
        token = await tokenFactory.connect(signer).deploy({gasPrice})
    } else {
        token = await tokenFactory.connect(signer).deploy()   
    }
    let tx = await token.deployed() 
    // console.log('Tx is', tx)
    let info: ContractDeploymentInfo = {
        "DummyNFT": {
            "address": token.address,
            "date": Date().toLocaleString(),
            "gasLimit": tx.deployTransaction.gasLimit.toNumber(),
            "path": basePath + "examples/dummies/ERC721Token.sol",
            "arguments": []} 
    }
    
    if (verbosity>0) console.log(`--> Deployed ${contractName}`)
    if (verbosity>1) console.log(`\t address: ${token.address}\n\t network: ${network.name}`)
    
    return info
}


export {
    deployOnlyDummyERC20,
    deployOnlyDummyERC721
}