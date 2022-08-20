import { expect } from "chai";
import { Result } from "ethers/lib/utils";
import { ContractReceipt, BigNumber } from "ethers";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { IVOTINGCONTRACT_ID, IERC165_ID } from "../../scripts/interfaceIds";

import {
    StartVoteAndImplementHybridVotingHooksExample,
    StartVoteAndImplementHybridVotingMinmlExample,
    PlainMajorityVote,
    SimpleSnapshotWithoutToken
} from "../../typechain"

import { StartVoteAndImplementHybridVotingMinmlExampleInterface } from "../../typechain/StartVoteAndImplementHybridVotingMinmlExample";

interface Contracts {
    integrationHybridMinml: StartVoteAndImplementHybridVotingMinmlExample,
    integrationHybridHooks: StartVoteAndImplementHybridVotingHooksExample,
    majority: PlainMajorityVote,
    snapshot: SimpleSnapshotWithoutToken
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


describe("Integration through starting, voting and implementing a Hybrid Voting Instance", function() {
    let incrementCalldata: string;
    let resetCalldata: string;
    let contracts: Contracts;
    let integrationInterface: StartVoteAndImplementHybridVotingMinmlExampleInterface;
    let votingDurationMajority: number;
    let votingDurationSnapshot: number;
    let Alice: SignerWithAddress
    let Bob: SignerWithAddress
    let Charlie: SignerWithAddress
    let Dave: SignerWithAddress

    beforeEach(async function(){
        [Alice, Bob, Charlie, Dave] = await ethers.getSigners()  
            
        let MajorityFactory = await ethers.getContractFactory("PlainMajorityVote")
        let majority: PlainMajorityVote = await MajorityFactory.connect(Alice).deploy()
        await majority.deployed()
        votingDurationMajority = (await majority.VOTING_DURATION()).toNumber()

        let SnapshotFactory = await ethers.getContractFactory("SimpleSnapshotWithoutToken")
        let snapshot: SimpleSnapshotWithoutToken = await SnapshotFactory.connect(Alice).deploy()
        await snapshot.deployed()
        votingDurationSnapshot = (await snapshot.VOTING_DURATION()).toNumber()
        
        let IntegrationHybridMinmlFactory = await ethers.getContractFactory("StartVoteAndImplementHybridVotingMinmlExample")
        let integrationHybridMinml: StartVoteAndImplementHybridVotingMinmlExample = await IntegrationHybridMinmlFactory
            .connect(Alice).deploy(`${snapshot.address}`, `${majority.address}`)
        await integrationHybridMinml.deployed();

        let IntegrationHybridHooksFactory = await ethers.getContractFactory("StartVoteAndImplementHybridVotingHooksExample")
        let integrationHybridHooks: StartVoteAndImplementHybridVotingHooksExample = await IntegrationHybridHooksFactory
            .connect(Alice).deploy(`${snapshot.address}`, `${majority.address}`)
        await integrationHybridHooks.deployed();

  
        integrationInterface = integrationHybridMinml.interface
        incrementCalldata = integrationInterface.encodeFunctionData("increment")
        resetCalldata = integrationInterface.encodeFunctionData("reset", [0])
        contracts =  {
            majority,
            snapshot,
            integrationHybridMinml,
            integrationHybridHooks}
    })

    describe("Deployment", async function(){
        
        it("Should instantiate the counter variable of both integration contracts to zero.", async function(){
            expect(await contracts.integrationHybridMinml.i()).to.equal(0);
            expect(await contracts.integrationHybridHooks.i()).to.equal(0);
        })
        it("Should instantiate the deployer of the integration contract.", async function(){
            expect(await contracts.integrationHybridMinml.deployer()).to.equal(Alice.address);
            expect(await contracts.integrationHybridHooks.deployer()).to.equal(Alice.address);
        })
        it("Should instantiate the number of instances, votes and implements to zero.", async function(){
            expect(await contracts.integrationHybridMinml.votes()).to.equal(0);
            expect(await contracts.integrationHybridHooks.votes()).to.equal(0);
            expect(await contracts.integrationHybridMinml.implementations()).to.equal(0);
            expect(await contracts.integrationHybridHooks.implementations()).to.equal(0);
            expect(await contracts.integrationHybridHooks.numberOfInstances()).to.equal(0);
        })
    })
    describe("Counter Increment and Reset", function() {
        it("Should revert when trying to increment the counter not through a vote.", async function(){
            await expect(contracts.integrationHybridMinml.connect(Alice).increment()).to.be.revertedWith(`'OnlyVoteImplementer("${Alice.address}")'`);
            await expect(contracts.integrationHybridHooks.connect(Alice).increment()).to.be.revertedWith(`'OnlyVoteImplementer("${Alice.address}")'`);    
        })
        it("Should revert when trying to reset the counter unless the deployer does it.", async function(){
            let newStartingValue : number = 99;
            await expect(contracts.integrationHybridMinml.connect(Bob).reset(newStartingValue)).to.be.revertedWith('Only deployer');
            await expect(contracts.integrationHybridHooks.connect(Bob).reset(newStartingValue)).to.be.revertedWith('Only deployer or by vote');
            await contracts.integrationHybridMinml.connect(Alice).reset(newStartingValue)
            await contracts.integrationHybridHooks.connect(Alice).reset(newStartingValue)
            expect(await contracts.integrationHybridMinml.i()).to.equal(newStartingValue)
            expect(await contracts.integrationHybridHooks.i()).to.equal(newStartingValue)
        })
    })
    describe("Start a voting instance", function() {
        it("Should revert when non-deployer attempts to start the instance", async function(){
            await expect(contracts.integrationHybridMinml.connect(Bob).start("0x", "0x")).to.be.revertedWith('Only deployer')
            await expect(contracts.integrationHybridHooks.connect(Bob).start("0x", "0x")).to.be.revertedWith('Only deployer')    
        });
        
        it("Should create a new simple (no target) voting instance for hybrid voting instances", async function(){
            await contracts.integrationHybridMinml.connect(Alice).start("0x", "0x")
            expect(await contracts.snapshot.getCurrentIndex()).to.equal(1)
            // The more advanced integration (with hooks) can launch multiple simple (with no target) voting instances
            await contracts.integrationHybridHooks.connect(Alice).start("0x", '0x000001')
            expect(await contracts.integrationHybridHooks.numberOfInstances()).to.equal(1)
            expect(await contracts.snapshot.getCurrentIndex()).to.equal(2)
        })
        it("Should create a new function-targeted voting instance for the hybrid voting instances.", async function(){
            let majorityVotingParams = abi.encode(["address", "bool"], [ethers.constants.AddressZero, false])
            await contracts.integrationHybridMinml.connect(Alice).start(majorityVotingParams, incrementCalldata)
            expect(await contracts.majority.getCurrentIndex()).to.equal(1)
            await contracts.integrationHybridMinml.connect(Alice).start(majorityVotingParams, resetCalldata)
            expect(await contracts.majority.getCurrentIndex()).to.equal(2)
            // The more advanced integration (with hooks) can launch multiple simple (with no target) voting instances
            await contracts.integrationHybridHooks.connect(Alice).start(majorityVotingParams, incrementCalldata)
            expect(await contracts.integrationHybridHooks.numberOfInstances()).to.equal(1)
            expect(await contracts.majority.getCurrentIndex()).to.equal(3)
            await contracts.integrationHybridHooks.connect(Alice).start(majorityVotingParams, resetCalldata)
            expect(await contracts.integrationHybridHooks.numberOfInstances()).to.equal(2)
            expect(await contracts.majority.getCurrentIndex()).to.equal(4)
        })
        
        
        it("Should revert when the the voting params bytes are too short or in unfitting format (hybrid)", async function(){
            // check whether the number of instances has increased
            let badParams1 : string = "0x"
            let badParams2 : string = ethers.constants.HashZero
            let badParams3 : string = abi.encode(["address", "uint256"], [contracts.integrationHybridMinml.address, 2])
            await expect(contracts.integrationHybridMinml.connect(Alice).start(badParams1, incrementCalldata)).to.be.reverted
            await expect(contracts.integrationHybridMinml.connect(Alice).start(badParams2, incrementCalldata)).to.be.reverted
            await expect(contracts.integrationHybridMinml.connect(Alice).start(badParams3, incrementCalldata)).to.be.reverted
            await expect(contracts.integrationHybridHooks.connect(Alice).start(badParams1, incrementCalldata)).to.be.reverted
            await expect(contracts.integrationHybridHooks.connect(Alice).start(badParams2, incrementCalldata)).to.be.reverted
            await expect(contracts.integrationHybridHooks.connect(Alice).start(badParams3, incrementCalldata)).to.be.reverted
            });
        
        it("Should not revert when the voting params overflow but fit on the first required slots (hybrid).", async function(){
            // check whether the number of instances has increased
            let badParams4 : string = abi.encode(["address", "bool", "uint256"], [contracts.integrationHybridMinml.address, true, 100])
            await contracts.integrationHybridMinml.connect(Alice).start(badParams4, incrementCalldata)
            expect(await contracts.majority.getCurrentIndex()).to.equal(1)
            await contracts.integrationHybridHooks.connect(Alice).start(badParams4, incrementCalldata)
            expect(await contracts.majority.getCurrentIndex()).to.equal(2)
        });
        it("Should revert when the calldata does not point to a votable function.", async function(){
            let badSelector = "0x12345678"
            let majorityVotingParams = abi.encode(["address", "bool"], [ethers.constants.AddressZero, false])
            await expect(contracts.integrationHybridMinml.connect(Alice).start(majorityVotingParams, badSelector))
                .to.be.revertedWith(`IsNotVotableFunction("${badSelector}")`)
            await expect(contracts.integrationHybridHooks.connect(Alice).start(majorityVotingParams, badSelector))
                .to.be.revertedWith(`IsNotVotableFunction("${badSelector}")`)
        })
    });
    describe("Vote", function(){
        beforeEach(async function(){
            
        })
        it("Should cast a vote", async function(){
            let votingParamsForHybridMinml : string = abi.encode(["address", "bool"], [contracts.integrationHybridMinml.address, false])
            let votingParamsForHybridHooks : string = abi.encode(["address", "bool"], [contracts.integrationHybridHooks.address, false])
            
            await expect(contracts.integrationHybridMinml.connect(Alice).start(votingParamsForHybridMinml, incrementCalldata))
                .to.emit(contracts.majority, "VotingInstanceStarted")
                .withArgs(0, contracts.integrationHybridMinml.address)

            expect(await contracts.majority.getStatus(0)).to.equal(VotingStatus.active)
            expect(await contracts.majority.getStatus(1)).to.equal(VotingStatus.inactive)
            await expect(contracts.integrationHybridHooks.connect(Alice).start(votingParamsForHybridHooks, incrementCalldata))
                .to.emit(contracts.majority, "VotingInstanceStarted")
                .withArgs(1, contracts.integrationHybridHooks.address)
            expect(await contracts.majority.getStatus(1)).to.equal(VotingStatus.active)

            expect(await contracts.integrationHybridMinml.votes()).to.equal(0)
            await contracts.integrationHybridMinml.connect(Alice).vote(0, APPROVE)
            expect(await contracts.integrationHybridMinml.votes()).to.equal(1)
            
            expect(await contracts.integrationHybridHooks.votes()).to.equal(0)
            await contracts.integrationHybridHooks.connect(Alice).vote(0, APPROVE)
            expect(await contracts.integrationHybridHooks.votes()).to.equal(1)

            let expectedVotingInstanceId : number = 1
            expect(await contracts.majority.getCurrentIndex()).to.equal(expectedVotingInstanceId + 1)
            expect(await contracts.majority.getStatus(expectedVotingInstanceId)).to.equal(VotingStatus.active)
            expect(await contracts.integrationHybridHooks.votingStatus(0)).to.equal(VotingStatus.active)
        })
    })
    describe("Implement", function(){
        let expectReturnFlag: boolean = false;
        let incrementMinmlId: number
        let incrementHooksId: number
        let resetMinmlId: number
        let resetHooksId: number
        beforeEach(async function(){
            let votingParamsForHybridMinml : string = abi.encode(["address", "bool"], [contracts.integrationHybridMinml.address, expectReturnFlag])
            let votingParamsForHybridHooks : string = abi.encode(["address", "bool"], [contracts.integrationHybridHooks.address, expectReturnFlag])
            incrementMinmlId = 0
            await contracts.integrationHybridMinml.connect(Alice).start(votingParamsForHybridMinml, incrementCalldata)
            resetMinmlId = 1
            await contracts.integrationHybridMinml.connect(Alice).start(votingParamsForHybridMinml, resetCalldata)
            
            incrementHooksId = (await contracts.integrationHybridHooks.numberOfInstances()).toNumber()
            await contracts.integrationHybridHooks.connect(Alice).start(votingParamsForHybridHooks, incrementCalldata)
            resetHooksId = resetMinmlId = (await contracts.integrationHybridHooks.numberOfInstances()).toNumber()
            await contracts.integrationHybridHooks.connect(Alice).start(votingParamsForHybridHooks, resetCalldata)
            
        })
        it("Should implement the function call.", async function(){

            await contracts.integrationHybridMinml.connect(Alice).vote(incrementMinmlId, APPROVE)
            await contracts.integrationHybridHooks.connect(Alice).vote(incrementHooksId, APPROVE)
            await contracts.integrationHybridMinml.connect(Alice).vote(resetMinmlId, APPROVE)
            await contracts.integrationHybridHooks.connect(Alice).vote(resetHooksId, APPROVE)
            
            let timestamp = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
            await ethers.provider.send('evm_setNextBlockTimestamp', [timestamp + votingDurationMajority + 1]); 
            
            // increment counter
            expect(await contracts.integrationHybridMinml.implementations()).to.equal(0)
            await contracts.integrationHybridMinml.connect(Alice).implement(incrementMinmlId, incrementCalldata)
            expect(await contracts.integrationHybridMinml.implementations()).to.equal(1)
            expect(await contracts.integrationHybridMinml.i()).to.equal(1)
    
            expect(await contracts.integrationHybridHooks.implementations()).to.equal(0)
            await contracts.integrationHybridHooks.connect(Alice).implement(incrementHooksId, incrementCalldata)
            expect(await contracts.integrationHybridHooks.implementations()).to.equal(1)
    
            expect(await contracts.integrationHybridHooks.responseStatus(0)).to.equal(true)
            
            // reset counter to zero
            await contracts.integrationHybridMinml.connect(Alice).implement(resetMinmlId, resetCalldata)
            expect(await contracts.integrationHybridMinml.i()).to.equal(0)
            await contracts.integrationHybridHooks.connect(Alice).implement(resetHooksId, resetCalldata)
            expect(await contracts.integrationHybridHooks.i()).to.equal(0)
    
        })
    })
    
})


