import { expect } from "chai";
import { Result } from "ethers/lib/utils";
import { ContractReceipt, BigNumber } from "ethers";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { IVOTINGCONTRACT_ID, IERC165_ID } from "../../scripts/interfaceIds";

import {
    StartHybridVotingMinmlExample,
    StartHybridVotingHooksExample,
    PlainMajorityVote,
    SimpleSnapshotWithoutToken
} from "../../typechain"

import { StartHybridVotingMinmlExampleInterface } from "../../typechain/StartHybridVotingMinmlExample";


interface Contracts {
    integrationMinml: StartHybridVotingMinmlExample,
    integrationHooks: StartHybridVotingHooksExample,
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
let ABSTAIN = abi.encode(["uint256"],[2])
let ALSOABSTAIN = abi.encode(["uint256"],[39])






describe("Integration Through Starting a Hybrid Voting Instance", function() {
    let incrementCalldata: string;
    let resetCalldata: string;
    let contracts: Contracts;
    let integrationInterface: StartHybridVotingMinmlExampleInterface;
    let votingDurationMajority: number;
    let votingDurationSnapshot: number;
    let Alice: SignerWithAddress
    let Bob: SignerWithAddress
    let Charlie: SignerWithAddress

    beforeEach(async function(){
        [Alice, Bob, Charlie] = await ethers.getSigners()  
            
        let MajorityFactory = await ethers.getContractFactory("PlainMajorityVote")
        let majority: PlainMajorityVote = await MajorityFactory.connect(Alice).deploy()
        await majority.deployed()
        votingDurationMajority = (await majority.VOTING_DURATION()).toNumber()

        let SnapshotFactory = await ethers.getContractFactory("SimpleSnapshotWithoutToken")
        let snapshot: SimpleSnapshotWithoutToken = await SnapshotFactory.connect(Alice).deploy()
        await snapshot.deployed()
        votingDurationSnapshot = (await snapshot.VOTING_DURATION()).toNumber()
        
        let IntegrationMinmlFactory = await ethers.getContractFactory("StartHybridVotingMinmlExample")
        let integrationMinml: StartHybridVotingMinmlExample = await IntegrationMinmlFactory.connect(Alice).deploy(`${snapshot.address}`, `${majority.address}`)
        await integrationMinml.deployed();

        let IntegrationHooksFactory = await ethers.getContractFactory("StartHybridVotingHooksExample")
        let integrationHooks: StartHybridVotingHooksExample = await IntegrationHooksFactory.connect(Alice).deploy(`${snapshot.address}`, `${majority.address}`)
        await integrationHooks.deployed();
        
        integrationInterface = integrationMinml.interface
        incrementCalldata = integrationInterface.encodeFunctionData("increment")
        resetCalldata = integrationInterface.encodeFunctionData("reset", [0])
        contracts =  {majority, snapshot, integrationMinml, integrationHooks}
    })

    describe("Deployment", function(){
        it("Should instantiate the counter variable of both integration contracts to zero.", async function(){
            expect(await contracts.integrationMinml.i()).to.equal(0)
            expect(await contracts.integrationHooks.i()).to.equal(0)
        })
        it("Should instantiate the deployer of the integration contract.", async function(){
            expect(await contracts.integrationMinml.deployer()).to.equal(Alice.address)
            expect(await contracts.integrationHooks.deployer()).to.equal(Alice.address)
        })
        it("Should instantiate the number of instances of the contract with hooks to zero.", async function(){
            expect(await contracts.integrationHooks.numberOfInstances()).to.equal(0)    
        })
    });
    describe("Counter Increment", function() {
        it("Should revert when trying to increment the counter", async function(){
            await expect(contracts.integrationMinml.connect(Alice).increment()).to.be.revertedWith(`'OnlyVoteImplementer("${Alice.address}")'`);
            await expect(contracts.integrationHooks.connect(Alice).increment()).to.be.revertedWith(`'OnlyVoteImplementer("${Alice.address}")'`);
        })
        it("Should revert when trying to reset the counter unless the deployer does it.", async function(){
            // for the minimal integration
            await expect(contracts.integrationMinml.connect(Bob).reset(99)).to.be.revertedWith('Only deployer or by vote');
            await contracts.integrationMinml.connect(Alice).reset(99)
            expect(await contracts.integrationMinml.i()).to.equal(99)
            // for the integration with hooks
            await expect(contracts.integrationHooks.connect(Bob).reset(99)).to.be.revertedWith('Only deployer or by vote');
            await contracts.integrationHooks.connect(Alice).reset(99)
            expect(await contracts.integrationHooks.i()).to.equal(99)
        })
    })
    describe("Start a voting instance", function() {
        it("Should revert when non-deployer attempts to start the instance", async function(){
            await expect(contracts.integrationMinml.connect(Bob).start("0x", "0x")).to.be.revertedWith('Only deployer')
            await expect(contracts.integrationHooks.connect(Bob).start("0x", "0x")).to.be.revertedWith('Only deployer')
        });
        it("Should create a new voting instance without reference to a target function", async function(){
            // check whether the number of instances has increased
            await contracts.integrationMinml.connect(Alice).start("0x", "0x")
            expect(await contracts.snapshot.getCurrentIndex()).to.equal(1)
            await contracts.integrationHooks.connect(Alice).start("0x", '0x000001')
            expect(await contracts.integrationHooks.numberOfInstances()).to.equal(1)
            expect(await contracts.snapshot.getCurrentIndex()).to.equal(2)
        });
        it("Should create a new voting instance for increment and reset", async function(){
            // check whether the number of instances has increased
            let expectReturnFlag : boolean = true;
            let votingParamsForMinml : string = abi.encode(["address", "bool"], [contracts.integrationMinml.address, expectReturnFlag])
            let votingParamsForHooks : string = abi.encode(["address", "bool"], [contracts.integrationHooks.address, expectReturnFlag])
            await contracts.integrationMinml.connect(Alice).start(votingParamsForMinml, incrementCalldata)
            expect(await contracts.majority.getCurrentIndex()).to.equal(1)
            await contracts.integrationMinml.connect(Alice).start(votingParamsForHooks, incrementCalldata)
            expect(await contracts.majority.getCurrentIndex()).to.equal(2)
            await contracts.integrationMinml.connect(Alice).start(votingParamsForMinml, resetCalldata)
            expect(await contracts.majority.getCurrentIndex()).to.equal(3)
            await contracts.integrationMinml.connect(Alice).start(votingParamsForHooks, resetCalldata)
            expect(await contracts.majority.getCurrentIndex()).to.equal(4)
        });
        it("Should revert when the the voting params bytes are too short or in unfitting format", async function(){
            // check whether the number of instances has increased
            let badParams1 : string = "0x"
            let badParams2 : string = ethers.constants.HashZero
            let badParams3 : string = abi.encode(["address", "uint256"], [contracts.integrationMinml.address, 2])
            await expect(contracts.integrationMinml.connect(Alice).start(badParams1, incrementCalldata)).to.be.reverted
            await expect(contracts.integrationMinml.connect(Alice).start(badParams2, incrementCalldata)).to.be.reverted
            await expect(contracts.integrationMinml.connect(Alice).start(badParams3, incrementCalldata)).to.be.reverted
            await expect(contracts.integrationHooks.connect(Alice).start(badParams1, incrementCalldata)).to.be.reverted
            await expect(contracts.integrationHooks.connect(Alice).start(badParams2, incrementCalldata)).to.be.reverted
            await expect(contracts.integrationHooks.connect(Alice).start(badParams3, incrementCalldata)).to.be.reverted
            });
        it("Should not revert when the voting params overflow but fit on the first required slots.", async function(){
            // check whether the number of instances has increased
            let badParams4 : string = abi.encode(["address", "bool", "uint256"], [contracts.integrationMinml.address, true, 100])
            await contracts.integrationMinml.connect(Alice).start(badParams4, incrementCalldata)
            expect(await contracts.majority.getCurrentIndex()).to.equal(1)
            await contracts.integrationHooks.connect(Alice).start(badParams4, incrementCalldata)
            expect(await contracts.majority.getCurrentIndex()).to.equal(2)
        });
    });
    describe("Voting Outcome", function(){
        
        beforeEach(async function(){
            let expectReturnFlag : boolean = false;
            let votingParamsForMinml : string = abi.encode(["address", "bool"], [contracts.integrationMinml.address, expectReturnFlag])
            let votingParamsForHooks : string = abi.encode(["address", "bool"], [contracts.integrationHooks.address, expectReturnFlag])
            await contracts.integrationMinml.connect(Alice).start(votingParamsForMinml, incrementCalldata)
            await contracts.integrationHooks.connect(Alice).start(votingParamsForHooks, incrementCalldata)
            let timestamp = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
            await contracts.majority.connect(Alice).vote(0,APPROVE)
            await contracts.majority.connect(Alice).vote(1,APPROVE)
            await ethers.provider.send('evm_setNextBlockTimestamp', [timestamp + votingDurationMajority + 1]); 
        })
        it("Should increment the counter after a successful vote", async function(){
            await contracts.majority.connect(Alice).implement(0, incrementCalldata)
            expect(await contracts.integrationMinml.i()).to.equal(1)
            await contracts.majority.connect(Alice).implement(1, incrementCalldata)
            expect(await contracts.integrationHooks.i()).to.equal(1)
        })
    })
})