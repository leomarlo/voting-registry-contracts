// external libraries
import * as dotenv from "dotenv";
import fs from 'fs'
dotenv.config()

// helper functions
import { saveToFile } from "./utils/saveToFile";
import { deploymentInfoPath, basePath } from "./utils/paths";
import { saveDeploymentArgumentsToFile} from "./verification/utils"
import { Deployment, AlreadyDeployed, NetworkToContractDeploymentInfo } from "./interfaces/deployment"
import { ethers, network } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";



import {
  DummyToken
} from "../typechain"
import { BigNumber } from "ethers";


async function deployRegistry() {

    const [signer] = await ethers.getSigners()
  
    // retrieving existing deployment info from a file (scripts/verification/deploymentInfo.json)
    let rawdata = fs.readFileSync(deploymentInfoPath);
  
    // saving all the deployment info into an Object
    let deploymentVariables : NetworkToContractDeploymentInfo =
      (rawdata.length==0) ? {} : JSON.parse(rawdata.toString())

    let DummyTokenFactory = await ethers.getContractFactory("DummyToken")
    
    let token: DummyToken = await DummyTokenFactory.connect(signer).deploy()
    
    let tx = await token.deployed()
    console.log(`Address of Dummy Token is ${token.address}.`) 
}   

deployRegistry()
      .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });