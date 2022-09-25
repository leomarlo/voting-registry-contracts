import { ethers, network } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { IVOTINGCONTRACT_ID, IERC165_ID } from "../../utils/interfaceIds";
import { ContractDeploymentInfo } from "../../interfaces/deployment"

import {  basePath } from "../../utils/paths";


import {
  MajorityVoteWithNFTQuorumAndOptionalDVGuard
} from "../../../typechain"
import { BigNumber } from "ethers";



async function deployOnlyMajorityWithNFTWeighting(signer: SignerWithAddress, gasPrice: BigNumber, verbosity: number): Promise<ContractDeploymentInfo>{
    let contractName = "MajorityVoteWithNFTQuorumAndOptionalDVGuard"
    let nftWeightedVotingContractFactory = await ethers.getContractFactory("MajorityVoteWithNFTQuorumAndOptionalDVGuard")
    let majority: MajorityVoteWithNFTQuorumAndOptionalDVGuard
    if (gasPrice > BigNumber.from("0")){
        // let gasLimit: BigNumber =  BigNumber.from("603731")
        majority = await nftWeightedVotingContractFactory.connect(signer).deploy({gasPrice})
    } else {
        majority = await nftWeightedVotingContractFactory.connect(signer).deploy()   
    }
    let tx = await majority.deployed() 
    // console.log('Tx is', tx)
    let info: ContractDeploymentInfo = {
        "MajorityVoteWithNFTQuorumAndOptionalDVGuard": {
            "address": majority.address,
            "date": Date().toLocaleString(),
            "gasLimit": tx.deployTransaction.gasLimit.toNumber(),
            "path": basePath + "implementations/votingContracts/SimpleMajorityVote/MajorityVoteWithNFTQuorumAndOptionalDVGuard.sol",
            "arguments": []} 
    }
    
    if (verbosity>0) console.log(`--> Deployed ${contractName}`)
    if (verbosity>1) console.log(`\t address: ${majority.address}\n\t network: ${network.name}`)
    
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
    deployOnlyMajorityWithNFTWeighting
}