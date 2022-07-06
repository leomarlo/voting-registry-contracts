import { expect } from "chai";
import { Result } from "ethers/lib/utils";
import { ContractReceipt, BigNumber } from "ethers";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { IVOTINGCONTRACT_ID, IERC165_ID } from "../../scripts/interfaceIds";

import {
    Snapshot
} from "../../typechain"


interface Contracts {
    snapshot: Snapshot
}

interface IdentifierAndTimestamp {
    identifier: number,
    timestamp: number
}

const abi = ethers.utils.defaultAbiCoder 

let VotingStatus = {
    "inactive": 0,
    "completed": 1,
    "failed": 2,
    "active": 3
}


// let IVOTINGCONTRACT_ID = '0x9452d78d'
// let IERC165_ID = '0x01ffc9a7'

let APPROVE = abi.encode(["bool"],[true])
let DISAPPROVE = abi.encode(["bool"],[false])

function getEventArgs(receipt: ContractReceipt): Result {
    if (receipt.events !== undefined) {
        if (receipt.events[0].args !==undefined) {return receipt.events[0].args}
        throw("Args are undefined!")
    }
    throw("Events are undefined!")
}

async function startVotingInstance(snapshot: Snapshot): Promise<IdentifierAndTimestamp> {
    let tx = await snapshot.start("0x", "0x");
    let identifier: number = getEventArgs(await tx.wait())[0].toNumber()
    let timestamp = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
    return { identifier, timestamp }
}



describe("Snapshot", function(){

    let contracts: Contracts;
    let Alice: SignerWithAddress;
    let Bob: SignerWithAddress;
    beforeEach(async function() {
        [Alice, Bob] = await ethers.getSigners()   
        let SnapshotFactory = await ethers.getContractFactory("Snapshot")
        let snapshot: Snapshot = await SnapshotFactory.connect(Alice).deploy()
        await snapshot.deployed()
        contracts = {snapshot}
    });

    describe("Deployment", function(){
        it("Should instantiate the public state variable 'VOTING_DURATION'.", async ()=> {
            expect(await contracts.snapshot.VOTING_DURATION()).to.equal(BigNumber.from("432000"))
        });
        it("Should check whether the voting contract supports the IERC165 interface.", async function(){
            expect(await contracts.snapshot.supportsInterface(IVOTINGCONTRACT_ID)).to.equal(true)
            expect(await contracts.snapshot.supportsInterface(IERC165_ID)).to.equal(true)
        })
    });

    describe("Voting Instance", function(){
        it("Should start a new voting instance.", async ()=> {
            let firstIdentifier: number = 0;
            expect(await contracts.snapshot.getCurrentIndex()).to.equal(0)
            await expect(contracts.snapshot.connect(Alice).start("0x", "0x"))
                .to.emit(contracts.snapshot,'VotingInstanceStarted')
                .withArgs(firstIdentifier, Alice.address)
            let currentStatus = (await contracts.snapshot.getStatus(firstIdentifier)).toNumber()
            expect(currentStatus).to.equal(VotingStatus.active)
            expect(await contracts.snapshot.getCurrentIndex()).to.equal(1)
        });
    });

    describe("Voting and Results", function(){
        let instanceInfo: IdentifierAndTimestamp;
        beforeEach(async function() {
            instanceInfo = await startVotingInstance(contracts.snapshot)
        })
        it("Should vote in favor of the motion and retrieve result.", async function(){
            await contracts.snapshot.vote(instanceInfo.identifier, APPROVE)
            expect(await contracts.snapshot.result(instanceInfo.identifier))
                .to.equal(abi.encode(["int256"],[1]))
        });
        it("Should vote against the motion and retrieve result.", async function(){
            await contracts.snapshot.vote(instanceInfo.identifier, DISAPPROVE)
            expect(await contracts.snapshot.result(instanceInfo.identifier))
                .to.equal(abi.encode(["int256"],[-1]))
        });
        it("Should revert on double voting attempt.", async function(){
            await contracts.snapshot.connect(Alice).vote(instanceInfo.identifier, APPROVE)
            await expect(contracts.snapshot.connect(Alice).vote(instanceInfo.identifier, APPROVE))
                .to.be.revertedWith(`'AlreadyVoted(${instanceInfo.identifier}, "${Alice.address}")'`);
        });
    });

    describe("Before Deadline", function(){
        let instanceInfo: IdentifierAndTimestamp;
        beforeEach(async function() {
            instanceInfo = await startVotingInstance(contracts.snapshot)
        });
        it("Should revert when calling conclude and the status is active.",async()=>{
            let deadline = instanceInfo.timestamp + (await contracts.snapshot.VOTING_DURATION()).toNumber()
            await expect(contracts.snapshot.connect(Alice).conclude(instanceInfo.identifier))
                .to.be.
                revertedWith(`'DeadlineHasNotPassed(${instanceInfo.identifier}, ${deadline})'`)
    
        });
    });

    describe("After Deadline - Decided Result", function(){
        let instanceInfo: IdentifierAndTimestamp;
        beforeEach(async function() {
            instanceInfo = await startVotingInstance(contracts.snapshot)
            await contracts.snapshot.vote(instanceInfo.identifier, APPROVE)
            await ethers.provider.send(
                'evm_setNextBlockTimestamp',
                [instanceInfo.timestamp + (await contracts.snapshot.VOTING_DURATION()).toNumber() + 1]); 
            
        });
        it("Should have a completed status when calling conclude.", async()=>{
            expect((await contracts.snapshot.getStatus(instanceInfo.identifier)).toNumber())
                .to.equal(VotingStatus.active)
            await contracts.snapshot.conclude(instanceInfo.identifier);
            expect((await contracts.snapshot.getStatus(instanceInfo.identifier)).toNumber())
                .to.equal(VotingStatus.completed)
        });
        it("Should have a completed status when casting another vote.", async()=>{
            expect((await contracts.snapshot.getStatus(instanceInfo.identifier)).toNumber())
                .to.equal(VotingStatus.active)
            await contracts.snapshot.connect(Bob).vote(instanceInfo.identifier, APPROVE)
            expect((await contracts.snapshot.getStatus(instanceInfo.identifier)).toNumber())
                .to.equal(VotingStatus.completed)
        });

    });

    describe("After Deadline - Tie", function(){
        let instanceInfo: IdentifierAndTimestamp;
        beforeEach(async function() {
            instanceInfo = await startVotingInstance(contracts.snapshot)
            await contracts.snapshot.vote(instanceInfo.identifier, APPROVE)
            await contracts.snapshot.connect(Bob).vote(instanceInfo.identifier, DISAPPROVE)
            await ethers.provider.send(
                'evm_setNextBlockTimestamp',
                [instanceInfo.timestamp + (await contracts.snapshot.VOTING_DURATION()).toNumber() + 1]); 
            
        });
        it("Should have a failed status when calling conclude.", async ()=> {
            expect((await contracts.snapshot.getStatus(instanceInfo.identifier)).toNumber())
                .to.equal(VotingStatus.active)
            await contracts.snapshot.conclude(instanceInfo.identifier);
            expect((await contracts.snapshot.getStatus(instanceInfo.identifier)).toNumber())
                .to.equal(VotingStatus.failed)
        });
        it("Should have a failed status when casting another vote.", async ()=> {
            expect((await contracts.snapshot.getStatus(instanceInfo.identifier)).toNumber())
                .to.equal(VotingStatus.active)
            await contracts.snapshot.vote(instanceInfo.identifier, APPROVE);
            expect((await contracts.snapshot.getStatus(instanceInfo.identifier)).toNumber())
                .to.equal(VotingStatus.failed)
        });
    });

    describe("After Voting Concluded", function(){
        let instanceInfo: IdentifierAndTimestamp;
        beforeEach(async function() {
            instanceInfo = await startVotingInstance(contracts.snapshot)
            await contracts.snapshot.vote(instanceInfo.identifier, APPROVE)
            await ethers.provider.send(
                'evm_setNextBlockTimestamp',
                [instanceInfo.timestamp + (await contracts.snapshot.VOTING_DURATION()).toNumber() + 1]); 
            await contracts.snapshot.conclude(instanceInfo.identifier); 
        });
        it("Should not allow voting after conclusion.", async ()=>{
            await expect(contracts.snapshot.connect(Bob).vote(instanceInfo.identifier, APPROVE))
                .to.be.
                revertedWith(`'StatusError(${instanceInfo.identifier}, ${VotingStatus.completed})'`);
        });
        it("Should revert when calling conclude and the status is not active.", async ()=>{
            expect((await contracts.snapshot.getStatus(instanceInfo.identifier)).toNumber())
                .to.not.equal(VotingStatus.active)
            await expect(contracts.snapshot.connect(Alice).conclude(instanceInfo.identifier))
                .to.be.
                revertedWith(`'StatusError(${instanceInfo.identifier}, ${VotingStatus.completed})'`) 
        });
    });

});