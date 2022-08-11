import { expect } from "chai";
import { Result } from "ethers/lib/utils";
import { ContractReceipt, BigNumber } from "ethers";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { IVOTINGCONTRACT_ID, IERC165_ID } from "../../scripts/interfaceIds";

import {
    PlaygroundVotingBadge,
    VotingPlayground,
    PlainMajorityVote,
    SimpleSnapshotWithoutToken,
    MajorityVoteWithTokenQuorumAndOptionalDVGuard,
    DummyNFT,
    DummyToken,
    VotingRegistry
} from "../../typechain"

import { VotingPlaygroundInterface } from "../../typechain/VotingPlayground";


interface Contracts {
    majorityWithToken: MajorityVoteWithTokenQuorumAndOptionalDVGuard,
    majorityWithoutToken: PlainMajorityVote,
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

let DISAPPROVE = abi.encode(["uint256"],[0])
let APPROVE = abi.encode(["uint256"],[1])

describe("Playground", function(){
    let contracts: Contracts;
    let Alice: SignerWithAddress
    let Bob: SignerWithAddress
    let Charlie: SignerWithAddress
    let Dave: SignerWithAddress
    let playgroundInterface : VotingPlaygroundInterface
    let durations = {
        "snap": 180,  // 3 minutes
        "short": 1800,  // 30 minutes
        "medium": 86400,  // 1 day
        "long": 432000,  // 5 days
        "veryLong": 1209600  // 14 days (2 weeks)
    }

    let types :{ [key: string]: { [key: string]: string | number | boolean }  }  = {
        "changeMetaParameters": {
            "security": "secure",
            "duration": durations.long,
            "badgeWeightedVote": true}, 
        "changeAssignedContract": {
            "security": "secure",
            "duration": durations.medium,
            "badgeWeightedVote": true}, 
        "setMainBadge":{
            "security": "secure",
            "duration": durations.veryLong,
            "badgeWeightedVote": true}, 
        "setMinXpToStartAnything":{
            "security": "secure",
            "duration": durations.long,
            "badgeWeightedVote": true}, 
        "setMinXpToStartThisFunction":{
            "security": "secure",
            "duration": durations.long,
            "badgeWeightedVote": true}, 
        "setEnableTradingThreshold":{
            "security": "secure",
            "duration": durations.long,
            "badgeWeightedVote": true},  
        "setTradingEnabledGlobally":{
            "security": "secure",
            "duration": durations.long,
            "badgeWeightedVote": true}, 
        "setAcceptingNFTs":{
            "security": "open",
            "duration": durations.long,
            "badgeWeightedVote": true},
        "changeCounter":{
            "security": "open",
            "duration": durations.snap,
            "badgeWeightedVote": true},
        "changeOperation": {
            "security": "open",
            "duration": durations.medium,
            "badgeWeightedVote": false},
        "changeIncumbent": {
            "security": "open",
            "duration": durations.medium,
            "badgeWeightedVote": true},
        "deployNewBadge": {
            "security": "open",
            "duration": durations.medium,
            "badgeWeightedVote": true},
        "deployNewContract": {
            "security": "open",
            "duration": durations.short,
            "badgeWeightedVote": false},
        "sendNFT": {
            "security": "open",
            "duration": durations.short,
            "badgeWeightedVote": true},
        "sendERC20Token":{
            "security": "open",
            "duration": durations.short,
            "badgeWeightedVote": true},
        "approveNFT": {
            "security": "open",
            "duration": durations.short,
            "badgeWeightedVote": true},
        "approveERC20Token": {
            "security": "open",
            "duration": durations.short,
            "badgeWeightedVote": true},
        "wildCard": {
            "security": "open",
            "duration": durations.short,
            "badgeWeightedVote": true},
        }
    let minQuorumInPercentmille = 550 // 0.55 %  

    beforeEach(async function(){
        [Alice, Bob, Charlie, Dave] = await ethers.getSigners()  
         
        let MajorityWithtokenFactory = await ethers.getContractFactory("MajorityVoteWithTokenQuorumAndOptionalDVGuard")
        let majorityWithToken: MajorityVoteWithTokenQuorumAndOptionalDVGuard = await MajorityWithtokenFactory.connect(Alice).deploy()
        await majorityWithToken.deployed()

        let MajorityWithoutTokenFactory = await ethers.getContractFactory("PlainMajorityVote")
        let majorityWithoutToken: PlainMajorityVote = await MajorityWithoutTokenFactory.connect(Alice).deploy()
        await majorityWithoutToken.deployed()

        let SnapshotFactory = await ethers.getContractFactory("SimpleSnapshotWithoutToken")
        let snapshot: SimpleSnapshotWithoutToken = await SnapshotFactory.connect(Alice).deploy()
        await snapshot.deployed()   
        
        let RegistryFactory = await ethers.getContractFactory("VotingRegistry")
        let registry: VotingRegistry = await RegistryFactory.connect(Alice).deploy(IVOTINGCONTRACT_ID)
        await registry.deployed() 
        
        let ERC20Factory = await ethers.getContractFactory("DummyToken")
        let token: DummyToken = await ERC20Factory.connect(Alice).deploy()
        await token.deployed() 
        
        let ERC721Factory = await ethers.getContractFactory("DummyNFT")
        let nft: DummyNFT = await ERC721Factory.connect(Alice).deploy()
        await nft.deployed() 

        let BadgeFactory = await ethers.getContractFactory("PlaygroundVotingBadge")
        const playgroundMockup = await ethers.getContractAt("VotingPlayground", ethers.constants.AddressZero);
        playgroundInterface = playgroundMockup.interface;

        
        let flagAndSelectors : Array<string> = []
        let votingContracts : Array<string> = []
        let minDurations : Array<number> = []
        let minQuorumInPercentmilles : Array<number> = []
        let badgeWeightedVote : Array<boolean> = []

        let functions = Object.keys(types)
        for (let i=0; i<functions.length; i++){
            let fct : string = functions[i].toString();
            flagAndSelectors.push(
                (types[fct].security=="secure" ? "0x01": "0x00") + playgroundInterface.getSighash(fct).slice(2,)
            )
            votingContracts.push(
                types[fct].badgeWeightedVote ? majorityWithToken.address : majorityWithoutToken.address
            )
            badgeWeightedVote.push(types[fct].badgeWeightedVote as boolean)
            if (types[fct].duration)
            minDurations.push(types[fct].duration as number)
            minQuorumInPercentmilles.push(minQuorumInPercentmille)
        }

        let deployArguments = abi.encode(["string", "string"],["Playground Voting Badge", "PLAY"])
        let rawByteCode = BadgeFactory.bytecode + deployArguments.slice(2,);
        console.log(deployArguments)

        let PlaygroundFactory = await ethers.getContractFactory("VotingPlayground")
        let playground: VotingPlayground = await PlaygroundFactory.connect(Alice).deploy(
            registry.address,
            flagAndSelectors,
            votingContracts,
            minDurations,
            minQuorumInPercentmilles,
            badgeWeightedVote,
            abi.encode(["uint256"], [666]),
            rawByteCode
        )
        // )
        await playground.deployed()
        
        let badge = await ethers.getContractAt("PlaygroundVotingBadge", await playground.badges(0));
        
        contracts = {
            majorityWithToken,
            majorityWithoutToken,
            snapshot,
            playground,
            registry,
            badge,
            nft,
            token
        }
    })

    describe("Deployment", function(){
        it("Should print stuff", async function(){
            // let wildcardId = playgroundInterface.getSighash("wildCard")
            // console.log(wildcardId)
            // // console.log(bla);
            // let bytecode = "0x60806040526000805534801561001457600080fd5b50610226806100246000396000f3fe6080604052600436106100345760003560e01c806358116a0d146100395780637cf5dab014610064578063e5aa3d5814610080575b600080fd5b34801561004557600080fd5b5061004e6100ab565b60405161005b919061012a565b60405180910390f35b61007e600480360381019061007991906100ee565b6100b1565b005b34801561008c57600080fd5b506100956100d3565b6040516100a2919061012a565b60405180910390f35b60015481565b806000808282546100c29190610145565b925050819055503460018190555050565b60005481565b6000813590506100e8816101d9565b92915050565b600060208284031215610104576101036101d4565b5b6000610112848285016100d9565b91505092915050565b6101248161019b565b82525050565b600060208201905061013f600083018461011b565b92915050565b60006101508261019b565b915061015b8361019b565b9250827fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff038211156101905761018f6101a5565b5b828201905092915050565b6000819050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b600080fd5b6101e28161019b565b81146101ed57600080fd5b5056fea2646970667358221220e13d8d58ff67f5e6d4441f6546aaa11eb5142c7ad0e58185c0cb2a8393f82a6064736f6c63430008070033"
            // let salt = "0x0000000000000000000000000000000000000000000000000000000000000001"
            // let address = "0xd8b934580fcE35a11B58C6D73aDeE468a2833fa8"
            // let flag = "0xff"
            // let hashedBytecode = ethers.utils.keccak256(bytecode)
            // let concatenatedPacked = ethers.utils.solidityPack(
            //     ["bytes1", "address", "bytes32", "bytes32"], 
            //     [flag, address, salt, hashedBytecode])
            // let predictedAddress = ethers.utils.keccak256(concatenatedPacked)
            // console.log(predictedAddress)
        })
    })
})