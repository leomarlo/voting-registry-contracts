import { ethers, network } from "hardhat";

async function getFeeData(){
    let feedata = await ethers.provider.getFeeData()
    console.log(feedata)
}

getFeeData()


// {
//   gasPrice: { BigNumber: "23610503242" },
//   maxFeePerGas: { BigNumber: "46721006484" },
//   maxPriorityFeePerGas: { BigNumber: "1500000000" }
// }