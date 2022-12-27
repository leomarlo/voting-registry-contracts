import { ethers, network } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { IVOTINGCONTRACT_ID, IERC165_ID } from "../../utils/interfaceIds";
import { ContractDeploymentInfo } from "../../interfaces/deployment"

import {  basePath } from "../../utils/paths";


import {
    SimpleSnapshotWithoutToken
} from "../../../typechain"
import { BigNumber } from "ethers";



async function deployOnlySnapshotWithoutToken(signer: SignerWithAddress, gasPrice: BigNumber, verbosity: number): Promise<ContractDeploymentInfo>{
    let contractName = "SimpleSnapshotWithoutToken"
    let snapshotVoteFactory = await ethers.getContractFactory("SimpleSnapshotWithoutToken")
    let snapshot: SimpleSnapshotWithoutToken
    if (gasPrice > BigNumber.from("0")){
        // let gasLimit: BigNumber =  BigNumber.from("603731")
        snapshot = await snapshotVoteFactory.connect(signer).deploy({gasPrice})
    } else {
        snapshot = await snapshotVoteFactory.connect(signer).deploy()   
    }
    let tx = await snapshot.deployed() 
    // console.log('Tx is', tx)
    let info: ContractDeploymentInfo = {
        "SimpleSnapshotWithoutToken": {
            "address": snapshot.address,
            "date": Date().toLocaleString(),
            "gasLimit": tx.deployTransaction.gasLimit.toNumber(),
            "path": basePath + "implementations/votingContracts/OnlyStartAndVote/SimpleSnapshotWithoutToken.sol",
            "arguments": []} 
    }
    
    if (verbosity>0) console.log(`--> Deployed ${contractName}`)
    if (verbosity>1) console.log(`\t address: ${snapshot.address}\n\t network: ${network.name}`)
    
    return info
}


export {
    deployOnlySnapshotWithoutToken
}