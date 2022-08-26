import { expect } from "chai";
import { arrayify, hexlify, keccak256, Result } from "ethers/lib/utils";
import { ContractReceipt, BigNumber } from "ethers";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { IVOTINGCONTRACT_ID, IERC165_ID } from "../../scripts/utils/interfaceIds";
import { durations, types } from "../../scripts/utils/playgroundVotingContracts";

import {
    PlaygroundVotingBadge,
    VotingPlayground,
    PlainMajorityVoteWithQuorum,
    SimpleSnapshotWithoutToken,
    MajorityVoteWithNFTQuorumAndOptionalDVGuard,
    DummyNFT,
    DummyToken,
    VotingRegistry,
    ExpectReturnValue,
    PlaygroundVotingBadge__factory,
    DummyToken__factory
} from "../../typechain"

import { VotingPlaygroundInterface } from "../../typechain/VotingPlayground";
import { DummyTokenInterface } from "../../typechain/DummyToken";
import { Bytecode } from "hardhat/internal/hardhat-network/stack-traces/model";


interface Contracts {
    majorityWithNftToken: MajorityVoteWithNFTQuorumAndOptionalDVGuard,
    majorityWithoutToken: PlainMajorityVoteWithQuorum,
    snapshot: SimpleSnapshotWithoutToken,
    playground: VotingPlayground,
    registry: VotingRegistry,
    badge: PlaygroundVotingBadge,
    nft: DummyNFT,
    token: DummyToken
}

interface IdentifierAndTimestamp { identifier: number, timestamp: number}

const abi = ethers.utils.defaultAbiCoder

let VotingStatus = {
    "inactive": 0,
    "completed": 1,
    "failed": 2,
    "active": 3,
    "awaitcall": 4
}

let contracts: Contracts;
let Alice: SignerWithAddress
let Bob: SignerWithAddress
let Charlie: SignerWithAddress
let Dave: SignerWithAddress
let playgroundInterface : VotingPlaygroundInterface
let tokenInterface : DummyTokenInterface

let minQuorum = 2 // at least two people need to vote. 550 // 0.55 %  
let BadgeFactory: PlaygroundVotingBadge__factory
let ERC20Factory: DummyToken__factory


describe("Test Playground", function(){
    it("Should do stuff", async function(){
        [Alice, Bob, Charlie, Dave] = await ethers.getSigners()  
    
        let RegistryFactory = await ethers.getContractFactory("VotingRegistry")
        let registry: VotingRegistry = await RegistryFactory.connect(Alice).deploy(IVOTINGCONTRACT_ID)
        await registry.deployed() 
    
        BadgeFactory = await ethers.getContractFactory("PlaygroundVotingBadge")
        const playgroundMockup = await ethers.getContractAt("VotingPlayground", ethers.constants.AddressZero);
        playgroundInterface = playgroundMockup.interface;
        
        let flagAndSelectors : Array<string> = []
        let votingContracts : Array<string> = []
        let minDurations : Array<number> = []
        let minQuorums : Array<number> = []
        let badgeWeightedVote : Array<boolean> = []
    
        let functions = Object.keys(types)
        for (let i=0; i<functions.length; i++){
            let fct : string = functions[i].toString();
            flagAndSelectors.push(
                (types[fct].security=="secure" ? "0x01": "0x00") + playgroundInterface.getSighash(fct).slice(2,)
            )
            votingContracts.push(
                types[fct].badgeWeightedVote ? ethers.constants.AddressZero : ethers.constants.AddressZero
            )
            badgeWeightedVote.push(types[fct].badgeWeightedVote as boolean)
            if (types[fct].duration)
            minDurations.push(types[fct].duration as number)
            minQuorums.push(minQuorum)
        }
    
        let deployArguments = abi.encode(["string", "string"],["Playground Voting Badge", "PLAY"])
        let rawByteCode = BadgeFactory.bytecode + deployArguments.slice(2,);
        let hashedBytecode = keccak256(rawByteCode)
    
        console.log(minDurations)
        console.log(minQuorums)
    
        console.log(minDurations)
        
        let PlaygroundFactory = await ethers.getContractFactory("VotingPlayground")
        let playground: VotingPlayground 
    
        try {
            playground = await PlaygroundFactory.connect(Alice).deploy(
                registry.address,
                flagAndSelectors,
                votingContracts,
                minDurations,
                minQuorums,
                badgeWeightedVote,
                hashedBytecode
            )
            // )
            await playground.deployed()
    
            // let badge = await ethers.getContractAt("PlaygroundVotingBadge", await playground.badges(0));
        
            console.log(playground.address)
            console.log('Alices address', Alice.address)
            await playground.connect(Alice).deployNewBadge(
                abi.encode(["uint256"],[0]),
                rawByteCode,
                Alice.address
            )
            // console.log(badge.address)
    
        } catch(err) {
            console.log(err)
    
            throw err
        }
    })
    

})
   

