import {deployOnlyRegistry} from './deployment/registry'
import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";


let LEO: SignerWithAddress
var verbosity: number = 2
var gasPrice: BigNumber = ethers.utils.parseUnits("5", "gwei")

async function deployRegistry(gasPrice: BigNumber, verbosity: number){
    [LEO] = await ethers.getSigners()
    await deployOnlyRegistry(LEO, gasPrice, verbosity)
}

deployRegistry(gasPrice, verbosity)
      .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });