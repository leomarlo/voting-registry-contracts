import { ethers, network } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { IVOTINGCONTRACT_ID, IERC165_ID } from "../utils/interfaceIds";
import { ContractDeploymentInfo } from "../interfaces/deployment"

import {  basePath } from "../utils/paths";


import {
  Tournament
} from "../../typechain"



async function deployOnlyTournament(signer: SignerWithAddress, verbosity: number): Promise<ContractDeploymentInfo>{
    let contractName = "Tournament"
    let TournamentFactory = await ethers.getContractFactory("Tournament")
    let tournament: Tournament = await TournamentFactory.connect(signer).deploy()
    await tournament.deployed() 
    let info: ContractDeploymentInfo = {
        "Tournament": {
            "address": tournament.address,
            "path": basePath + "implementations/votingContracts/Tournament/Tournament.sol",
            "arguments": []} 
    }
    
    if (verbosity>0) console.log(`--> Deployed ${contractName}`)
    if (verbosity>1) console.log(`\t address: ${tournament.address}\n\t network: ${network.name}`)
    
    return info
    
}

export {
    deployOnlyTournament
}