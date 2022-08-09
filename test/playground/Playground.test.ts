// import { expect } from "chai";
// import { Result } from "ethers/lib/utils";
// import { ContractReceipt, BigNumber } from "ethers";
// import { ethers } from "hardhat";
// import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
// import { IVOTINGCONTRACT_ID, IERC165_ID } from "../../scripts/interfaceIds";

// import {
//     PlaygroundVotingBadge,
//     VotingPlayground
// } from "../../typechain"

// import { StartVoteAndImplementHybridVotingMinmlExampleInterface } from "../../typechain/StartVoteAndImplementHybridVotingMinmlExample";

// interface Contracts {
//     playground: VotingPlayground,
//     badge: PlaygroundVotingBadge
// }

// interface IdentifierAndTimestamp { identifier: number, timestamp: number}

// const abi = ethers.utils.defaultAbiCoder

// let VotingStatus = {
//     "inactive": 0,
//     "completed": 1,
//     "failed": 2,
//     "active": 3,
//     "awaitcall": 4
// }

// let DISAPPROVE = abi.encode(["uint256"],[0])
// let APPROVE = abi.encode(["uint256"],[1])

// describe("Playground", function(){
//     let contracts: Contracts;
//     let Alice: SignerWithAddress
//     let Bob: SignerWithAddress
//     let Charlie: SignerWithAddress
//     let Dave: SignerWithAddress

//     beforeEach(async function(){
//         [Alice, Bob, Charlie, Dave] = await ethers.getSigners()  
            
//         let PlaygroundFactory = await ethers.getContractFactory("VotingPlayground")
//         let playground: VotingPlayground = await PlaygroundFactory.connect(Alice).deploy()
//         await playground.deployed()

//         // let badge: PlaygroundVotingBadge; // = await ethers.getContractAt("ResolverWithControl", await registrar.RESOLVER(), Alice)
        
//         let BadgeFactory = await ethers.getContractFactory("PlaygroundVotingBadge")
//         let badge: PlaygroundVotingBadge = await BadgeFactory.connect(Alice).deploy()
//         await badge.deployed()
    
//         contracts = {
//             playground,
//             badge
//         }
//     })

//     describe("Deployment", async function(){

//     })
// })