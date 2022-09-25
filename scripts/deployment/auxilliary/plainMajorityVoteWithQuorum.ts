import { ethers, network } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { IVOTINGCONTRACT_ID, IERC165_ID } from "../../utils/interfaceIds";
import { ContractDeploymentInfo } from "../../interfaces/deployment"

import {  basePath } from "../../utils/paths";


import {
  PlainMajorityVoteWithQuorum
} from "../../../typechain"
import { BigNumber } from "ethers";



async function deployOnlySimpleMajorityWithQuorum(signer: SignerWithAddress, gasPrice: BigNumber, verbosity: number): Promise<ContractDeploymentInfo>{
    let contractName = "PlainMajorityVoteWithQuorum"
    let majorityVoteFactory = await ethers.getContractFactory("PlainMajorityVoteWithQuorum")
    let majority: PlainMajorityVoteWithQuorum
    if (gasPrice > BigNumber.from("0")){
        // let gasLimit: BigNumber =  BigNumber.from("603731")
        majority = await majorityVoteFactory.connect(signer).deploy({gasPrice})
    } else {
        majority = await majorityVoteFactory.connect(signer).deploy()   
    }
    let tx = await majority.deployed() 
    // console.log('Tx is', tx)
    let info: ContractDeploymentInfo = {
        "PlainMajorityVoteWithQuorum": {
            "address": majority.address,
            "date": Date().toLocaleString(),
            "gasLimit": tx.deployTransaction.gasLimit.toNumber(),
            "path": basePath + "implementations/votingContracts/SimpleMajorityVote/PlainMajorityVoteWithQuorum.sol",
            "arguments": []} 
    }
    
    if (verbosity>0) console.log(`--> Deployed ${contractName}`)
    if (verbosity>1) console.log(`\t address: ${majority.address}\n\t network: ${network.name}`)
    
    return info
}


export {
    deployOnlySimpleMajorityWithQuorum
}