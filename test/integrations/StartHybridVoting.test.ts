import { expect } from "chai";
import { Result } from "ethers/lib/utils";
import { ContractReceipt, BigNumber } from "ethers";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { IVOTINGCONTRACT_ID, IERC165_ID } from "../../scripts/interfaceIds";

import {
    StartHybridVotingMinmlExample,
    StartHybridVotingHooksExample,
    StartOnlyCallbackMinmlExample,
    StartOnlyCallbackHooksExample,
    StartSimpleVotingMinmlExample,
    StartSimpleVotingHooksExample,
    MajorityVoteWithTokenQuorumAndOptionalDVGuard,
    PlainMajorityVote,
    SimpleSnapshotWithoutToken,
    DummyToken
} from "../../typechain"

import { StartHybridVotingMinmlExampleInterface } from "../../typechain/StartHybridVotingMinmlExample";


interface Contracts {
    integrationHybridMinml: StartHybridVotingMinmlExample,
    integrationHybridHooks: StartHybridVotingHooksExample,
    integrationCallbackMinml: StartOnlyCallbackMinmlExample,
    integrationCallbackHooks: StartOnlyCallbackHooksExample,
    integrationSimpleMinml: StartSimpleVotingMinmlExample,
    integrationSimpleHooks: StartSimpleVotingHooksExample,
    majority: PlainMajorityVote,
    majorityWithToken: MajorityVoteWithTokenQuorumAndOptionalDVGuard,
    snapshot: SimpleSnapshotWithoutToken
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
let ABSTAIN = abi.encode(["uint256"],[2])
let ALSOABSTAIN = abi.encode(["uint256"],[39])

let ONEETH = ethers.utils.parseEther("1.0")

let VOTING_DURATION_ARGUMENT : number = 432000;  // 5 days




describe("Integration Through Starting a Hybrid Voting Instance", function() {
    let incrementCalldata: string;
    let resetCalldata: string;
    let contracts: Contracts;
    let integrationInterface: StartHybridVotingMinmlExampleInterface;
    let votingDurationMajorityWithToken: number = VOTING_DURATION_ARGUMENT;
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

        let MajorityWithTokenFactory = await ethers.getContractFactory("MajorityVoteWithTokenQuorumAndOptionalDVGuard")
        let majorityWithToken: MajorityVoteWithTokenQuorumAndOptionalDVGuard = await MajorityWithTokenFactory.connect(Alice).deploy()
        await majorityWithToken.deployed()

        let SnapshotFactory = await ethers.getContractFactory("SimpleSnapshotWithoutToken")
        let snapshot: SimpleSnapshotWithoutToken = await SnapshotFactory.connect(Alice).deploy()
        await snapshot.deployed()
        votingDurationSnapshot = (await snapshot.VOTING_DURATION()).toNumber()
        
        let IntegrationHybridMinmlFactory = await ethers.getContractFactory("StartHybridVotingMinmlExample")
        let integrationHybridMinml: StartHybridVotingMinmlExample = await IntegrationHybridMinmlFactory.connect(Alice).deploy(`${snapshot.address}`, `${majority.address}`)
        await integrationHybridMinml.deployed();

        let IntegrationHybridHooksFactory = await ethers.getContractFactory("StartHybridVotingHooksExample")
        let integrationHybridHooks: StartHybridVotingHooksExample = await IntegrationHybridHooksFactory.connect(Alice).deploy(`${snapshot.address}`, `${majority.address}`)
        await integrationHybridHooks.deployed();

        let IntegrationCallbacksMinmlFactory = await ethers.getContractFactory("StartOnlyCallbackMinmlExample")
        let integrationCallbackMinml: StartOnlyCallbackMinmlExample = await IntegrationCallbacksMinmlFactory.connect(Alice).deploy(`${majority.address}`, `${majorityWithToken.address}`)
        await integrationCallbackMinml.deployed();

        let IntegrationCallbacksHooksFactory = await ethers.getContractFactory("StartOnlyCallbackHooksExample")
        let integrationCallbackHooks: StartOnlyCallbackHooksExample = await IntegrationCallbacksHooksFactory.connect(Alice).deploy(`${majority.address}`, `${majorityWithToken.address}`)
        await integrationCallbackHooks.deployed();
         
        let IntegrationSimpleMinmlFactory = await ethers.getContractFactory("StartSimpleVotingMinmlExample")
        let integrationSimpleMinml: StartSimpleVotingMinmlExample = await IntegrationSimpleMinmlFactory.connect(Alice).deploy(`${majority.address}`)
        await integrationSimpleMinml.deployed();

        let IntegrationSimpleHooksFactory = await ethers.getContractFactory("StartSimpleVotingHooksExample")
        let integrationSimpleHooks: StartSimpleVotingHooksExample = await IntegrationSimpleHooksFactory.connect(Alice).deploy(`${snapshot.address}`, `${majority.address}`)
        await integrationSimpleHooks.deployed();

        let DummyTokenFactory = await ethers.getContractFactory("DummyToken")
        let token: DummyToken = await DummyTokenFactory.connect(Alice).deploy()
        await token.deployed()

        // mint some tokens to Alice, Bob, Charlie and Dave
        await token.connect(Alice).mint(ONEETH.mul(100))
        await token.connect(Bob).mint(ONEETH.mul(100))
        await token.connect(Charlie).mint(ONEETH.mul(100))
        await token.connect(Dave).mint(ONEETH.mul(100))
        
        integrationInterface = integrationHybridMinml.interface
        incrementCalldata = integrationInterface.encodeFunctionData("increment")
        resetCalldata = integrationInterface.encodeFunctionData("reset", [0])
        contracts =  {
            majority,
            majorityWithToken,
            snapshot,
            token,
            integrationHybridMinml,
            integrationHybridHooks,
            integrationCallbackMinml,
            integrationCallbackHooks,
            integrationSimpleMinml,
            integrationSimpleHooks}
    })

    describe("Deployment", function(){
        it("Should instantiate the counter variable of both integration contracts to zero.", async function(){
            expect(await contracts.integrationHybridMinml.i()).to.equal(0)
            expect(await contracts.integrationHybridHooks.i()).to.equal(0)
            expect(await contracts.integrationCallbackMinml.i()).to.equal(0)
            expect(await contracts.integrationCallbackHooks.i()).to.equal(0)
            expect(await contracts.integrationSimpleMinml.i()).to.equal(0)
            expect(await contracts.integrationSimpleHooks.i()).to.equal(0)
        })
        it("Should instantiate the deployer of the integration contract.", async function(){
            expect(await contracts.integrationSimpleMinml.deployer()).to.equal(Alice.address)
            expect(await contracts.integrationSimpleHooks.deployer()).to.equal(Alice.address)
            expect(await contracts.integrationHybridMinml.deployer()).to.equal(Alice.address)
            expect(await contracts.integrationHybridHooks.deployer()).to.equal(Alice.address)
            expect(await contracts.integrationCallbackMinml.deployer()).to.equal(Alice.address)
            expect(await contracts.integrationCallbackHooks.deployer()).to.equal(Alice.address)
        })
        it("Should instantiate the number of instances of the contract with hooks to zero.", async function(){
            expect(await contracts.integrationSimpleHooks.numberOfInstances()).to.equal(0)  
            expect(await contracts.integrationHybridHooks.numberOfInstances()).to.equal(0)
            expect(await contracts.integrationCallbackHooks.numberOfInstances()).to.equal(0)  
        })
    });
    describe("Counter Increment", function() {
        it("Should revert when trying to increment the counter when the integration targets it.", async function(){
            await expect(contracts.integrationHybridMinml.connect(Alice).increment()).to.be.revertedWith(`'OnlyVoteImplementer("${Alice.address}")'`);
            await expect(contracts.integrationHybridHooks.connect(Alice).increment()).to.be.revertedWith(`'OnlyVoteImplementer("${Alice.address}")'`);
            await expect(contracts.integrationCallbackMinml.connect(Alice).increment()).to.be.revertedWith(`'OnlyVoteImplementer("${Alice.address}")'`);
            await expect(contracts.integrationCallbackHooks.connect(Alice).increment()).to.be.revertedWith(`'OnlyVoteImplementer("${Alice.address}")'`);
        })
        it("Should not revert when trying to increment the counter when the integration does not targets it.", async function(){
            await expect(contracts.integrationSimpleMinml.connect(Alice).increment()).to.not.be.reverted
            await expect(contracts.integrationSimpleHooks.connect(Alice).increment()).to.not.be.reverted
        })
        it("Should revert when trying to reset the counter unless the deployer does it.", async function(){
            // for the minimal integration
            let newStartingValue : number = 99;
            await expect(contracts.integrationSimpleMinml.connect(Bob).reset(newStartingValue)).to.be.revertedWith('Only deployer');
            await expect(contracts.integrationHybridMinml.connect(Bob).reset(newStartingValue)).to.be.revertedWith('Only deployer or by vote');
            await expect(contracts.integrationCallbackMinml.connect(Bob).reset(newStartingValue)).to.be.revertedWith('Only deployer or by vote');
            await contracts.integrationSimpleMinml.connect(Alice).reset(newStartingValue)
            await contracts.integrationHybridMinml.connect(Alice).reset(newStartingValue)
            await contracts.integrationCallbackMinml.connect(Alice).reset(newStartingValue)
            expect(await contracts.integrationSimpleMinml.i()).to.equal(newStartingValue)
            expect(await contracts.integrationHybridMinml.i()).to.equal(newStartingValue)
            expect(await contracts.integrationCallbackMinml.i()).to.equal(newStartingValue)
            // for the integration with hooks
            await expect(contracts.integrationSimpleHooks.connect(Bob).reset(newStartingValue)).to.be.revertedWith('Only deployer');
            await expect(contracts.integrationHybridHooks.connect(Bob).reset(newStartingValue)).to.be.revertedWith('Only deployer or by vote');
            await expect(contracts.integrationCallbackHooks.connect(Bob).reset(newStartingValue)).to.be.revertedWith('Only deployer or by vote');
            await contracts.integrationSimpleHooks.connect(Alice).reset(newStartingValue)
            await contracts.integrationHybridHooks.connect(Alice).reset(newStartingValue)
            await contracts.integrationCallbackHooks.connect(Alice).reset(newStartingValue)
            expect(await contracts.integrationSimpleHooks.i()).to.equal(newStartingValue)
            expect(await contracts.integrationHybridHooks.i()).to.equal(newStartingValue)
            expect(await contracts.integrationCallbackHooks.i()).to.equal(newStartingValue)
        })
    })
    describe("Start a voting instance", function() {
        it("Should revert when non-deployer attempts to start the instance", async function(){
            await expect(contracts.integrationHybridMinml.connect(Bob).start("0x", "0x")).to.be.revertedWith('Only deployer')
            await expect(contracts.integrationHybridHooks.connect(Bob).start("0x", "0x")).to.be.revertedWith('Only deployer')
        });
        it("Should create a new voting instance without reference to a target function", async function(){
            // check whether the number of instances has increased
            await contracts.integrationHybridMinml.connect(Alice).start("0x", "0x")
            expect(await contracts.snapshot.getCurrentIndex()).to.equal(1)
            await contracts.integrationHybridHooks.connect(Alice).start("0x", '0x000001')
            expect(await contracts.integrationHybridHooks.numberOfInstances()).to.equal(1)
            expect(await contracts.snapshot.getCurrentIndex()).to.equal(2)
        });
        it("Should create a new voting instance for increment and reset", async function(){
            // check whether the number of instances has increased
            let expectReturnFlag : boolean = true;
            let votingParamsForMinml : string = abi.encode(["address", "bool"], [contracts.integrationHybridMinml.address, expectReturnFlag])
            let votingParamsForHooks : string = abi.encode(["address", "bool"], [contracts.integrationHybridHooks.address, expectReturnFlag])
            await contracts.integrationHybridMinml.connect(Alice).start(votingParamsForMinml, incrementCalldata)
            expect(await contracts.majority.getCurrentIndex()).to.equal(1)
            await contracts.integrationHybridMinml.connect(Alice).start(votingParamsForHooks, incrementCalldata)
            expect(await contracts.majority.getCurrentIndex()).to.equal(2)
            await contracts.integrationHybridMinml.connect(Alice).start(votingParamsForMinml, resetCalldata)
            expect(await contracts.majority.getCurrentIndex()).to.equal(3)
            await contracts.integrationHybridMinml.connect(Alice).start(votingParamsForHooks, resetCalldata)
            expect(await contracts.majority.getCurrentIndex()).to.equal(4)
        });
        it("Should revert when the the voting params bytes are too short or in unfitting format", async function(){
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
        it("Should not revert when the voting params overflow but fit on the first required slots.", async function(){
            // check whether the number of instances has increased
            let badParams4 : string = abi.encode(["address", "bool", "uint256"], [contracts.integrationHybridMinml.address, true, 100])
            await contracts.integrationHybridMinml.connect(Alice).start(badParams4, incrementCalldata)
            expect(await contracts.majority.getCurrentIndex()).to.equal(1)
            await contracts.integrationHybridHooks.connect(Alice).start(badParams4, incrementCalldata)
            expect(await contracts.majority.getCurrentIndex()).to.equal(2)
        });
    });
    describe("Voting Outcome", function(){
        
        beforeEach(async function(){
            let expectReturnFlag : boolean = false;
            let votingParamsForMinml : string = abi.encode(["address", "bool"], [contracts.integrationHybridMinml.address, expectReturnFlag])
            let votingParamsForHooks : string = abi.encode(["address", "bool"], [contracts.integrationHybridHooks.address, expectReturnFlag])
            await contracts.integrationHybridMinml.connect(Alice).start(votingParamsForMinml, incrementCalldata)
            await contracts.integrationHybridHooks.connect(Alice).start(votingParamsForHooks, incrementCalldata)
            let timestamp = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
            await contracts.majority.connect(Alice).vote(0,APPROVE)
            await contracts.majority.connect(Alice).vote(1,APPROVE)
            await ethers.provider.send('evm_setNextBlockTimestamp', [timestamp + votingDurationMajority + 1]); 
        })
        it("Should increment the counter after a successful vote", async function(){
            await contracts.majority.connect(Alice).implement(0, incrementCalldata)
            expect(await contracts.integrationHybridMinml.i()).to.equal(1)
            await contracts.majority.connect(Alice).implement(1, incrementCalldata)
            expect(await contracts.integrationHybridHooks.i()).to.equal(1)
        })
    })
})