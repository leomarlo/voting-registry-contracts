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

let DISAPPROVE = abi.encode(["uint256"],[0])
let APPROVE = abi.encode(["uint256"],[1])

describe("Playground", function(){
    let contracts: Contracts;
    let Alice: SignerWithAddress
    let Bob: SignerWithAddress
    let Charlie: SignerWithAddress
    let Dave: SignerWithAddress
    let playgroundInterface : VotingPlaygroundInterface
    let tokenInterface : DummyTokenInterface
    

    let hashedBytecode : string
    let expectedBadgeAddress: string
    let expectedBadgeAddressUint: BigNumber
    let minQuorum = 2 // at least two people need to vote. 550 // 0.55 %  
    let BadgeFactory: PlaygroundVotingBadge__factory
    let ERC20Factory: DummyToken__factory
    beforeEach(async function(){
        [Alice, Bob, Charlie, Dave] = await ethers.getSigners()  
         
        let MajorityWithtokenFactory = await ethers.getContractFactory("MajorityVoteWithNFTQuorumAndOptionalDVGuard")
        let majorityWithNftToken: MajorityVoteWithNFTQuorumAndOptionalDVGuard = await MajorityWithtokenFactory.connect(Alice).deploy()
        await majorityWithNftToken.deployed()

        let MajorityWithoutTokenFactory = await ethers.getContractFactory("PlainMajorityVoteWithQuorum")
        let majorityWithoutToken: PlainMajorityVoteWithQuorum = await MajorityWithoutTokenFactory.connect(Alice).deploy()
        await majorityWithoutToken.deployed()

        let SnapshotFactory = await ethers.getContractFactory("SimpleSnapshotWithoutToken")
        let snapshot: SimpleSnapshotWithoutToken = await SnapshotFactory.connect(Alice).deploy()
        await snapshot.deployed()   
        
        let RegistryFactory = await ethers.getContractFactory("VotingRegistry")
        let registry: VotingRegistry = await RegistryFactory.connect(Alice).deploy(IVOTINGCONTRACT_ID)
        await registry.deployed() 
        
        ERC20Factory = await ethers.getContractFactory("DummyToken")
        let token: DummyToken = await ERC20Factory.connect(Alice).deploy()
        await token.deployed() 
        tokenInterface = token.interface;
        
        let ERC721Factory = await ethers.getContractFactory("DummyNFT")
        let nft: DummyNFT = await ERC721Factory.connect(Alice).deploy()
        await nft.deployed() 
        

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
                types[fct].badgeWeightedVote ? majorityWithNftToken.address : majorityWithoutToken.address
            )
            badgeWeightedVote.push(types[fct].badgeWeightedVote as boolean)
            if (types[fct].duration)
            minDurations.push(types[fct].duration as number)
            minQuorums.push(minQuorum)
        }

        let deployArguments = abi.encode(["string", "string"],["Playground Voting Badge", "PLAY"])
        let rawByteCode = BadgeFactory.bytecode + deployArguments.slice(2,);
        hashedBytecode = keccak256(rawByteCode)

        
        let PlaygroundFactory = await ethers.getContractFactory("VotingPlayground")
        let playground: VotingPlayground 

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
        await playground.connect(Alice).deployNewBadge(ethers.constants.HashZero, rawByteCode, Alice.address)
        let badgeAddress = await playground.badges(0)
        // console.log('address', badgeAddress)
        let badge = await ethers.getContractAt("PlaygroundVotingBadge", badgeAddress);
    
        contracts = {
            majorityWithNftToken,
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
        it("Should instantiate all the public variables", async function(){
            expect(await contracts.playground.badges(0)).to.equal(contracts.badge.address);
            await expect(contracts.playground.deployedContracts(0)).to.be.reverted;
            expect(await contracts.playground.minXpToStartAnything()).to.equal(0)
            expect(await contracts.playground.minXpToStartThisFunction('0x00000000')).to.equal(0)
            let mainBadgeAndAcceptingNft = await contracts.playground.nftAndBadgesInfo()
            expect(mainBadgeAndAcceptingNft.mainBadge).to.equal(0)
            expect(mainBadgeAndAcceptingNft.acceptingNFTs).to.equal(false)
            let counterStruct = await contracts.playground.counter()
            expect(counterStruct.counter).to.equal(0)
            expect(counterStruct.operation).to.equal(0)
            await expect(contracts.playground.offices(0)).to.be.reverted;
            expect(await contracts.playground.getIncumbentFromOffice("doesNotExist")).to.equal(ethers.constants.AddressZero)
            let votingMetaParams = await contracts.playground.votingMetaParams('0x00000000')
            expect(votingMetaParams.minDuration).to.equal(0)
            expect(votingMetaParams.minQuorum).to.equal(0)
            expect(votingMetaParams.minQuorum).to.equal(0)
            expect(votingMetaParams.token).to.equal(ethers.constants.AddressZero)
            expect(await contracts.playground.VOTING_REGISTRY()).to.equal(contracts.registry.address)
            expect(await contracts.playground.donationsBy(ethers.constants.AddressZero)).to.equal(0)
            let analytics = await contracts.playground.analytics()
            expect(analytics.numberOfInstances).to.equal(0)
            expect(analytics.numberOfVotes).to.equal(0)
            expect(analytics.numberOfImplementations).to.equal(0)
            expect(analytics.numberOfSimpleVotingContracts).to.equal(0)
            expect(await contracts.playground.simpleVotingContract(0)).to.equal(ethers.constants.AddressZero)
            expect(await contracts.playground.fixedVotingContract("0x12345678")).to.equal(false)
        })
        it("Should revert any attempt to trigger a function that can be triggered only by vote.", async function(){
            let functions = Object.keys(types)
            await expect(contracts.playground.connect(Alice).changeMetaParameters('0x00000000',0,0,ethers.constants.AddressZero))
                .to.be.revertedWith(`OnlyVoteImplementer("${Alice.address}")`) 
            await expect(contracts.playground.connect(Alice).changeAssignedContract('0x00000000',ethers.constants.AddressZero))
                .to.be.revertedWith(`OnlyVoteImplementer("${Alice.address}")`) 
            await expect(contracts.playground.connect(Alice).setMainBadge(0))
                .to.be.revertedWith(`OnlyVoteImplementer("${Alice.address}")`)
            await expect(contracts.playground.connect(Alice).setMinXpToStartAnything(0))
                .to.be.revertedWith(`OnlyVoteImplementer("${Alice.address}")`)
            await expect(contracts.playground.connect(Alice).setMinXpToStartThisFunction('0x00000000',0))
                .to.be.revertedWith(`OnlyVoteImplementer("${Alice.address}")`) 
            await expect(contracts.playground.connect(Alice).setEnableTradingThreshold(0))
                .to.be.revertedWith(`OnlyVoteImplementer("${Alice.address}")`) 
            await expect(contracts.playground.connect(Alice).setTradingEnabledGlobally(true))
                .to.be.revertedWith(`OnlyVoteImplementer("${Alice.address}")`)  
            await expect(contracts.playground.connect(Alice).setAcceptingNFTs(true))
                .to.be.revertedWith(`OnlyVoteImplementer("${Alice.address}")`) 
            await expect(contracts.playground.connect(Alice).changeCounter(0))
                .to.be.revertedWith(`OnlyVoteImplementer("${Alice.address}")`) 
            await expect(contracts.playground.connect(Alice).changeOperation(0))
                .to.be.revertedWith(`OnlyVoteImplementer("${Alice.address}")`) 
            await expect(contracts.playground.connect(Alice).newIncumbent("",ethers.constants.AddressZero))
                .to.be.revertedWith(`OnlyVoteImplementer("${Alice.address}")`)  
            await expect(contracts.playground.connect(Alice).deployNewBadge(ethers.constants.HashZero, "0x",ethers.constants.AddressZero))
                .to.be.revertedWith(`OnlyVoteImplementer("${Alice.address}")`) 
            await expect(contracts.playground.connect(Alice).deployNewContract(ethers.constants.HashZero, "0x"))
                .to.be.revertedWith(`OnlyVoteImplementer("${Alice.address}")`) 
            await expect(contracts.playground.connect(Alice).sendNFT(ethers.constants.AddressZero, ethers.constants.AddressZero, ethers.constants.AddressZero, 1))
                .to.be.revertedWith(`OnlyVoteImplementer("${Alice.address}")`) 
            await expect(contracts.playground.connect(Alice).approveNFT(ethers.constants.AddressZero, ethers.constants.AddressZero, 1,0))
                .to.be.revertedWith(`OnlyVoteImplementer("${Alice.address}")`) 
            await expect(contracts.playground.connect(Alice).approveERC20Token(ethers.constants.AddressZero, ethers.constants.AddressZero, 1))
                .to.be.revertedWith(`OnlyVoteImplementer("${Alice.address}")`)
            await expect(contracts.playground.connect(Alice).wildCard(ethers.constants.AddressZero, ethers.constants.AddressZero, 0))
                .to.be.revertedWith(`OnlyVoteImplementer("${Alice.address}")`)
        })
        it("Should calculate the token it", async function(){
            let randomNumber = BigNumber.from("2452614324145145234512446909")
            let sigHash = playgroundInterface.getSighash("start")
            let tokenId = ethers.utils.solidityPack(
                ["bytes4", "bytes12", "bytes4", "bytes12"],
                [
                    "0x" + abi.encode(["uint256"],[randomNumber]).slice(-8,), 
                    Alice.address.slice(0,26),
                    sigHash,
                    contracts.badge.address.slice(0,26)])
            let computedTokenId = await contracts.playground.calculateId(randomNumber, sigHash, contracts.badge.address, Alice.address)
            expect(computedTokenId.toHexString()).to.equal(tokenId)
        })
        it("Sould get the assigned contract.", async function(){
            let selector = playgroundInterface.getSighash("changeCounter")
            expect(await contracts.playground.getAssignedContract(selector)).to.equal(contracts.majorityWithNftToken.address)
        })
    })
    describe("Start, vote and Implement", function(){
        let changeCounterSig : string 
        let expectReturnValue : boolean = false;
        let guardOnSenderVotingDataOrNone: number = 2;
        let callback : string
        let counterVotingMetaParams: [BigNumber, BigNumber, string] & {
            minDuration: BigNumber;
            minQuorum: BigNumber;
            token: string;
        }
        let regularVotingParams : string
        let startSigHash: string 
        let voteSigHash: string 
        let implementSigHash: string
        let changeCounterBy: number = 3;
        beforeEach(async function(){
            changeCounterSig = playgroundInterface.getSighash("changeCounter")
            callback = playgroundInterface.encodeFunctionData("changeCounter",[changeCounterBy])
            counterVotingMetaParams = await contracts.playground.votingMetaParams(changeCounterSig)
            regularVotingParams = abi.encode(
                ["address", "uint256", "uint256", "bool", "uint8"],
                [contracts.badge.address, types.changeCounter.duration, minQuorum, expectReturnValue, guardOnSenderVotingDataOrNone])
            startSigHash = playgroundInterface.getSighash("start")
            voteSigHash = playgroundInterface.getSighash("vote")
            implementSigHash = playgroundInterface.getSighash("implement")
        })
        
        it("Should start a new voting instance", async function(){
            expect(counterVotingMetaParams.token).to.equal(contracts.badge.address)
            expect(counterVotingMetaParams.minQuorum).to.equal(minQuorum)
            await expect(contracts.playground.connect(Alice).start(regularVotingParams, callback))
                .to.emit(contracts.majorityWithNftToken, 'VotingInstanceStarted')
                .withArgs(0,contracts.playground.address)
            
            expect(await contracts.badge.balanceOf(Alice.address)).to.equal(2)
            let tokenId = await contracts.playground.calculateId(0, startSigHash, contracts.majorityWithNftToken.address, Alice.address)
            expect(await contracts.badge.ownerOf(tokenId)).to.equal(Alice.address)
        })
        it("Should vote on that voting instance", async function(){
            await contracts.playground.connect(Alice).start(regularVotingParams, callback)
            let identifier = (await contracts.majorityWithNftToken.getCurrentIndex()).toNumber() - 1;
            await contracts.playground.connect(Bob).vote(0, APPROVE)
            expect(await contracts.badge.balanceOfSignature(Bob.address, voteSigHash)).to.equal(1)
            let tokenIdBob = await contracts.playground.calculateId(0, voteSigHash, contracts.majorityWithNftToken.address, Bob.address)
            expect(await contracts.badge.ownerOf(tokenIdBob)).to.equal(Bob.address)
            await contracts.playground.connect(Charlie).vote(0, APPROVE)
            let tokenIdCharlie = await contracts.playground.calculateId(0, voteSigHash, contracts.majorityWithNftToken.address, Charlie.address)
            expect(await contracts.badge.ownerOf(tokenIdCharlie)).to.equal(Charlie.address)
            expect(await contracts.majorityWithNftToken.result(identifier))
                .to.equal(abi.encode(["uint256[3]"],[[0,2,0]]))
        })
        it("Should implement the result", async function(){
            await contracts.playground.connect(Alice).start(regularVotingParams, callback)
            await contracts.playground.connect(Bob).vote(0, APPROVE)
            await contracts.playground.connect(Alice).vote(0, APPROVE)
            let timestamp = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
            let duration : number = types.changeCounter.duration as number
            await ethers.provider.send('evm_setNextBlockTimestamp', [timestamp + duration + 1]); 
            await contracts.playground.connect(Alice).vote(0, APPROVE)
            let identifier = (await contracts.majorityWithNftToken.getCurrentIndex()).toNumber() - 1;
            await contracts.playground.connect(Alice).implement(0, callback)
            let tokenIdAlice = await contracts.playground.calculateId(0, implementSigHash, contracts.majorityWithNftToken.address, Alice.address)
            expect(await contracts.badge.ownerOf(tokenIdAlice)).to.equal(Alice.address)
            expect(await contracts.badge.balanceOfSignature(Alice.address, implementSigHash)).to.equal(1)
            expect((await contracts.playground.counter()).counter).to.equal(changeCounterBy);
        })
        it("Should revert when starting a new voting instance with incorrect token, quorum or duration.", async function(){
            let votingParamsWrongToken = abi.encode(
                ["address", "uint256", "uint256", "bool", "uint8"],
                [contracts.token.address, types.changeCounter.duration, minQuorum, expectReturnValue, guardOnSenderVotingDataOrNone])
            await expect(contracts.playground.connect(Alice).start(votingParamsWrongToken, callback))
                .to.be.revertedWith(`'Invalid Parameters'`)
            let votingParamsWrongDuration = abi.encode(
                ["address", "uint256", "uint256", "bool", "uint8"],
                [contracts.badge.address, types.changeCounter.duration as number - 1, minQuorum, expectReturnValue, guardOnSenderVotingDataOrNone])
            await expect(contracts.playground.connect(Alice).start(votingParamsWrongDuration, callback))
                .to.be.revertedWith(`'Invalid Parameters'`)
            let votingParamsWrongQuorum = abi.encode(
                ["address", "uint256", "uint256", "bool", "uint8"],
                [contracts.badge.address, types.changeCounter.duration, minQuorum - 1, expectReturnValue, guardOnSenderVotingDataOrNone])
            await expect(contracts.playground.connect(Alice).start(votingParamsWrongQuorum, callback))
                .to.be.revertedWith(`'Invalid Parameters'`)
        })
    })
    describe("Write Operations That require Token Weighted Votes", function(){

        let expectReturnValue : boolean = false;
        let guardOnSenderVotingDataOrNone: number = 2;
        let callback : string
        it("Should change Meta Parameters.", async function(){
            let votingParams = abi.encode(
                ["address", "uint256", "uint256", "bool", "uint8"],
                [contracts.badge.address, types.changeMetaParameters.duration, minQuorum, expectReturnValue, guardOnSenderVotingDataOrNone])
            let changeCounterSig = playgroundInterface.getSighash("changeCounter")
            let newDuration: number = 99
            let newQuorum: number = 1
            callback = playgroundInterface.encodeFunctionData(
                "changeMetaParameters",
                [changeCounterSig, newDuration, newQuorum, contracts.badge.address ])
            await contracts.playground.connect(Alice).start(votingParams, callback)
            await contracts.playground.connect(Alice).vote(0, APPROVE)
            await contracts.playground.connect(Bob).vote(0, APPROVE)
            let timestamp = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
            let duration : number = types.changeMetaParameters.duration as number
            await ethers.provider.send('evm_setNextBlockTimestamp', [timestamp + duration + 1]); 
            await contracts.playground.connect(Alice).implement(0, callback)
            expect( await contracts.majorityWithNftToken.getStatus(0)).to.equal(VotingStatus.completed)
            let metaParams = await contracts.playground.votingMetaParams(changeCounterSig)
            expect(metaParams.minDuration.toNumber()).to.equal(newDuration)
            expect(metaParams.minQuorum.toNumber()).to.equal(newQuorum)
        })
        it("Should change assigned voting contract when it's registered.", async function(){
            let duration : number = types.changeAssignedContract.duration as number
            let votingParams = abi.encode(
                ["address", "uint256", "uint256", "bool", "uint8"],
                [contracts.badge.address, duration, minQuorum, expectReturnValue, guardOnSenderVotingDataOrNone])
            let changeCounterSig = playgroundInterface.getSighash("changeCounter")
            expect(await contracts.playground.getAssignedContract(changeCounterSig)).to.equal(contracts.majorityWithNftToken.address)
            callback = playgroundInterface.encodeFunctionData(
                "changeAssignedContract",
                [changeCounterSig, contracts.snapshot.address])
            await contracts.playground.connect(Alice).start(votingParams, callback)
            await contracts.playground.connect(Alice).vote(0, APPROVE)
            let timestamp1 = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
            await ethers.provider.send('evm_setNextBlockTimestamp', [timestamp1 + duration + 1]); 
            await contracts.playground.connect(Alice).implement(0, callback)
            expect(await contracts.majorityWithNftToken.getStatus(0)).to.equal(VotingStatus.failed)
            
            await contracts.playground.connect(Alice).start(votingParams, callback)
            await contracts.playground.connect(Alice).vote(1, APPROVE)
            timestamp1 = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
            await ethers.provider.send('evm_setNextBlockTimestamp', [timestamp1 + duration + 1]); 
            await contracts.registry.register(contracts.snapshot.address, ethers.constants.AddressZero)
            await contracts.playground.connect(Alice).implement(1, callback) 
            expect(await contracts.playground.getAssignedContract(changeCounterSig)).to.equal(contracts.snapshot.address)
            // It should revert when trying to change the assigned contract for a function that must not get a new contract
            let changeMetaParametersSig = playgroundInterface.getSighash("changeMetaParameters")
            callback = playgroundInterface.encodeFunctionData(
                "changeAssignedContract",
                [changeMetaParametersSig, contracts.snapshot.address])
            await contracts.playground.connect(Alice).start(votingParams, callback)
            await contracts.playground.connect(Alice).vote(2, APPROVE)
            timestamp1 = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
            await ethers.provider.send('evm_setNextBlockTimestamp', [timestamp1 + duration + 1]); 
            await contracts.playground.connect(Bob).vote(2, APPROVE)
            expect(await contracts.majorityWithNftToken.getStatus(2)).to.equal(VotingStatus.awaitcall)
            await contracts.playground.connect(Alice).implement(2, callback)
            expect(await contracts.majorityWithNftToken.getStatus(2)).to.equal(VotingStatus.failed)
            
                
        })
        it("Should revert trying to set a new badge that doesn't exist", async function(){
            let duration : number = types.setMainBadge.duration as number
            let votingParams = abi.encode(
                ["address", "uint256", "uint256", "bool", "uint8"],
                [contracts.badge.address, duration, minQuorum, expectReturnValue, guardOnSenderVotingDataOrNone])
            callback = playgroundInterface.encodeFunctionData("setMainBadge",[2])
            await contracts.playground.connect(Alice).start(votingParams, callback)
            await contracts.playground.connect(Alice).vote(0, APPROVE)
            let timestamp1 = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
            await ethers.provider.send('evm_setNextBlockTimestamp', [timestamp1 + duration + 1]); 
            await contracts.playground.connect(Bob).vote(0, APPROVE)
            expect(await contracts.majorityWithNftToken.getStatus(0)).to.equal(VotingStatus.awaitcall)
            await contracts.playground.connect(Alice).implement(0, callback)
            //     .to.be.revertedWith(`'BadgeDoesntExist(${1}, ${1})'`)
            expect(await contracts.majorityWithNftToken.getStatus(0)).to.equal(VotingStatus.awaitcall)
        })
        it("should deploy a new badge and change the main badge.", async function(){
            // deploy new badge
            let duration : number = types.deployNewBadge.duration as number
            let votingParams = abi.encode(
                ["address", "uint256", "uint256", "bool", "uint8"],
                [contracts.badge.address, duration, minQuorum, expectReturnValue, guardOnSenderVotingDataOrNone])
            let salt = abi.encode(["uint256"],[999])
            let deployArguments = abi.encode(["string", "string"],["Playground Voting Badge Number Two", "PLAY2"])
            let rawByteCode = BadgeFactory.bytecode + deployArguments.slice(2,);
            callback = playgroundInterface.encodeFunctionData(
                "deployNewBadge",
                [salt, rawByteCode, Bob.address])
            await contracts.playground.connect(Alice).start(votingParams, callback)
            await contracts.playground.connect(Alice).vote(0, APPROVE)
            let timestamp1 = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
            await ethers.provider.send('evm_setNextBlockTimestamp', [timestamp1 + duration + 1]); 
            await contracts.playground.connect(Bob).vote(0, APPROVE)
            await contracts.playground.connect(Alice).implement(0, callback)
            await expect(contracts.playground.badges(1)).to.not.be.reverted
            let badge2 = await ethers.getContractAt("PlaygroundVotingBadge", await contracts.playground.badges(1))
            expect(await badge2.balanceOf(Bob.address)).to.equal(1)
            expect(await badge2.balanceOf(Alice.address)).to.equal(0)
            // set badge as main badge
            duration = types.setMainBadge.duration as number
            votingParams = abi.encode(
                ["address", "uint256", "uint256", "bool", "uint8"],
                [contracts.badge.address, duration, minQuorum, expectReturnValue, guardOnSenderVotingDataOrNone])
            callback = playgroundInterface.encodeFunctionData("setMainBadge",[1])
            await contracts.playground.connect(Alice).start(votingParams, callback)
            await contracts.playground.connect(Alice).vote(1, APPROVE)
            timestamp1 = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
            await ethers.provider.send('evm_setNextBlockTimestamp', [timestamp1 + duration + 1]); 
            await contracts.playground.connect(Bob).vote(1, APPROVE)
            expect(await contracts.majorityWithNftToken.getStatus(1)).to.equal(VotingStatus.awaitcall)
            await contracts.playground.connect(Alice).implement(1, callback)
            expect(await contracts.majorityWithNftToken.getStatus(1)).to.equal(VotingStatus.completed)
            // await expect(contracts.playground.connect(Alice).start(votingParams, callback))
            //     .to.be.revertedWith('"Not enough badges"')
            
        }) 
        it("Should set min Experience Points to start a new voting instance.", async function(){
            let duration : number = types.setMinXpToStartAnything.duration as number
            let votingParams = abi.encode(
                ["address", "uint256", "uint256", "bool", "uint8"],
                [contracts.badge.address, duration, minQuorum, expectReturnValue, guardOnSenderVotingDataOrNone])
            let newMinXP = 2;
            callback = playgroundInterface.encodeFunctionData(
                "setMinXpToStartAnything", [newMinXP])
            expect(await contracts.playground.minXpToStartAnything()).to.equal(0)
            await contracts.playground.connect(Alice).start(votingParams, callback)
            await contracts.playground.connect(Bob).vote(0, APPROVE)
            await contracts.playground.connect(Charlie).vote(0, APPROVE)
            let timestamp1 = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
            await ethers.provider.send('evm_setNextBlockTimestamp', [timestamp1 + duration + 1]); 
            await contracts.playground.connect(Bob).vote(0, APPROVE)
            expect(await contracts.majorityWithNftToken.getStatus(0)).to.equal(VotingStatus.awaitcall)
            await contracts.playground.connect(Alice).implement(0, callback)
            expect(await contracts.majorityWithNftToken.getStatus(0)).to.equal(VotingStatus.completed)
            expect(await contracts.playground.minXpToStartAnything()).to.equal(newMinXP)
            // check whether Bob is unable to start an instance, but Alice is
            callback = playgroundInterface.encodeFunctionData("changeCounter", [87])
            expect((await contracts.badge.balanceOf(Bob.address)).toNumber()).to.be.lessThan(newMinXP)
            await expect(contracts.playground.connect(Bob).start(votingParams, callback))
                .to.be.revertedWith("'Not enough badges'")
            expect((await contracts.badge.balanceOf(Alice.address)).toNumber()).to.be.greaterThanOrEqual(newMinXP)
            await expect(contracts.playground.connect(Alice).start(votingParams, callback))
                .to.be.not.reverted
            
        })
        it("Should set min Experience Points to start a particular function.", async function(){
            let duration : number = types.setMinXpToStartThisFunction.duration as number
            let votingParams = abi.encode(
                ["address", "uint256", "uint256", "bool", "uint8"],
                [contracts.badge.address, duration, minQuorum, expectReturnValue, guardOnSenderVotingDataOrNone])
            let newMinXP = 3;
            let changeCounterSig = playgroundInterface.getSighash("changeCounter")
            callback = playgroundInterface.encodeFunctionData(
                "setMinXpToStartThisFunction", [changeCounterSig, newMinXP])
            await contracts.playground.connect(Alice).start(votingParams, callback)
            await contracts.playground.connect(Alice).vote(0, APPROVE)
            await contracts.playground.connect(Bob).vote(0, APPROVE)
            let timestamp1 = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
            await ethers.provider.send('evm_setNextBlockTimestamp', [timestamp1 + duration + 1]); 
            await contracts.playground.connect(Alice).implement(0, callback)
            expect(await contracts.majorityWithNftToken.getStatus(0)).to.equal(VotingStatus.completed)
            expect(await contracts.playground.minXpToStartThisFunction(changeCounterSig)).to.equal(newMinXP)
            // check
            callback = playgroundInterface.encodeFunctionData("changeCounter", [87])
            expect((await contracts.badge.balanceOf(Bob.address)).toNumber()).to.be.lessThan(newMinXP)
            await expect(contracts.playground.connect(Bob).start(votingParams, callback))
                .to.be.revertedWith("'Not enough badges'")
            expect((await contracts.badge.balanceOf(Alice.address)).toNumber()).to.be.greaterThanOrEqual(newMinXP)
            await expect(contracts.playground.connect(Alice).start(votingParams, callback))
                .to.be.not.reverted
            
        })
        it("Should set the threshold that enables trading individually and generally.", async function(){
            // transfering badges should not be possible
            let tokenId = await contracts.badge.calculateId(0,playgroundInterface.getSighash("deployNewBadge"), Alice.address, Alice.address)
            expect(await contracts.badge.exists(tokenId)).to.equal(true)
            expect(await contracts.badge.ownerOf(tokenId)).to.equal(Alice.address)
            await expect(contracts.badge.connect(Alice).transferFrom(Alice.address, Bob.address, tokenId))
                .to.be.revertedWith(`'TransferNotAllowed(${tokenId})'`)
            // set trading threshold
            let duration : number = types.setEnableTradingThreshold.duration as number
            let votingParams = abi.encode(
                ["address", "uint256", "uint256", "bool", "uint8"],
                [contracts.badge.address, duration, minQuorum, expectReturnValue, guardOnSenderVotingDataOrNone])
            let newThreshold: number = 6;
            callback = playgroundInterface.encodeFunctionData("setEnableTradingThreshold", [newThreshold])
            expect(await contracts.badge.enableTradingThreshold()).to.equal(0);
            await contracts.playground.connect(Alice).start(votingParams, callback)
            await contracts.playground.connect(Alice).vote(0, APPROVE)
            await contracts.playground.connect(Bob).vote(0, APPROVE)
            let timestamp1 = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
            await ethers.provider.send('evm_setNextBlockTimestamp', [timestamp1 + duration + 1]); 
            await contracts.playground.connect(Bob).vote(0, APPROVE)
            expect(await contracts.majorityWithNftToken.getStatus(0)).to.equal(VotingStatus.awaitcall)
            await contracts.playground.connect(Alice).implement(0, callback)
            expect(await contracts.majorityWithNftToken.getStatus(0)).to.equal(VotingStatus.completed)
            
            expect(await contracts.badge.enableTradingThreshold()).to.equal(newThreshold);
            
            // enable trading globally
            duration = types.setTradingEnabledGlobally.duration as number
            votingParams = abi.encode(
                ["address", "uint256", "uint256", "bool", "uint8"],
                [contracts.badge.address, duration, minQuorum, expectReturnValue, guardOnSenderVotingDataOrNone])
            callback = playgroundInterface.encodeFunctionData("setTradingEnabledGlobally", [true])
            expect(await contracts.badge.tradingEnabledGlobally()).to.equal(false);
            await contracts.playground.connect(Alice).start(votingParams, callback)
            await contracts.playground.connect(Alice).vote(1, APPROVE)
            await contracts.playground.connect(Bob).vote(1, APPROVE)
            timestamp1 = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
            await ethers.provider.send('evm_setNextBlockTimestamp', [timestamp1 + duration + 1]); 
            await contracts.playground.connect(Bob).implement(1, callback)
            expect(await contracts.badge.tradingEnabledGlobally()).to.equal(true);
            // test
            expect((await contracts.badge.balanceOf(Alice.address)).toNumber()).to.be.greaterThanOrEqual(newThreshold)
            await expect(contracts.badge.connect(Alice).transferFrom(Alice.address, Bob.address, tokenId))
                .to.be.not.reverted
            expect(await contracts.badge.ownerOf(tokenId)).to.equal(Bob.address)
        })
        it("Should switch the acceptance of NFTs", async function(){
            // check that NFTs are not accepted
            expect(await contracts.nft.issuedNFTs()).to.equal(0)
            await contracts.nft.connect(Bob).freeMint()
            expect(await contracts.nft.ownerOf(0)).to.equal(Bob.address)
            expect(await contracts.nft.issuedNFTs()).to.equal(1)
            await expect( contracts.nft.connect(Bob)["safeTransferFrom(address,address,uint256)"](Bob.address,contracts.playground.address, 0))
                .to.be.revertedWith("'ERC721: transfer to non ERC721Receiver implementer'")
            // setAcceptingNFTs
            let duration: number = types.setAcceptingNFTs.duration as number
            let votingParams = abi.encode(
                ["address", "uint256", "uint256", "bool", "uint8"],
                [contracts.badge.address, duration, minQuorum, expectReturnValue, guardOnSenderVotingDataOrNone])
            callback = playgroundInterface.encodeFunctionData("setAcceptingNFTs", [true])
            await contracts.playground.connect(Alice).start(votingParams, callback)
            await contracts.playground.connect(Alice).vote(0, APPROVE)
            await contracts.playground.connect(Bob).vote(0, APPROVE)
            let timestamp1 = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
            await ethers.provider.send('evm_setNextBlockTimestamp', [timestamp1 + duration + 1]); 
            await contracts.playground.connect(Bob).implement(0, callback)
            await expect( contracts.nft.connect(Bob)["safeTransferFrom(address,address,uint256)"](Bob.address,contracts.playground.address, 0))
                .to.be.not.reverted
            
        })
        it("Should change the counter.", async function(){
            let duration: number = types.changeCounter.duration as number
            let votingParams = abi.encode(
                ["address", "uint256", "uint256", "bool", "uint8"],
                [contracts.badge.address, duration, minQuorum, expectReturnValue, guardOnSenderVotingDataOrNone])
            let byThisMuch: number = 76;
            let callback = playgroundInterface.encodeFunctionData("changeCounter", [byThisMuch])
            await contracts.playground.connect(Alice).start(votingParams, callback)
            await contracts.playground.connect(Alice).vote(0, APPROVE)
            await contracts.playground.connect(Bob).vote(0, APPROVE)
            let timestamp1 = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
            await ethers.provider.send('evm_setNextBlockTimestamp', [timestamp1 + duration + 1]); 
            await contracts.playground.connect(Bob).implement(0, callback)
            let counter = (await contracts.playground.counter()).counter;
            expect(counter).to.equal(byThisMuch)
        })
        it("Should set a new incumbent for an office.", async function(){
            let duration: number = types.newIncumbent.duration as number
            let votingParams = abi.encode(
                ["address", "uint256", "uint256", "bool", "uint8"],
                [contracts.badge.address, duration, minQuorum, expectReturnValue, guardOnSenderVotingDataOrNone])
            let newOffice: string = "Guru"
            let callback = playgroundInterface.encodeFunctionData("newIncumbent", [newOffice, Bob.address])
            await contracts.playground.connect(Alice).start(votingParams, callback)
            await contracts.playground.connect(Alice).vote(0, APPROVE)
            await contracts.playground.connect(Bob).vote(0, APPROVE)
            let timestamp1 = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
            await ethers.provider.send('evm_setNextBlockTimestamp', [timestamp1 + duration + 1]); 
            await contracts.playground.connect(Bob).implement(0, callback)
            expect(await contracts.playground.getIncumbentFromOffice(newOffice)).to.equal(Bob.address)
            // let offices = await contracts.playground.getOfficesFromAddress(Bob.address)
            // console.log('offices', offices)
            // expect().to.deep.equal([newOffice])
            
        })
        it("Should send nfts.", async function(){
            await contracts.nft.connect(Bob).freeMint()
            expect(await contracts.nft.ownerOf(0)).to.equal(Bob.address)
            await contracts.nft.connect(Bob).transferFrom(Bob.address, contracts.playground.address, 0)
            expect(await contracts.nft.ownerOf(0)).to.equal(contracts.playground.address)
            let duration: number = types.sendNFT.duration as number
            let votingParams = abi.encode(
                ["address", "uint256", "uint256", "bool", "uint8"],
                [contracts.badge.address, duration, minQuorum, expectReturnValue, guardOnSenderVotingDataOrNone])
            let callback = playgroundInterface.encodeFunctionData("sendNFT", [contracts.nft.address,contracts.playground.address, Charlie.address, 0])
            await contracts.playground.connect(Alice).start(votingParams, callback)
            await contracts.playground.connect(Alice).vote(0, APPROVE)
            await contracts.playground.connect(Bob).vote(0, APPROVE)
            let timestamp1 = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
            await ethers.provider.send('evm_setNextBlockTimestamp', [timestamp1 + duration + 1]); 
            await contracts.playground.connect(Bob).implement(0, callback)
            expect(await contracts.nft.ownerOf(0)).to.equal(Charlie.address)
            // expect(await contracts.playground.getIncumbentFromOffice(newOffice)).to.equal(Bob.address)
            
        })
        it("Should send erc20 tokens.", async function(){
            let someEth = ethers.utils.parseEther("1.0").mul(44);
            await contracts.token.connect(Bob).mint(someEth)
            await contracts.token.connect(Bob).transfer(contracts.playground.address, someEth)
            expect(await contracts.token.balanceOf(contracts.playground.address)).to.equal(someEth)
            let duration: number = types.sendERC20Token.duration as number
            let votingParams = abi.encode(
                ["address", "uint256", "uint256", "bool", "uint8"],
                [contracts.badge.address, duration, minQuorum, expectReturnValue, guardOnSenderVotingDataOrNone])
            let callback = playgroundInterface.encodeFunctionData("sendERC20Token", [contracts.token.address, contracts.playground.address, Charlie.address, someEth])
            await contracts.playground.connect(Alice).start(votingParams, callback)
            await contracts.playground.connect(Alice).vote(0, APPROVE)
            await contracts.playground.connect(Bob).vote(0, APPROVE)
            let timestamp1 = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
            await ethers.provider.send('evm_setNextBlockTimestamp', [timestamp1 + duration + 2]); 
            await contracts.playground.connect(Bob).vote(0, APPROVE)
            expect(await contracts.majorityWithNftToken.getStatus(0)).to.equal(VotingStatus.awaitcall)
            await contracts.playground.connect(Bob).implement(0, callback)              
            expect(await contracts.majorityWithNftToken.getStatus(0)).to.equal(VotingStatus.completed)
            expect(await contracts.token.balanceOf(Charlie.address)).to.equal(someEth)
            
            
        })
        it("Should approve NFT", async function(){
            let ApprovalType = {"limitedApproval":0, "unapproveAll":1, "approveAll":2}
            await contracts.nft.connect(Bob).freeMint()
            await contracts.nft.connect(Bob).freeMint()
            await contracts.nft.connect(Bob).freeMint()
            expect(await contracts.nft.ownerOf(0)).to.equal(Bob.address)
            expect(await contracts.nft.ownerOf(1)).to.equal(Bob.address)
            expect(await contracts.nft.ownerOf(2)).to.equal(Bob.address)
            await contracts.nft.connect(Bob).transferFrom(Bob.address, contracts.playground.address, 0)
            await contracts.nft.connect(Bob).transferFrom(Bob.address, contracts.playground.address, 1)
            await contracts.nft.connect(Bob).transferFrom(Bob.address, contracts.playground.address, 2)
            await expect(contracts.nft.connect(Charlie).transferFrom(contracts.playground.address, Alice.address, 0))
                .to.be.revertedWith("'ERC721: transfer caller is not owner nor approved'")
            let duration: number = types.approveNFT.duration as number
            let votingParams = abi.encode(
                ["address", "uint256", "uint256", "bool", "uint8"],
                [contracts.badge.address, duration, minQuorum, expectReturnValue, guardOnSenderVotingDataOrNone])
            let callbackLimited = playgroundInterface.encodeFunctionData("approveNFT", 
                [contracts.nft.address, Charlie.address, 0, ApprovalType.limitedApproval])
            await contracts.playground.connect(Alice).start(votingParams, callbackLimited)
            await contracts.playground.connect(Alice).vote(0, APPROVE)
            await contracts.playground.connect(Bob).vote(0, APPROVE)
            let timestamp = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
            await ethers.provider.send('evm_setNextBlockTimestamp', [timestamp + duration + 1]); 
            await contracts.playground.connect(Bob).implement(0, callbackLimited)
            // now we can transfer from playground away to Alice through a third part (i.e. Charlie)
            await expect(contracts.nft.connect(Charlie).transferFrom(contracts.playground.address, Alice.address, 0))
                .to.be.not.reverted
            expect(await contracts.nft.ownerOf(0)).to.equal(Alice.address)
            // but we cannot transfer the tokenid 1
            await expect(contracts.nft.connect(Charlie).transferFrom(contracts.playground.address, Alice.address, 1))
                .to.be.revertedWith("'ERC721: transfer caller is not owner nor approved'")
            // now we approve all
            let tokenIdDoesntMatterForApproveAll: number = 993993;
            let callbackAll = playgroundInterface.encodeFunctionData("approveNFT", 
                [contracts.nft.address, Charlie.address, tokenIdDoesntMatterForApproveAll, ApprovalType.approveAll])
            await contracts.playground.connect(Alice).start(votingParams, callbackAll)
            await contracts.playground.connect(Alice).vote(1, APPROVE)
            await contracts.playground.connect(Bob).vote(1, APPROVE)
            timestamp = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
            await ethers.provider.send('evm_setNextBlockTimestamp', [timestamp + duration + 1]); 
            await contracts.playground.connect(Bob).implement(1, callbackAll)
            expect(await contracts.majorityWithNftToken.getStatus(1)).to.equal(VotingStatus.completed)
            expect(await contracts.nft.isApprovedForAll(contracts.playground.address, Charlie.address)).to.equal(true)
            
            await expect(contracts.nft.connect(Charlie).transferFrom(contracts.playground.address, Alice.address, 1))
                .to.be.not.reverted
            await expect(contracts.nft.connect(Charlie).transferFrom(contracts.playground.address, Alice.address, 2))
                .to.be.not.reverted
            // now we unApprove everything
            await contracts.nft.connect(Alice).transferFrom(Alice.address, contracts.playground.address, 1)
            await contracts.nft.connect(Alice).transferFrom(Alice.address, contracts.playground.address, 2)
            let callbackUnapproveAll = playgroundInterface.encodeFunctionData("approveNFT", 
                [contracts.nft.address, Charlie.address, tokenIdDoesntMatterForApproveAll, ApprovalType.unapproveAll])
            await contracts.playground.connect(Alice).start(votingParams, callbackUnapproveAll)
            await contracts.playground.connect(Alice).vote(2, APPROVE)
            await contracts.playground.connect(Bob).vote(2, APPROVE)
            timestamp = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
            await ethers.provider.send('evm_setNextBlockTimestamp', [timestamp + duration + 1]); 
            await contracts.playground.connect(Bob).implement(2, callbackUnapproveAll)
            expect(await contracts.majorityWithNftToken.getStatus(2)).to.equal(VotingStatus.completed)
            expect(await contracts.nft.isApprovedForAll(contracts.playground.address, Charlie.address)).to.equal(false)
            await expect(contracts.nft.connect(Charlie).transferFrom(contracts.playground.address, Alice.address, 1))
                .to.be.reverted
            await expect(contracts.nft.connect(Charlie).transferFrom(contracts.playground.address, Alice.address, 2))
                .to.be.reverted
                
            // approveNFT(address token, address spender, uint256 tokenId, ApprovalTypes approvalType)
            // "approveERC20Token": 
            // "wildCard": {
        })
        it("should approve ERC20 tokens", async function(){
            let someEth = ethers.utils.parseEther("1.0").mul(44);
            await contracts.token.connect(Bob).mint(someEth)
            await contracts.token.connect(Bob).transfer(contracts.playground.address, someEth)
            await expect( contracts.token.connect(Charlie).transferFrom(contracts.playground.address, Alice.address,someEth.div(2)))
                .to.be.revertedWith("'ERC20: insufficient allowance'")
            let duration: number = types.approveERC20Token.duration as number
            let votingParams = abi.encode(
                ["address", "uint256", "uint256", "bool", "uint8"],
                [contracts.badge.address, duration, minQuorum, expectReturnValue, guardOnSenderVotingDataOrNone])
            let callback = playgroundInterface.encodeFunctionData("approveERC20Token", 
                [contracts.token.address, Charlie.address, someEth.div(2)])
            await contracts.playground.connect(Alice).start(votingParams, callback)
            await contracts.playground.connect(Alice).vote(0, APPROVE)
            await contracts.playground.connect(Bob).vote(0, APPROVE)
            let timestamp = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
            await ethers.provider.send('evm_setNextBlockTimestamp', [timestamp + duration + 1]); 
            await contracts.playground.connect(Bob).implement(0, callback)
            await expect( contracts.token.connect(Charlie).transferFrom(contracts.playground.address, Alice.address,someEth.div(2)))
                .to.be.not.reverted     
            await expect( contracts.token.connect(Charlie).transferFrom(contracts.playground.address, Alice.address,someEth.div(2)))
                .to.be.revertedWith("'ERC20: insufficient allowance'")
           
        })
        it("Should make a wildcard transaction.", async function(){
            let tip = ethers.utils.parseEther("1.5")
            let someEth = ethers.utils.parseEther("1.0").mul(44);
            const tx = await Alice.sendTransaction({
                to: contracts.playground.address,
                value: tip
            });
            await tx.wait()
            expect(await ethers.provider.getBalance(contracts.playground.address)).to.equal(tip)
            
            let calldata = tokenInterface.encodeFunctionData("mint",[someEth])
            let duration: number = types.wildCard.duration as number
            let votingParams = abi.encode(
                ["address", "uint256", "uint256", "bool", "uint8"],
                [contracts.badge.address, duration, minQuorum, expectReturnValue, guardOnSenderVotingDataOrNone])
            let callback = playgroundInterface.encodeFunctionData("wildCard", 
                [contracts.token.address, calldata, tip.mul(2)])
            await contracts.playground.connect(Alice).start(votingParams, callback)
            await contracts.playground.connect(Alice).vote(0, APPROVE)
            await contracts.playground.connect(Bob).vote(0, APPROVE)
            let timestamp = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
            await ethers.provider.send('evm_setNextBlockTimestamp', [timestamp + duration + 1]); 
            await contracts.playground.connect(Bob).implement(0, callback, {"value": tip})
            // expect that tokens worth someEth have been minted and the token contract now holds tip * 2 in actual Eth
            expect(await ethers.provider.getBalance(contracts.token.address)).to.equal(tip.mul(2))
            expect(await contracts.token.balanceOf(contracts.playground.address)).to.equal(someEth)
        })
    })
    describe("Write Operations that do not require token Weighted Votes", function(){

        let expectReturnValue : boolean = false;
        let guardOnSenderVotingDataOrNone: number = 2;
        let callback : string
        this.beforeEach(async function(){
          
            let durationtemp: number = types.newIncumbent.duration as number
            let votingParamsTemp = abi.encode(
                ["address", "uint256", "uint256", "bool", "uint8"],
                [contracts.badge.address, durationtemp, minQuorum, expectReturnValue, guardOnSenderVotingDataOrNone])
            let newOffice: string = "Guru"
            let anotheroffice: string = "Priest"
            let callbackGuru = playgroundInterface.encodeFunctionData("newIncumbent", [newOffice, Alice.address])
            let callbackPriest = playgroundInterface.encodeFunctionData("newIncumbent", [anotheroffice, Bob.address])
            await contracts.playground.connect(Charlie).start(votingParamsTemp, callbackGuru)
            await contracts.playground.connect(Charlie).start(votingParamsTemp, callbackPriest)
            await contracts.playground.connect(Charlie).vote(0, APPROVE)
            await contracts.playground.connect(Charlie).vote(1, APPROVE)
            await contracts.playground.connect(Bob).vote(0, APPROVE)
            await contracts.playground.connect(Bob).vote(1, APPROVE)
            let timestampTemp = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
            await ethers.provider.send('evm_setNextBlockTimestamp', [timestampTemp + durationtemp + 4]); 
            
            await contracts.playground.connect(Bob).implement(0, callbackGuru)
            await contracts.playground.connect(Bob).implement(1, callbackPriest)  
        })
        it("Should deploy a new Contract", async function(){

            let duration: number = types.deployNewContract.duration as number
            let salt = abi.encode(["uint256"],[1001920]);
            let votingParams = abi.encode(
                ["address", "uint256", "uint256", "bool"],
                [contracts.playground.address, minQuorum, duration,  expectReturnValue])
            callback = playgroundInterface.encodeFunctionData("deployNewContract", 
                [salt, ERC20Factory.bytecode])
            expect(await contracts.playground.getAssignedContract(callback.slice(0,10))).to.equal(contracts.majorityWithoutToken.address)
            await contracts.playground.connect(Alice).start(votingParams, callback)
            await contracts.majorityWithoutToken.connect(Alice).vote(0, APPROVE)
            await contracts.majorityWithoutToken.connect(Bob).vote(0, APPROVE)
            let timestamp = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
            await ethers.provider.send('evm_setNextBlockTimestamp', [timestamp + duration + 1]); 
            await contracts.playground.connect(Charlie).implement(2, callback)
            expect(await contracts.majorityWithoutToken.getStatus(0)).to.equal(VotingStatus.completed)
            // check whether the dummy token has been deployed
            let predictedToken = await ethers.getContractAt("DummyToken", await contracts.playground.deployedContracts(0))
            expect(await predictedToken.name()).to.equal("DummyToken")
        })
        it("Should change the increment operation.", async function(){
            const Operation = {add:0, subtract:1, divide:2, multiply:3, modulo:4, exponentiate:5}
            let duration: number = types.changeOperation.duration as number
            let votingParams = abi.encode(
                ["address", "uint256", "uint256", "bool"],
                [contracts.playground.address, minQuorum, duration,  expectReturnValue])
            callback = playgroundInterface.encodeFunctionData("changeOperation",[Operation.divide])
            expect(await contracts.playground.getAssignedContract(callback.slice(0,10))).to.equal(contracts.majorityWithoutToken.address)
            await contracts.playground.connect(Alice).start(votingParams, callback)
            await contracts.majorityWithoutToken.connect(Alice).vote(0, APPROVE)
            await contracts.majorityWithoutToken.connect(Bob).vote(0, APPROVE)
            let timestamp = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
            await ethers.provider.send('evm_setNextBlockTimestamp', [timestamp + duration + 1]); 
            await contracts.playground.connect(Charlie).implement(2, callback)
            expect(await contracts.majorityWithoutToken.getStatus(0)).to.equal(VotingStatus.completed)
            expect((await contracts.playground.counter()).operation).to.equal(Operation.divide)
            
        })
    })
    
})