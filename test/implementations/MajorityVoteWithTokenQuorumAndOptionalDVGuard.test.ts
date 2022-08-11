import { expect } from "chai";
import { Result } from "ethers/lib/utils";
import { ContractReceipt, BigNumber } from "ethers";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { IVOTINGCONTRACT_ID, IERC165_ID } from "../../scripts/interfaceIds";
import { getEventArgs } from "../../scripts/getEventArgs";

import {
    MajorityVoteWithTokenQuorumAndOptionalDVGuard,
    DummyIntegrator,
    DummyToken
} from "../../typechain"

import { DummyIntegratorInterface } from "../../typechain/DummyIntegrator";

interface Contracts {
    majority: MajorityVoteWithTokenQuorumAndOptionalDVGuard,
    integrator: DummyIntegrator,
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

let VotingGuard = {
    "none": 0,
    "onSender": 1,
    "onVotingData": 2
}

let DISAPPROVE = abi.encode(["uint256"],[0])
let APPROVE = abi.encode(["uint256"],[1])
let ABSTAIN = abi.encode(["uint256"],[2])
let ALSOABSTAIN = abi.encode(["uint256"],[39])

let ONEETH = ethers.utils.parseEther("1.0")

let VOTING_DURATION : number = 5555;

async function startVotingInstance(
    contracts: Contracts,
    signer: SignerWithAddress,
    functionName: string,
    quorumInPercentmilleOfSupply: number,
    expectReturnFlag: boolean,
    guardOnSenderVotingDataOrNone: number): Promise<IdentifierAndTimestamp> 
{

    let votingParams : string = abi.encode(
        ["address", "uint256", "uint256", "bool", "uint8"],
        [
            contracts.token.address,
            VOTING_DURATION,
            quorumInPercentmilleOfSupply,
            expectReturnFlag,
            guardOnSenderVotingDataOrNone
        ])
    let calldata : string
    let integratorInterface = contracts.integrator.interface
    if (functionName=="increment"){
        calldata = integratorInterface.encodeFunctionData("increment")
    } else if (functionName=="incrementWithReturn") {
        calldata = integratorInterface.encodeFunctionData("incrementWithReturn")
    } else if (functionName=="reset") {
        calldata = integratorInterface.encodeFunctionData("reset",[0])
    } else if (functionName=="fail") {
        calldata = integratorInterface.encodeFunctionData("fail")
    } else {
        throw("Function Name does not exist")
    }    
    let tx = await contracts.integrator.connect(signer).start(votingParams, calldata)
    let receipt: ContractReceipt = await tx.wait()

    let timestamp = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
    let events = receipt.events;
    if (events!==undefined){
        let identifierBigNumber: BigNumber;
        [identifierBigNumber] = abi.decode(["uint256", "address"], events[0].data)
        return { identifier: identifierBigNumber.toNumber(), timestamp }
    }
    else {
        throw("Cannot extract event data.")
    }
    // console.log("topics", receipt.events)
    // let identifier: number = getEventArgs(await tx.wait())[0].toNumber()
    
}


describe("Implement a Majority Token-weighted Vote With Quorum and Optional Double Voting Guard", function(){

    let contracts: Contracts;
    let Alice: SignerWithAddress;
    let Bob: SignerWithAddress;
    let Charlie: SignerWithAddress;
    let Dave: SignerWithAddress;
    let integratorInterface : DummyIntegratorInterface;
    let incrementCalldata : string;
    let incrementWithReturnCalldata : string;
    let failCalldata : string;

    beforeEach(async function() {
        [Alice, Bob, Charlie, Dave] = await ethers.getSigners()  
         
        let MajorityFactory = await ethers.getContractFactory("MajorityVoteWithTokenQuorumAndOptionalDVGuard")
        let majority: MajorityVoteWithTokenQuorumAndOptionalDVGuard = await MajorityFactory.connect(Alice).deploy()
        await majority.deployed()
        let IntegratorFactory = await ethers.getContractFactory("DummyIntegrator")
        let integrator: DummyIntegrator = await IntegratorFactory.connect(Alice).deploy(majority.address)
        await integrator.deployed()
        let DummyTokenFactory = await ethers.getContractFactory("DummyToken")
        let token: DummyToken = await DummyTokenFactory.connect(Alice).deploy()
        await token.deployed()
        
        integratorInterface = integrator.interface
        incrementCalldata = integratorInterface.encodeFunctionData("increment")
        incrementWithReturnCalldata = integratorInterface.encodeFunctionData("incrementWithReturn")
        failCalldata = integratorInterface.encodeFunctionData("fail")

        contracts = {token, majority, integrator}
    });



    describe("Deployment", function(){
        
        it("Should check whether the voting contract supports the IERC165 interface.", async function(){
            expect(await contracts.majority.supportsInterface(IVOTINGCONTRACT_ID)).to.equal(true)
            expect(await contracts.majority.supportsInterface(IERC165_ID)).to.equal(true)
        })
        it("Should instantiate the counter variable of the target contract with zero.", async function(){
            expect(await contracts.integrator.i()).to.equal(0)
        })
    });

    describe("Voting Instance", function() {
        let votingParams : string;
        it("Should start a new voting instance with valid votingParams.", async function() { 
            votingParams = abi.encode(
                ["address", "uint256", "uint256", "bool", "bool"],
                [contracts.token.address, VOTING_DURATION,0, false, false])
            expect(await contracts.majority.getCurrentIndex()).to.equal(0)
            await expect(contracts.integrator.connect(Alice).start(votingParams, incrementCalldata))
                .to.emit(contracts.majority,'VotingInstanceStarted')
                .withArgs(0, contracts.integrator.address)
            expect((await contracts.majority.getStatus(0)).toNumber()).to.equal(VotingStatus.active)
            
            expect(await contracts.majority.getCaller(0)).to.equal(contracts.integrator.address)
            expect(await contracts.majority.getCurrentIndex()).to.equal(1)
        });
        it("Should revert when invalid votingParams are passed.", async function() {
            await expect(contracts.integrator.connect(Alice).start("0x", incrementCalldata)).to.be.reverted
            // TODO: Add some more fuzz tests
        });
    });
    describe("Encoding and Decoding", function(){
        let votingParams: string
        let quorumInPercentmilleOfSupply: number = 77777;
        let expectReturnFlag: boolean = true;
        let guardOnSenderVotingDataOrNone: number = VotingGuard.onSender;

        beforeEach(async function(){
            votingParams = abi.encode(
                ["address", "uint256", "uint256", "bool", "uint8"],
                [
                    contracts.token.address,
                    VOTING_DURATION,
                    quorumInPercentmilleOfSupply,
                    expectReturnFlag,
                    guardOnSenderVotingDataOrNone
                ])
        })
        it("Should encode the token address, voting duration, quorum, expectedReturn flag, couble voting guard.", async function(){
            let encodedParameters = await contracts.majority.encodeParameters(
                contracts.token.address, 
                VOTING_DURATION,
                quorumInPercentmilleOfSupply,
                expectReturnFlag,
                guardOnSenderVotingDataOrNone
                )
            expect(encodedParameters).to.equal(votingParams)
        });
        it("Should decode the votingParams correctly.", async function(){
            let decodedParameters = await contracts.majority.decodeParameters(votingParams)
            expect(decodedParameters.token).to.equal(contracts.token.address)
            expect(decodedParameters.duration).to.equal(VOTING_DURATION)
            expect(decodedParameters.quorumInPercentmilleOfSupply).to.equal(quorumInPercentmilleOfSupply)
            expect(decodedParameters.expectReturnValue).to.equal(expectReturnFlag)
            expect(decodedParameters.guardOnSenderVotingDataOrNone).to.equal(guardOnSenderVotingDataOrNone)
        })
    })
    describe("Vote and Results", function() {
        let instanceInfo: IdentifierAndTimestamp;
        let quorumInPercentmilleOfSupply: number = 77777;
        let expectReturnFlag: boolean = false;
        beforeEach(async function() {
            await contracts.token.connect(Alice).mint(ONEETH.mul(100))
            await contracts.token.connect(Bob).mint(ONEETH.mul(100))
            await contracts.token.connect(Charlie).mint(ONEETH.mul(100))
            await contracts.token.connect(Dave).mint(ONEETH.mul(100))
        })
        it("Should vote for, against and abstain and retrieve result.", async function(){
            let guardOnSenderVotingDataOrNone: number = VotingGuard.onSender;
            instanceInfo = await startVotingInstance(
                contracts, 
                Alice, 
                "increment", 
                quorumInPercentmilleOfSupply,
                expectReturnFlag,
                guardOnSenderVotingDataOrNone)
            await contracts.majority.connect(Alice).vote(instanceInfo.identifier, APPROVE)
            expect(await contracts.majority.result(instanceInfo.identifier))
                .to.equal(abi.encode(
                    ["uint256", "uint256", "uint256"],
                    [0, ONEETH.mul(100), 0]))
            await contracts.majority.connect(Bob).vote(instanceInfo.identifier, DISAPPROVE)
            expect(await contracts.majority.result(instanceInfo.identifier))
                .to.equal(abi.encode(
                    ["uint256", "uint256", "uint256"],
                    [ONEETH.mul(100), ONEETH.mul(100), 0]))
            await contracts.majority.connect(Charlie).vote(instanceInfo.identifier, ABSTAIN)
            expect(await contracts.majority.result(instanceInfo.identifier))
                .to.equal(abi.encode(
                    ["uint256", "uint256", "uint256"],
                    [ONEETH.mul(100), ONEETH.mul(100), ONEETH.mul(100)]))
            await contracts.majority.connect(Dave).vote(instanceInfo.identifier, ALSOABSTAIN)
            expect(await contracts.majority.result(instanceInfo.identifier))
                .to.equal(abi.encode(
                    ["uint256", "uint256", "uint256"],
                    [ONEETH.mul(100), ONEETH.mul(100), ONEETH.mul(100).mul(2)]))
        });
        it("Should revert a double voting attempt, when the double voting guard is switched on.", async function(){
            let guardOnSenderVotingDataOrNone: number = VotingGuard.onSender;
            instanceInfo = await startVotingInstance(
                contracts, 
                Alice, 
                "increment", 
                quorumInPercentmilleOfSupply,
                expectReturnFlag,
                guardOnSenderVotingDataOrNone)
            await contracts.majority.connect(Alice).vote(instanceInfo.identifier, APPROVE)
            await expect(contracts.majority.connect(Alice).vote(instanceInfo.identifier, APPROVE))
                .to.be.revertedWith(`'AlreadyVoted(${instanceInfo.identifier}, "${Alice.address}")'`);
        });
        it("Shouldn't revert a double voting attempt, when the double voting guard is switched off.", async function(){
            let guardOnSenderVotingDataOrNone: number = VotingGuard.none;
            instanceInfo = await startVotingInstance(
                contracts, 
                Alice, 
                "increment", 
                quorumInPercentmilleOfSupply,
                expectReturnFlag,
                guardOnSenderVotingDataOrNone)
            await contracts.majority.connect(Alice).vote(instanceInfo.identifier, APPROVE)
            await expect(contracts.majority.connect(Alice).vote(instanceInfo.identifier, APPROVE))
                .to.not.be.reverted
        });
        it("Should revert when voting on an inactive instance (that has not been started yet)", async function(){
            let identifier: number = 999;
            await expect(contracts.majority.connect(Bob).vote(identifier, APPROVE))
                .to.be.revertedWith(`StatusError(${identifier}, ${VotingStatus.inactive})`)

        })
        
    });
    describe("After Deadline - Motion Accepted", function(){
        let instanceInfo: IdentifierAndTimestamp;
        let quorumInPercentmilleOfSupply: number = 77777;
        let expectReturnFlag: boolean = false;
        let guardOnSenderVotingDataOrNone: number = VotingGuard.onSender;
        let AliceFunds : BigNumber = ONEETH.mul(100).mul(4);
        let BobFunds : BigNumber = ONEETH.mul(100);

        beforeEach(async function() {
            await contracts.token.connect(Alice).mint(AliceFunds)
            await contracts.token.connect(Bob).mint(BobFunds)
            instanceInfo = await startVotingInstance(
                contracts, 
                Alice, 
                "increment", 
                quorumInPercentmilleOfSupply,
                expectReturnFlag,
                guardOnSenderVotingDataOrNone)
            await contracts.majority.connect(Alice).vote(instanceInfo.identifier, APPROVE)
            await ethers.provider.send('evm_setNextBlockTimestamp', [instanceInfo.timestamp + VOTING_DURATION + 1]); 
            
        });
        it("Should have an awaiting implementation call ('awaitcall') status when casting another vote.", async()=>{
            expect(AliceFunds.mul(100000).div(AliceFunds.add(BobFunds)).toNumber())
                .to.be.greaterThanOrEqual(quorumInPercentmilleOfSupply)
            expect((await contracts.majority.getStatus(instanceInfo.identifier)).toNumber())
                .to.equal(VotingStatus.active)
            await contracts.majority.connect(Bob).vote(instanceInfo.identifier, APPROVE)
            expect((await contracts.majority.getStatus(instanceInfo.identifier)).toNumber())
                .to.equal(VotingStatus.awaitcall)
        });
        it("Should not allow voting after the status is at awaitcall.", async function(){
            expect(AliceFunds.mul(100000).div(AliceFunds.add(BobFunds)).toNumber())
                .to.be.greaterThanOrEqual(quorumInPercentmilleOfSupply)
            await contracts.majority.connect(Bob).vote(instanceInfo.identifier, APPROVE)
            expect((await contracts.majority.getStatus(instanceInfo.identifier)).toNumber())
                .to.equal(VotingStatus.awaitcall)
            await expect(contracts.majority.connect(Bob).vote(instanceInfo.identifier, APPROVE))
                .to.be.revertedWith(`StatusError(${instanceInfo.identifier}, ${VotingStatus.awaitcall})`)
        })
    });
    describe("After Deadline - Motion Disapproved or Tie", function() {
        let instanceInfo: IdentifierAndTimestamp;
        let quorumInPercentmilleOfSupply: number = 77777;
        let expectReturnFlag: boolean = false;
        let guardOnSenderVotingDataOrNone: number = VotingGuard.onSender;
        let AliceFunds : BigNumber = ONEETH.mul(100).mul(8);
        let BobFunds : BigNumber = ONEETH.mul(100);
        let CharlieFunds : BigNumber = ONEETH.mul(100);

        beforeEach(async function() {
            await contracts.token.connect(Alice).mint(AliceFunds)
            await contracts.token.connect(Bob).mint(BobFunds)
            await contracts.token.connect(Charlie).mint(CharlieFunds)
            instanceInfo = await startVotingInstance(
                contracts, 
                Alice, 
                "increment", 
                quorumInPercentmilleOfSupply,
                expectReturnFlag,
                guardOnSenderVotingDataOrNone)
        });
        it("Should have a failed status when casting a vote on a disapproved motion that meets the quorum.", async()=>{
            await contracts.majority.connect(Alice).vote(instanceInfo.identifier, DISAPPROVE)
            await ethers.provider.send('evm_setNextBlockTimestamp', [instanceInfo.timestamp + VOTING_DURATION + 1]); 
            expect((await contracts.majority.getStatus(instanceInfo.identifier)).toNumber())
                .to.equal(VotingStatus.active)
            await contracts.majority.connect(Bob).vote(instanceInfo.identifier, APPROVE)
            expect((await contracts.majority.getStatus(instanceInfo.identifier)).toNumber())
                .to.equal(VotingStatus.failed)
        });
        it("Should have a failed status when casting a vote on a tied motion that meets the quorum.", async()=>{
            await contracts.majority.connect(Alice).vote(instanceInfo.identifier, ABSTAIN)
            await contracts.majority.connect(Bob).vote(instanceInfo.identifier, APPROVE)
            await contracts.majority.connect(Charlie).vote(instanceInfo.identifier, DISAPPROVE)
            await ethers.provider.send('evm_setNextBlockTimestamp', [instanceInfo.timestamp + VOTING_DURATION + 1]); 
            expect((await contracts.majority.getStatus(instanceInfo.identifier)).toNumber())
                .to.equal(VotingStatus.active)
            await contracts.majority.connect(Bob).vote(instanceInfo.identifier, APPROVE)
            expect((await contracts.majority.getStatus(instanceInfo.identifier)).toNumber())
                .to.equal(VotingStatus.failed)
        });
        it("Should have a failed status when the quorum is not reached", async function(){
            expect(BobFunds.mul(100000).div(AliceFunds.add(BobFunds).add(CharlieFunds)).toNumber())
                .to.be.lessThan(quorumInPercentmilleOfSupply)
            await contracts.majority.connect(Bob).vote(instanceInfo.identifier, APPROVE)
            await ethers.provider.send('evm_setNextBlockTimestamp', [instanceInfo.timestamp + VOTING_DURATION + 1]); 
            expect((await contracts.majority.getStatus(instanceInfo.identifier)).toNumber())
                .to.equal(VotingStatus.active)
            await contracts.majority.connect(Bob).vote(instanceInfo.identifier, APPROVE)
            expect((await contracts.majority.getStatus(instanceInfo.identifier)).toNumber())
                .to.equal(VotingStatus.failed)
        })
        it("Should not allow voting after the status is failed.", async function(){
            await contracts.majority.connect(Alice).vote(instanceInfo.identifier, DISAPPROVE)
            await ethers.provider.send('evm_setNextBlockTimestamp', [instanceInfo.timestamp + VOTING_DURATION + 1]); 
            expect((await contracts.majority.getStatus(instanceInfo.identifier)).toNumber())
                .to.equal(VotingStatus.active)
            await contracts.majority.connect(Bob).vote(instanceInfo.identifier, APPROVE)
            expect((await contracts.majority.getStatus(instanceInfo.identifier)).toNumber())
                .to.equal(VotingStatus.failed)
            await expect(contracts.majority.connect(Bob).vote(instanceInfo.identifier, APPROVE))
                .to.be.revertedWith(`StatusError(${instanceInfo.identifier}, ${VotingStatus.failed})`)
        })

    });
    describe("Implement - Before Deadline", function(){
        it("Should revert when calling implement.", async()=>{
            let integratorInterface : DummyIntegratorInterface = contracts.integrator.interface
            let calldata = integratorInterface.encodeFunctionData("increment")
            let instanceInfo = await startVotingInstance(contracts, Alice, "increment", 0, false, VotingGuard.none)
            await expect(contracts.majority.connect(Alice).implement(instanceInfo.identifier, calldata))
                .to.be.revertedWith(`'ImplementingNotPermitted(${instanceInfo.identifier}, ${VotingStatus.active})'`)
        });
    });
    describe("Implement - After Deadline", function(){
        it("Should revert when providing the wrong callback data.",async function(){
            await contracts.token.connect(Alice).mint(ONEETH)
            let instanceInfo = await startVotingInstance(contracts, Alice, "increment", 0, false, VotingGuard.onSender)
            await contracts.majority.connect(Alice).vote(instanceInfo.identifier, APPROVE)
            await ethers.provider.send('evm_setNextBlockTimestamp', [instanceInfo.timestamp + VOTING_DURATION + 1]); 
            await expect( contracts.majority.implement(instanceInfo.identifier, failCalldata))
                .to.be.revertedWith(`'InvalidCalldata()'`)            
        })
    })
    describe("Implement - After Deadline and Approved Motion", function(){
        let instanceInfoIncrementDontExpectReturnFlag: IdentifierAndTimestamp;
        let instanceInfoIncrementExpectReturnFlag: IdentifierAndTimestamp;
        let instanceInfoIncrementWithReturn: IdentifierAndTimestamp;
        let instanceInfoFail: IdentifierAndTimestamp;
        beforeEach(async function() {
            let guardOnSenderVotingDataOrNone: number = VotingGuard.onSender;
            await contracts.token.connect(Alice).mint(ONEETH)
            instanceInfoIncrementDontExpectReturnFlag = await startVotingInstance(contracts, Alice, "increment", 0, false, guardOnSenderVotingDataOrNone)
            instanceInfoIncrementExpectReturnFlag = await startVotingInstance(contracts, Alice, "increment", 0, true, guardOnSenderVotingDataOrNone)
            instanceInfoIncrementWithReturn = await startVotingInstance(contracts, Alice, "incrementWithReturn", 0, true, guardOnSenderVotingDataOrNone)
            instanceInfoFail = await startVotingInstance(contracts, Alice, "fail", 0, false, guardOnSenderVotingDataOrNone)
            await contracts.majority.vote(instanceInfoIncrementDontExpectReturnFlag.identifier, APPROVE)
            await contracts.majority.vote(instanceInfoIncrementExpectReturnFlag.identifier, APPROVE)
            await contracts.majority.vote(instanceInfoIncrementWithReturn.identifier, APPROVE)
            await contracts.majority.vote(instanceInfoFail.identifier, APPROVE)
            await ethers.provider.send('evm_setNextBlockTimestamp', [instanceInfoFail.timestamp + VOTING_DURATION + 1]);  
        });

        it("When not expecting a function response: counter ++; status complete; emit event.", async function(){
            expect(await contracts.integrator.i()).to.equal(0)
            expect((await contracts.majority.getStatus(instanceInfoIncrementDontExpectReturnFlag.identifier)).toNumber())
                .to.equal(VotingStatus.active)
            await expect(contracts.majority.connect(Alice)
                            .implement(instanceInfoIncrementDontExpectReturnFlag.identifier, incrementCalldata))
                .to.emit(contracts.majority,'Implemented')
                .withArgs(instanceInfoIncrementDontExpectReturnFlag.identifier)
            expect(await contracts.integrator.i()).to.equal(1)
            expect((await contracts.majority.getStatus(instanceInfoIncrementDontExpectReturnFlag.identifier)).toNumber())
                .to.equal(VotingStatus.completed)
        });

        it("When expecting and receiving a function response: counter ++; status complete; emit event.", async function(){
            expect(await contracts.integrator.i()).to.equal(0)
            expect((await contracts.majority.getStatus(instanceInfoIncrementWithReturn.identifier)).toNumber())
                .to.equal(VotingStatus.active)
            await expect(contracts.majority.connect(Alice)
                            .implement(instanceInfoIncrementWithReturn.identifier, incrementWithReturnCalldata))
                .to.emit(contracts.majority,'Implemented')
                .withArgs(instanceInfoIncrementWithReturn.identifier)
            expect(await contracts.integrator.i()).to.equal(1)
            expect((await contracts.majority.getStatus(instanceInfoIncrementWithReturn.identifier)).toNumber())
                .to.equal(VotingStatus.completed)
        });
        it("Should revert when expecting a function response and not receiving one.", async function (){
            expect(await contracts.integrator.i()).to.equal(0)
            expect((await contracts.majority.getStatus(instanceInfoIncrementExpectReturnFlag.identifier)).toNumber())
                .to.equal(VotingStatus.active)
            await expect(contracts.majority.implement(instanceInfoIncrementExpectReturnFlag.identifier, incrementCalldata))
                .to.be 
                .revertedWith(`'ExpectedReturnError(${instanceInfoIncrementExpectReturnFlag.identifier})'`);
            expect(await contracts.integrator.i()).to.equal(0)
            expect((await contracts.majority.getStatus(instanceInfoIncrementExpectReturnFlag.identifier)).toNumber())
                .to.equal(VotingStatus.active)
        });
        it ("Should change status to failed and emit event when making an unsuccessful call.", async function(){
            let unknownSelector : string = "0x12345678"
            let votingParams : string = abi.encode(
                ["address", "uint256", "uint256", "bool", "bool"],
                [contracts.token.address, VOTING_DURATION, 0, false, true])
            let tx = await contracts.integrator.connect(Alice).start(votingParams, unknownSelector)
            let receipt: ContractReceipt = await tx.wait()
            let timestamp = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
            let events = receipt.events;
            let identifier : number = 0;
            if (events!==undefined){
                let identifierBigNumber: BigNumber;
                [identifierBigNumber] = abi.decode(["uint256", "address"], events[0].data)
                identifier =  identifierBigNumber.toNumber()
            }
            await contracts.majority.vote(identifier, APPROVE)
            await ethers.provider.send('evm_setNextBlockTimestamp', [timestamp + VOTING_DURATION + 1]);  
            expect((await contracts.majority.getStatus(identifier)).toNumber())
                .to.equal(VotingStatus.active)
            await expect( contracts.majority.implement(identifier, unknownSelector))
                .to.emit(contracts.majority, 'NotImplemented')
                .withArgs(identifier)
            expect((await contracts.majority.getStatus(identifier)).toNumber())
                .to.equal(VotingStatus.failed)
            
        })
        it ("Should revert when the target function reverts.", async function(){
            expect(await contracts.integrator.i()).to.equal(0)
            expect((await contracts.majority.getStatus(instanceInfoFail.identifier)).toNumber())
                .to.equal(VotingStatus.active)
            await expect(contracts.majority.connect(Alice).implement(instanceInfoFail.identifier, failCalldata))
                .to.be.reverted
            expect(await contracts.integrator.i()).to.equal(0)
            expect((await contracts.majority.getStatus(instanceInfoFail.identifier)).toNumber())
                .to.equal(VotingStatus.active)
        });
        // it("Should allow attempting another implementation after previous reversion")
        it("Should revert an implementation when the status is already marked completed.", async function() {
            await contracts.majority.implement(instanceInfoIncrementWithReturn.identifier, incrementWithReturnCalldata)
            expect((await contracts.majority.getStatus(instanceInfoIncrementWithReturn.identifier)).toNumber())
                .to.equal(VotingStatus.completed)
            await expect(contracts.majority.implement(instanceInfoIncrementWithReturn.identifier, incrementWithReturnCalldata))
                .to.be.revertedWith(`'ImplementingNotPermitted(${instanceInfoIncrementWithReturn.identifier}, ${VotingStatus.completed})'`)
        });
        it("Should revert an implementation when the status is already marked failed.", async function(){
            let unknownSelector : string = "0x12345678"
            let votingParams : string = abi.encode(
                ["address", "uint256", "uint256", "bool", "bool"],
                [contracts.token.address, VOTING_DURATION, 0, false, true])
            let tx = await contracts.integrator.connect(Alice).start(votingParams, unknownSelector)
            let receipt: ContractReceipt = await tx.wait()
            let timestamp = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
            let events = receipt.events;
            let identifier : number = 0;
            if (events!==undefined){
                let identifierBigNumber: BigNumber;
                [identifierBigNumber] = abi.decode(["uint256", "address"], events[0].data)
                identifier =  identifierBigNumber.toNumber()
            }
            await contracts.majority.vote(identifier, APPROVE)
            await ethers.provider.send('evm_setNextBlockTimestamp', [timestamp + VOTING_DURATION + 1]);  
            await contracts.majority.implement(identifier, unknownSelector)
            expect((await contracts.majority.getStatus(identifier)).toNumber())
                .to.equal(VotingStatus.failed)
            await expect(contracts.majority.implement(identifier, unknownSelector))
                .to.be
                .revertedWith(`'ImplementingNotPermitted(${identifier}, ${VotingStatus.failed})'`)
        });
        it("Should allow another implementation attempt when a previous one was reverted.", async function(){
            await expect(contracts.majority.connect(Alice).implement(instanceInfoFail.identifier, failCalldata))
                .to.be.reverted
            await contracts.integrator.increment();
            expect(await contracts.integrator.i()).to.equal(1)
            expect((await contracts.majority.getStatus(instanceInfoIncrementExpectReturnFlag.identifier)).toNumber())
                .to.equal(VotingStatus.active)
            await expect(contracts.majority.connect(Alice).implement(instanceInfoFail.identifier, failCalldata))
                .to.emit(contracts.majority, 'Implemented')
                .withArgs(instanceInfoFail.identifier)
            
            expect(await contracts.integrator.i()).to.equal(2)
            expect((await contracts.majority.getStatus(instanceInfoFail.identifier)).toNumber())
                .to.equal(VotingStatus.completed)
        });
        it("Should not allow voting after a completed status.", async function(){
            await contracts.majority.implement(instanceInfoIncrementWithReturn.identifier, incrementWithReturnCalldata)
            expect((await contracts.majority.getStatus(instanceInfoIncrementWithReturn.identifier)).toNumber())
                .to.equal(VotingStatus.completed)
            await expect(contracts.majority.vote(instanceInfoIncrementWithReturn.identifier, APPROVE))
                .to.be.revertedWith(`'StatusError(${instanceInfoIncrementWithReturn.identifier}, ${VotingStatus.completed})'`)
        })
    });
    describe("Implement - After Deadline and Dismissed Motion", function(){
        it("Should revert when attempting to implement the motion.", async function(){
            let guardOnSenderVotingDataOrNone: number = VotingGuard.onSender;
            await contracts.token.connect(Alice).mint(ONEETH)
            let instanceInfo = await startVotingInstance(contracts, Alice, "increment", 0, false, guardOnSenderVotingDataOrNone)
            await contracts.majority.connect(Alice).vote(instanceInfo.identifier, DISAPPROVE)
            await ethers.provider.send('evm_setNextBlockTimestamp', [instanceInfo.timestamp + VOTING_DURATION + 1]);  
            expect((await contracts.majority.getStatus(instanceInfo.identifier)).toNumber())
                .to.equal(VotingStatus.active)
            await expect( contracts.majority.implement(instanceInfo.identifier, incrementCalldata))
                .to.be.revertedWith(`'ImplementingNotPermitted(${instanceInfo.identifier}, ${VotingStatus.active})'`)            
        })
    })
});