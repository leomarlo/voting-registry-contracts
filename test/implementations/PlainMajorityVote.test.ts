import { expect } from "chai";
import { Result } from "ethers/lib/utils";
import { ContractReceipt, BigNumber } from "ethers";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { IVOTINGCONTRACT_ID, IERC165_ID } from "../../scripts/utils/interfaceIds";
import { getEventArgs } from "../../scripts/utils/getEventArgs";
import {
    PlainMajorityVote,
    Counter
} from "../../typechain"

import { CounterInterface } from "../../typechain/Counter";

interface Contracts {
    majority: PlainMajorityVote
    counter: Counter
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

let APPROVE = abi.encode(["bool"],[true])
let DISAPPROVE = abi.encode(["bool"],[false])


async function startVotingInstance(
    contracts: Contracts,
    signer: SignerWithAddress,
    functionName: string,
    expectReturnFlag: boolean): Promise<IdentifierAndTimestamp> 
{
    let votingParams : string = abi.encode(["address", "bool"], [contracts.counter.address, expectReturnFlag])
    let calldata : string
    let counterInterface = contracts.counter.interface
    if (functionName=="increment"){
        calldata = counterInterface.encodeFunctionData("increment")
    } else if (functionName=="incrementWithReturn") {
        calldata = counterInterface.encodeFunctionData("incrementWithReturn")
    } else if (functionName=="fail") {
        calldata = counterInterface.encodeFunctionData("fail")
    } else {
        throw("Function Name does not exist")
    }
    
    let tx = await contracts.majority.connect(signer).start(votingParams, calldata)
    let identifier: number = getEventArgs(await tx.wait())[0].toNumber()
    let timestamp = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
    return { identifier, timestamp }
}


describe("Implement a plain Majority Vote", function(){

    let contracts: Contracts;
    let Alice: SignerWithAddress;
    let Bob: SignerWithAddress;
    let counterInterface : CounterInterface;
    let incrementCalldata : string;
    let incrementWithReturnCalldata : string;
    let failCalldata : string;

    beforeEach(async function() {
        [Alice, Bob] = await ethers.getSigners()  
         
        let MajorityFactory = await ethers.getContractFactory("PlainMajorityVote")
        let majority: PlainMajorityVote = await MajorityFactory.connect(Alice).deploy()
        await majority.deployed()
        let CounterFactory = await ethers.getContractFactory("Counter")
        let counter: Counter = await CounterFactory.connect(Alice).deploy()
        await counter.deployed()
        
        counterInterface = counter.interface
        incrementCalldata = counterInterface.encodeFunctionData("increment")
        incrementWithReturnCalldata = counterInterface.encodeFunctionData("incrementWithReturn")
        failCalldata = counterInterface.encodeFunctionData("fail")

        contracts = {majority, counter}
    });



    describe("Deployment", function(){
        it("Should instantiate the public state variable 'VOTING_DURATION'.", async function () {
            expect(await contracts.majority.VOTING_DURATION()).to.equal(BigNumber.from("432000"))
        });
        it("Should check whether the voting contract supports the IERC165 interface.", async function(){
            expect(await contracts.majority.supportsInterface(IVOTINGCONTRACT_ID)).to.equal(true)
            expect(await contracts.majority.supportsInterface(IERC165_ID)).to.equal(true)
        })
        it("Should instantiate the counter variable of the target contract with zero.", async function(){
            expect(await contracts.counter.i()).to.equal(0)
        })
    });

    describe("Counter Increment", function() {
        it("Should increment the counter by one using \"increment\".", async function() {
            expect(await contracts.counter.i()).to.equal(0)
            await contracts.counter.connect(Alice).increment()
            expect(await contracts.counter.i()).to.equal(1)
        });
        it("Should increment the counter by one using \"incrementWithReturn\".", async function() {
            expect(await contracts.counter.i()).to.equal(0)  
            await contracts.counter.connect(Alice).incrementWithReturn()
            expect(await contracts.counter.i()).to.equal(1)
        });
        it("Should revert when calling \"fail\".", async function(){
            await expect(contracts.counter.connect(Alice).fail())
                .to.be.
                revertedWith(`'CounterError()'`)
        });
    });
    describe("Voting Instance", function() {
        let votingParams : string;
        it("Should start a new voting instance with valid votingParams.", async function() { 
            let firstIdentifier: number = 0;
            expect(await contracts.majority.getCurrentIndex()).to.equal(0)
            votingParams = abi.encode(["address", "bool"], [contracts.counter.address, false])
            await expect(contracts.majority.connect(Alice).start(votingParams, incrementCalldata))
                .to.emit(contracts.majority,'VotingInstanceStarted')
                .withArgs(firstIdentifier, Alice.address)
            expect((await contracts.majority.getStatus(firstIdentifier)).toNumber()).to.equal(VotingStatus.active)
            expect(await contracts.majority.getCurrentIndex()).to.equal(1)
        });
        it("Should start a new voting instance and set the counter contract as the caller.", async function(){
            votingParams = abi.encode(["address", "bool"], [contracts.counter.address, false])
            let tx = await contracts.majority.connect(Alice).start(votingParams, incrementCalldata)
            let identifier: number = getEventArgs(await tx.wait())[0].toNumber()
            expect(await contracts.majority.getCaller(identifier)).to.equal(contracts.counter.address)
        });
        it("Should revert when invalid votingParams are passed.", async function() {
            await expect(contracts.majority.connect(Alice).start("0x", incrementCalldata))
                .to.be.reverted
            votingParams = abi.encode(["address", "uint256"], [contracts.counter.address, 3])
            await expect(contracts.majority.connect(Alice).start(votingParams, incrementCalldata))
                .to.be.reverted
            votingParams = abi.encode(["address"], [contracts.counter.address])
            await expect(contracts.majority.connect(Alice).start(votingParams, incrementCalldata))
                .to.be.reverted
            votingParams = abi.encode(["bool"], [false])
            await expect(contracts.majority.connect(Alice).start(votingParams, incrementCalldata))
                .to.be.reverted
        });
    });
    describe("Encoding and Decoding", function(){
        let votingParams: string
        beforeEach(async function(){
            votingParams = abi.encode(["address", "bool"], [contracts.counter.address, false])
        })
        it("Should encode an address and a boolean flag correctly.", async function(){
            let encodedParameters = await contracts.majority.connect(Alice).encodeParameters(contracts.counter.address, false)
            expect(encodedParameters).to.equal(votingParams)
        });
        it("Should decode the votingParams correctly into an address and a boolean flag.", async function(){
            let decodedParameters = await contracts.majority.decodeParameters(votingParams)
            expect(decodedParameters.caller).to.equal(contracts.counter.address)
            expect(decodedParameters.expectReturnValue).to.equal(false)
        })
    })
    describe("Vote and Results", function() {
        let instanceInfo: IdentifierAndTimestamp;
        beforeEach(async function() {
            instanceInfo = await startVotingInstance(contracts, Alice, "increment", false)
        })
        it("Should vote in favor of the motion and retrieve result.", async function(){
            await contracts.majority.vote(instanceInfo.identifier, APPROVE)
            expect(await contracts.majority.result(instanceInfo.identifier))
                .to.equal(abi.encode(["int256"],[1]))
        });
        it("Should vote against the motion and retrieve result.", async function(){
            await contracts.majority.vote(instanceInfo.identifier, DISAPPROVE)
            expect(await contracts.majority.result(instanceInfo.identifier))
                .to.equal(abi.encode(["int256"],[-1]))
        });
        it("Should revert on double voting attempt.", async function(){
            await contracts.majority.connect(Alice).vote(instanceInfo.identifier, APPROVE)
            await expect(contracts.majority.connect(Alice).vote(instanceInfo.identifier, APPROVE))
                .to.be.revertedWith(`'AlreadyVoted(${instanceInfo.identifier}, "${Alice.address}")'`);
        });
    });
    describe("After Deadline - Motion Accepted", function(){
        let instanceInfo: IdentifierAndTimestamp;
        beforeEach(async function() {
            instanceInfo = await startVotingInstance(contracts, Alice, "increment", false)
            await contracts.majority.vote(instanceInfo.identifier, APPROVE)
            await ethers.provider.send('evm_setNextBlockTimestamp',
                [instanceInfo.timestamp + (await contracts.majority.VOTING_DURATION()).toNumber() + 1]); 
            
        });
        it("Should have an awaiting implementation call ('awaitcall') status when casting another vote.", async()=>{
            expect((await contracts.majority.getStatus(instanceInfo.identifier)).toNumber())
                .to.equal(VotingStatus.active)
            await contracts.majority.connect(Bob).vote(instanceInfo.identifier, APPROVE)
            expect((await contracts.majority.getStatus(instanceInfo.identifier)).toNumber())
                .to.equal(VotingStatus.awaitcall)
        });
        it("Should not allow voting after the status is at awaitcall.", async function(){
            await contracts.majority.connect(Bob).vote(instanceInfo.identifier, APPROVE)
            expect((await contracts.majority.getStatus(instanceInfo.identifier)).toNumber())
                .to.equal(VotingStatus.awaitcall)
            await expect(contracts.majority.connect(Bob).vote(instanceInfo.identifier, APPROVE))
                .to.be.revertedWith(`StatusError(${instanceInfo.identifier}, ${VotingStatus.awaitcall})`)
        })
    });
    describe("After Deadline - Motion Disapproved or Tie", function() {
        let instanceInfo: IdentifierAndTimestamp;
        beforeEach(async function() {
            instanceInfo = await startVotingInstance(contracts, Alice, "increment", false)
            await contracts.majority.connect(Alice).vote(instanceInfo.identifier, DISAPPROVE)            
        });
        it("Should have a failed status when casting another vote on a disapproved motion.", async()=>{
            await ethers.provider.send('evm_setNextBlockTimestamp',
                [instanceInfo.timestamp + (await contracts.majority.VOTING_DURATION()).toNumber() + 1]); 
            expect((await contracts.majority.getStatus(instanceInfo.identifier)).toNumber())
                .to.equal(VotingStatus.active)
            await contracts.majority.connect(Bob).vote(instanceInfo.identifier, APPROVE)
            expect((await contracts.majority.getStatus(instanceInfo.identifier)).toNumber())
                .to.equal(VotingStatus.failed)
        });
        it("Should have a failed status when casting another vote on a tied motion.", async()=>{
            await contracts.majority.connect(Bob).vote(instanceInfo.identifier, DISAPPROVE)
            await ethers.provider.send('evm_setNextBlockTimestamp',
                [instanceInfo.timestamp + (await contracts.majority.VOTING_DURATION()).toNumber() + 1]); 
            expect((await contracts.majority.getStatus(instanceInfo.identifier)).toNumber())
                .to.equal(VotingStatus.active)
            await contracts.majority.connect(Bob).vote(instanceInfo.identifier, APPROVE)
            expect((await contracts.majority.getStatus(instanceInfo.identifier)).toNumber())
                .to.equal(VotingStatus.failed)
        });
        it("Should not allow voting after the status is failed.", async function(){
            await ethers.provider.send('evm_setNextBlockTimestamp',
                [instanceInfo.timestamp + (await contracts.majority.VOTING_DURATION()).toNumber() + 1]);
            await contracts.majority.connect(Bob).vote(instanceInfo.identifier, APPROVE)
            expect((await contracts.majority.getStatus(instanceInfo.identifier)).toNumber())
                .to.equal(VotingStatus.failed)
            await expect(contracts.majority.connect(Bob).vote(instanceInfo.identifier, APPROVE))
                .to.be.revertedWith(`StatusError(${instanceInfo.identifier}, ${VotingStatus.failed})`)
        })

    });
    describe("Implement - Before Deadline", function(){
        it("Should revert when calling implement.", async()=>{
            let counterInterface : CounterInterface = contracts.counter.interface
            let calldata = counterInterface.encodeFunctionData("increment")
            let instanceInfo : IdentifierAndTimestamp = await startVotingInstance(contracts, Alice, "increment", false)
            await expect(contracts.majority.connect(Alice).implement(instanceInfo.identifier, calldata))
                .to.be.revertedWith(`'ImplementingNotPermitted(${instanceInfo.identifier}, ${VotingStatus.active})'`)
        });
    });
    describe("Implement - After Deadline", function(){
        it("Should revert when providing the wrong callback data.",async function(){
            let instanceInfo : IdentifierAndTimestamp = await startVotingInstance(contracts, Alice, "increment", false)
            await contracts.majority.vote(instanceInfo.identifier, APPROVE)
            await ethers.provider.send('evm_setNextBlockTimestamp',
                [instanceInfo.timestamp + (await contracts.majority.VOTING_DURATION()).toNumber() + 1]);  
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
            instanceInfoIncrementDontExpectReturnFlag = await startVotingInstance(contracts, Alice, "increment", false)
            instanceInfoIncrementExpectReturnFlag = await startVotingInstance(contracts, Alice, "increment", true)
            instanceInfoIncrementWithReturn = await startVotingInstance(contracts, Alice, "incrementWithReturn", true)
            instanceInfoFail = await startVotingInstance(contracts, Alice, "fail", false)
            await contracts.majority.vote(instanceInfoIncrementDontExpectReturnFlag.identifier, APPROVE)
            await contracts.majority.vote(instanceInfoIncrementExpectReturnFlag.identifier, APPROVE)
            await contracts.majority.vote(instanceInfoIncrementWithReturn.identifier, APPROVE)
            await contracts.majority.vote(instanceInfoFail.identifier, APPROVE)
            await ethers.provider.send('evm_setNextBlockTimestamp',
                [instanceInfoFail.timestamp + (await contracts.majority.VOTING_DURATION()).toNumber() + 1]);  
        });

        it("When not expecting a function response: counter ++; status complete; emit event.", async function(){
            expect(await contracts.counter.i()).to.equal(0)
            expect((await contracts.majority.getStatus(instanceInfoIncrementDontExpectReturnFlag.identifier)).toNumber())
                .to.equal(VotingStatus.active)
            await expect(contracts.majority.connect(Alice)
                            .implement(instanceInfoIncrementDontExpectReturnFlag.identifier, incrementCalldata))
                .to.emit(contracts.majority,'Implemented')
                .withArgs(instanceInfoIncrementDontExpectReturnFlag.identifier)
            expect(await contracts.counter.i()).to.equal(1)
            expect((await contracts.majority.getStatus(instanceInfoIncrementDontExpectReturnFlag.identifier)).toNumber())
                .to.equal(VotingStatus.completed)
        });

        it("When expecting and receiving a function response: counter ++; status complete; emit event.", async function(){
            expect(await contracts.counter.i()).to.equal(0)
            expect((await contracts.majority.getStatus(instanceInfoIncrementWithReturn.identifier)).toNumber())
                .to.equal(VotingStatus.active)
            await expect(contracts.majority.connect(Alice)
                            .implement(instanceInfoIncrementWithReturn.identifier, incrementWithReturnCalldata))
                .to.emit(contracts.majority,'Implemented')
                .withArgs(instanceInfoIncrementWithReturn.identifier)
            expect(await contracts.counter.i()).to.equal(1)
            expect((await contracts.majority.getStatus(instanceInfoIncrementWithReturn.identifier)).toNumber())
                .to.equal(VotingStatus.completed)
        });
        it("Should revert when expecting a function response and not receiving one.", async function (){
            expect(await contracts.counter.i()).to.equal(0)
            expect((await contracts.majority.getStatus(instanceInfoIncrementExpectReturnFlag.identifier)).toNumber())
                .to.equal(VotingStatus.active)
            await expect(contracts.majority.implement(instanceInfoIncrementExpectReturnFlag.identifier, incrementCalldata))
                .to.be 
                .revertedWith(`'ExpectedReturnError(${instanceInfoIncrementExpectReturnFlag.identifier})'`);
            expect(await contracts.counter.i()).to.equal(0)
            expect((await contracts.majority.getStatus(instanceInfoIncrementExpectReturnFlag.identifier)).toNumber())
                .to.equal(VotingStatus.active)
        });
        it ("Should change status to failed and emit event when making an unsuccessful call.", async function(){
            let votingParams : string = abi.encode(["address", "bool"], [contracts.counter.address, false])
            let unknownSelector : string = "0x12345678"
            let tx = await contracts.majority.connect(Alice).start(votingParams, unknownSelector)
            let identifier: number = getEventArgs(await tx.wait())[0].toNumber()
            let timestamp = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
            await contracts.majority.vote(identifier, APPROVE)
            await ethers.provider.send('evm_setNextBlockTimestamp',
                [timestamp + (await contracts.majority.VOTING_DURATION()).toNumber() + 1]);  
            expect((await contracts.majority.getStatus(identifier)).toNumber())
                .to.equal(VotingStatus.active)
            await expect( contracts.majority.implement(identifier, unknownSelector))
                .to.emit(contracts.majority, 'NotImplemented')
                .withArgs(identifier)
            expect((await contracts.majority.getStatus(identifier)).toNumber())
                .to.equal(VotingStatus.failed)
            
        })
        it ("Should revert when the target function reverts.", async function(){
            expect(await contracts.counter.i()).to.equal(0)
            expect((await contracts.majority.getStatus(instanceInfoFail.identifier)).toNumber())
                .to.equal(VotingStatus.active)
            await expect(contracts.majority.connect(Alice).implement(instanceInfoFail.identifier, failCalldata))
                .to.be.reverted
            expect(await contracts.counter.i()).to.equal(0)
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
            let votingParams : string = abi.encode(["address", "bool"], [contracts.counter.address, false])
            let unknownSelector : string = "0x12345678"
            let tx = await contracts.majority.connect(Alice).start(votingParams, unknownSelector)
            let identifier: number = getEventArgs(await tx.wait())[0].toNumber()
            let timestamp = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
            await contracts.majority.vote(identifier, APPROVE)
            await ethers.provider.send('evm_setNextBlockTimestamp',
                [timestamp + (await contracts.majority.VOTING_DURATION()).toNumber() + 1]);  
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
            await contracts.counter.increment();
            expect(await contracts.counter.i()).to.equal(1)
            expect((await contracts.majority.getStatus(instanceInfoIncrementExpectReturnFlag.identifier)).toNumber())
                .to.equal(VotingStatus.active)
            await expect(contracts.majority.connect(Alice).implement(instanceInfoFail.identifier, failCalldata))
                .to.emit(contracts.majority, 'Implemented')
                .withArgs(instanceInfoFail.identifier)
            
            expect(await contracts.counter.i()).to.equal(2)
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
            let instanceInfo : IdentifierAndTimestamp = await startVotingInstance(contracts, Alice, "increment", false)
            await contracts.majority.vote(instanceInfo.identifier, DISAPPROVE)
            await ethers.provider.send('evm_setNextBlockTimestamp',
                [instanceInfo.timestamp + (await contracts.majority.VOTING_DURATION()).toNumber() + 1]);  
            expect((await contracts.majority.getStatus(instanceInfo.identifier)).toNumber())
                .to.equal(VotingStatus.active)
            await expect( contracts.majority.implement(instanceInfo.identifier, incrementCalldata))
                .to.be.revertedWith(`'ImplementingNotPermitted(${instanceInfo.identifier}, ${VotingStatus.active})'`)            
        })
    })
});