import { expect } from "chai";
import { Result } from "ethers/lib/utils";
import { ContractReceipt, BigNumber } from "ethers";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { IVOTINGCONTRACT_ID, IERC165_ID } from "../../scripts/interfaceIds";
import { getEventArgs } from "../../scripts/getEventArgs";

import {
    Tournament,
    DummyTournamentIntegrator,
    DummyToken
} from "../../typechain"

import { DummyTournamentIntegratorInterface } from "../../typechain/DummyTournamentIntegrator";
import { countReset } from "console";


const abi = ethers.utils.defaultAbiCoder

interface Contracts {
    tournament: Tournament,
    integrator: DummyTournamentIntegrator,
    token: DummyToken
}

interface IdentifierAndTimestamp {
    identifier: number,
    timestamp: number
}

let VotingStatus = {
    "inactive": 0,
    "completed": 1,
    "failed": 2,
    "active": 3,
    "awaitcall": 4
}

let zeroAddress = ethers.constants.AddressZero;
let ONEETH = ethers.utils.parseEther("1.0")
let VOTING_DURATION = 5 * 86400;

describe("Implement a Tournament Vote", function(){

    let contracts: Contracts;
    let Alice: SignerWithAddress;
    let Bob: SignerWithAddress;
    let Commodus: SignerWithAddress;
    let integratorInterface : DummyTournamentIntegratorInterface;
    let proposeImperatorCalldata : string;
    let failCalldata: string;

    beforeEach(async function() {
        [Alice, Bob, Commodus] = await ethers.getSigners()  
         
        const TournamentLibFactory = await ethers.getContractFactory("TournamentLib");
        const tournamentLib = await TournamentLibFactory.deploy();
        await tournamentLib.deployed();

    
        let TournamentFactory = await ethers.getContractFactory("Tournament",{
            libraries:{TournamentLib: tournamentLib.address}})
        let tournament: Tournament = await TournamentFactory.connect(Alice).deploy()
        await tournament.deployed()
        let IntegratorFactory = await ethers.getContractFactory("DummyTournamentIntegrator")
        let integrator: DummyTournamentIntegrator = await IntegratorFactory.connect(Alice).deploy(tournament.address)
        await integrator.deployed()
        let DummyTokenFactory = await ethers.getContractFactory("DummyToken")
        let token: DummyToken = await DummyTokenFactory.connect(Alice).deploy()
        await token.deployed()

        integratorInterface = integrator.interface
        proposeImperatorCalldata = integratorInterface.encodeFunctionData("proposeNewImperator",[zeroAddress])
        failCalldata = integratorInterface.encodeFunctionData("fail", [10])

        contracts = {tournament, integrator, token}
    });
    describe("Deployment", function(){
        it("Should check whether the voting contract supports the IERC165 interface.", async function(){
            expect(await contracts.tournament.supportsInterface(IVOTINGCONTRACT_ID)).to.equal(true)
            expect(await contracts.tournament.supportsInterface(IERC165_ID)).to.equal(true)
        })
        it("Should instantiates zero addresses for the two state variables of the dummy integrator.", async function(){
            expect(await contracts.integrator.imperator()).to.equal(zeroAddress)
            expect(await contracts.integrator.imperatorElect()).to.equal(zeroAddress)
        })
    })
    describe("Voting Instance", function() {
        let contesters: Array<string>
        let rounds: number = 1;
        let votingParamsOne: string;
        beforeEach(async function(){
            contesters = [ ...Array(2).keys() ].map( i => '0x' + '0'.repeat(63) + (i+1).toString());
            votingParamsOne = abi.encode(
                ["uint48", "uint256", "uint8", "address", "bytes32[]"],
                [0, VOTING_DURATION, rounds, contracts.token.address, contesters])
        })
        it("Should start a new voting instance with valid votingParams.", async function() {
            
            expect(await contracts.tournament.getCurrentIndex()).to.equal(0)
            await expect(contracts.integrator.connect(Alice).start(votingParamsOne, proposeImperatorCalldata))
                .to.emit(contracts.tournament,'VotingInstanceStarted')
                .withArgs(0, contracts.integrator.address)
            expect((await contracts.tournament.getStatus(0)).toNumber()).to.equal(VotingStatus.awaitcall + rounds)
            
        }) 
        it("Should start a new voting instance and check the state of the options", async function(){
            await contracts.integrator.connect(Alice).start(votingParamsOne, proposeImperatorCalldata);
            let contestersState = await contracts.tournament.getState(0, contesters[0])
            expect(contestersState.votes).to.equal(ONEETH.mul(0))
            expect(contestersState.currentGroup).to.equal(1)
            expect(contestersState.participatesInCurrentRound).to.equal(true);
        })
        // it("Should start a new voting instance with huge list of options.", async function() {
        //     let manyRounds : number = 8;
        //     let addresses = [ ...Array(256).keys() ].map( i => '0x' + '0'.repeat(60) + (1000 + i).toString());
        //     let votingParamsLostOfAddresses: string = abi.encode(
        //         ["uint48", "uint256", "uint8", "address", "bytes32[]"],
        //         [0, VOTING_DURATION, manyRounds, contracts.token.address, addresses])
        //     expect(await contracts.tournament.getCurrentIndex()).to.equal(0)
        //     await expect(contracts.integrator.connect(Alice).start(votingParamsLostOfAddresses, proposeImperatorCalldata))
        //         .to.emit(contracts.tournament,'VotingInstanceStarted')
        //         .withArgs(0, contracts.integrator.address)
        //     expect((await contracts.tournament.getStatus(0)).toNumber()).to.equal(VotingStatus.awaitcall + manyRounds)
        // }) 

        it("Should revert when non-distinct options are passed into the votingParams.", async function(){
            let nondistinctContesters : Array<string>  = [ ethers.constants.HashZero, ethers.constants.HashZero ]
            let votingParamsNonDistinct: string = abi.encode(
                ["uint48", "uint256", "uint8", "address", "bytes32[]"],
                [0, VOTING_DURATION, 1, contracts.token.address, nondistinctContesters])
            await expect(contracts.integrator.connect(Alice).start(votingParamsNonDistinct, proposeImperatorCalldata))
                .to.be.revertedWith(`'OnlyDistinctOptions(${0}, "${ethers.constants.HashZero}")'`);
        })
        it("Should revert when zero rounds are passed into the votingParams.", async function(){
            let votingParamsZero: string = abi.encode(
                ["uint48", "uint256", "uint8", "address", "bytes32[]"],
                [0, VOTING_DURATION, 0, contracts.token.address, contesters])
            await expect(contracts.integrator.connect(Alice).start(votingParamsZero, proposeImperatorCalldata))
                .to.be.revertedWith(`'AtLeastOneRound(${0})'`);
        })
        it("Should revert when too many rounds are passed into the votingParams.", async function(){
            let votingParamsTwo: string = abi.encode(
                ["uint48", "uint256", "uint8", "address", "bytes32[]"],
                [0, VOTING_DURATION, 2, contracts.token.address, contesters])
            await expect(contracts.integrator.connect(Alice).start(votingParamsTwo, proposeImperatorCalldata))
                .to.be.revertedWith(`'TooManyRounds(${0}, ${2}, ${2})'`);
        })
        it("Should revert when the callback is too short for bytesInsertion.", async function(){
            let insertAtByte = 1;
            let votingParamsTwo: string = abi.encode(
                ["uint48", "uint256", "uint8", "address", "bytes32[]"],
                [insertAtByte, VOTING_DURATION, 1, contracts.token.address, contesters])
            await expect(contracts.integrator.connect(Alice).start(votingParamsTwo, proposeImperatorCalldata))
                .to.be.revertedWith(`'CallbackTooShortForBytes32Insertion(${insertAtByte}, "${proposeImperatorCalldata}")'`);
        
        })
        it("Should set the integrator contract as the caller.", async function(){
            await contracts.integrator.connect(Alice).start(votingParamsOne, proposeImperatorCalldata)
            expect(await contracts.tournament.getCaller(0)).to.equal(contracts.integrator.address);
        })

    })
    describe("Encoding and Decoding", function(){
        let contesters: Array<string>
        let votingParamsOne: string;
        let insertAtByte: number;
        let rounds: number;
        let tokenAddress: string;
        beforeEach(async function(){
            contesters = [ethers.constants.HashZero, ethers.constants.HashZero]
            insertAtByte = 36
            rounds = 1;
            tokenAddress = contracts.token.address;
            votingParamsOne = abi.encode(
                ["uint48", "uint256", "uint8", "address", "bytes32[]"],
                [insertAtByte, VOTING_DURATION, rounds, tokenAddress, contesters])
        })
        it("Should encode the voting parameters correctly.", async function(){
            let encodedParameters = await contracts.tournament.encodeParameters(
                insertAtByte,
                VOTING_DURATION,
                rounds,
                tokenAddress,
                contesters
                )
            expect(encodedParameters).to.equal(votingParamsOne)
        });
        it("Should decode the votingParams correctly.", async function(){
            let decodedParameters = await contracts.tournament.decodeParameters(votingParamsOne)
            expect(decodedParameters.token).to.equal(tokenAddress)
            expect(decodedParameters.duration).to.equal(VOTING_DURATION)
            expect(decodedParameters.rounds).to.equal(rounds)
            expect(decodedParameters.insertAtByte).to.equal(insertAtByte)
            expect(decodedParameters.insertAtByte).to.equal(insertAtByte)
            expect(decodedParameters.permutation).to.deep.equal(contesters)
        })
    })
    describe("Vote and Results", function() {
        let instanceInfo: IdentifierAndTimestamp;
        let contesters: Array<string>;
        let rounds: number = 2;
        beforeEach(async function() {
            // await contracts.token.connect(Alice).mint(ONEETH.mul(100))
            await contracts.token.connect(Bob).mint(ONEETH.mul(200))
            // await contracts.token.connect(Commodus).mint(ONEETH.mul(300))
            contesters = [ ...Array(5).keys() ].map( i => '0x' + '0'.repeat(60) + (1000 + i).toString());
            let votingParams = abi.encode(
                ["uint48", "uint256", "uint8", "address", "bytes32[]"],
                [0, VOTING_DURATION, rounds, contracts.token.address, contesters])
            let identifier = (await contracts.tournament.getCurrentIndex()).toNumber()
            await contracts.integrator.connect(Alice).start(votingParams, proposeImperatorCalldata);
            instanceInfo = {
                timestamp: (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp,
                identifier: identifier
            }
        })

        it("Should vote on one option", async function(){
            let votingOptions = abi.encode(["bytes32[]"],[[contesters[0]]]);
            expect((await contracts.tournament.getState(instanceInfo.identifier, contesters[0])).votes)
                .to.equal(BigNumber.from("0"));
            await contracts.tournament.connect(Bob).vote(instanceInfo.identifier, votingOptions);
            let weightOfBob = await contracts.token.balanceOf(Bob.address)
            expect((await contracts.tournament.getState(instanceInfo.identifier, contesters[0])).votes)
                .to.equal(weightOfBob);
            await contracts.tournament.connect(Commodus).vote(instanceInfo.identifier, votingOptions);
            expect((await contracts.tournament.getState(instanceInfo.identifier, contesters[0])).votes)
                .to.equal(weightOfBob.add(await contracts.token.balanceOf(Commodus.address)));
        })
        it("Should vote on as many options as groups", async function(){
            let votingOptions = abi.encode(["bytes32[]"],[[contesters[0], contesters[3]]]);
            await contracts.tournament.connect(Bob).vote(instanceInfo.identifier, votingOptions);
            expect((await contracts.tournament.getState(instanceInfo.identifier, contesters[0])).votes)
                .to.equal(await contracts.token.balanceOf(Bob.address));
            expect((await contracts.tournament.getState(instanceInfo.identifier, contesters[3])).votes)
                .to.equal(await contracts.token.balanceOf(Bob.address));
        })
        it("Should retrieve the result.", async function(){
            let groupLeaders = [contesters[0], contesters[3]]
            let votingOptions = abi.encode(["bytes32[]"],[groupLeaders]);
            await contracts.tournament.connect(Bob).vote(instanceInfo.identifier, votingOptions);
            let expectedResult = abi.encode(["bytes32[]","uint256[]"],[groupLeaders, Array(2).fill(await contracts.token.balanceOf(Bob.address))])
            expect(await contracts.tournament.result(0)).to.equal(expectedResult);
        })
        it("Should revert when voting on two options from the same group.", async function(){

            let votingOptions = abi.encode(["bytes32[]"],[[contesters[0], contesters[0]]]);
            let group = (await contracts.tournament.getState(instanceInfo.identifier, contesters[0])).currentGroup;
            await expect(contracts.tournament.connect(Bob).vote(instanceInfo.identifier, votingOptions))
                .to.be.revertedWith(`AlreadyVoted(${0}, ${group.toNumber()}, "${contesters[0]}", "${Bob.address}")`);

        });
        it("Should revert when voting on an inactive instance (that has not been started yet)", async function(){
            let identifier: number = 999;
            let votingOptions = abi.encode(["bytes32[]"],[[contesters[0], contesters[0]]]);
            await expect(contracts.tournament.connect(Bob).vote(identifier, votingOptions))
                .to.be.revertedWith(`StatusError(${identifier}, ${VotingStatus.inactive})`)
        })
        it("Should set the status to failed when the voting power exceeds the limits.", async function(){
            let votingOptions = abi.encode(["bytes32[]"],[[contesters[0]]]);
            await contracts.token.connect(Alice).mint(ethers.constants.MaxInt256)
            expect(await contracts.tournament.getStatus(instanceInfo.identifier)).to.equal(VotingStatus.awaitcall + rounds)
            await contracts.tournament.connect(Alice).vote(instanceInfo.identifier, votingOptions);
            expect(await contracts.tournament.getStatus(instanceInfo.identifier)).to.equal(VotingStatus.failed)
            
        })
    })
    describe("Finish First Round", function(){
        let instanceInfo: IdentifierAndTimestamp;
        let contesters: Array<string>;
        let groupLeaders: Array<string>;
        beforeEach(async function() {
            await contracts.token.connect(Bob).mint(ONEETH.mul(200))
            let rounds = 2;
            contesters = [ ...Array(5).keys() ].map( i => '0x' + '0'.repeat(60) + (1000 + i).toString());
            let votingParams = abi.encode(
                ["uint48", "uint256", "uint8", "address", "bytes32[]"],
                [0, VOTING_DURATION, rounds, contracts.token.address, contesters])
            let identifier = (await contracts.tournament.getCurrentIndex()).toNumber()
            await contracts.integrator.connect(Alice).start(votingParams, proposeImperatorCalldata);
            instanceInfo = {
                timestamp: (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp,
                identifier: identifier
            }
            groupLeaders = [contesters[0], contesters[3]]
            let votingOptions = abi.encode(["bytes32[]"],[groupLeaders]);
            await contracts.tournament.connect(Bob).vote(instanceInfo.identifier, votingOptions);
            await ethers.provider.send('evm_setNextBlockTimestamp', [instanceInfo.timestamp + VOTING_DURATION + 1]); 
            
        })
        it("Should enter the next round by calling the triggerNextRound function.", async function(){
            let totalRounds = 2;
            let cPrime = 3
            await expect(contracts.tournament.connect(Alice).triggerNextRound(instanceInfo.identifier))
                .to.emit(contracts.tournament, "WinnersOfThisRound")
                .withArgs(instanceInfo.identifier, totalRounds, groupLeaders)
            expect(await contracts.tournament.getStatus(instanceInfo.identifier)).to.equal(VotingStatus.awaitcall + totalRounds - 1)
            for (let i=0; i<groupLeaders.length; i++){
                let state = await contracts.tournament.getState(instanceInfo.identifier, groupLeaders[i])
                expect(state.participatesInCurrentRound).to.equal(true)
                expect(state.votes).to.equal(ONEETH.mul(0))
                expect(state.currentGroup).to.equal(BigNumber.from(cPrime.toString()))
            }
        })
        it("Should enter the next round also by casting a new vote.", async function(){
            // We vote for the winner of group 2
            let totalRounds = 2;
            let cPrime = 3
            let nextOption = groupLeaders[1]
            let votingOptions = abi.encode(["bytes32[]"],[[nextOption]]);
            
            await expect(contracts.tournament.connect(Bob).vote(instanceInfo.identifier, votingOptions))
                .to.emit(contracts.tournament, "WinnersOfThisRound")
                .withArgs(instanceInfo.identifier, totalRounds, groupLeaders);
            expect(await contracts.tournament.getStatus(instanceInfo.identifier)).to.equal(VotingStatus.awaitcall + totalRounds - 1)
            for (let i=0; i<groupLeaders.length; i++){
                let state = await contracts.tournament.getState(instanceInfo.identifier, groupLeaders[i])
                expect(state.participatesInCurrentRound).to.equal(true)
                if (groupLeaders[i] == nextOption){
                    expect(state.votes).to.equal(await contracts.token.balanceOf(Bob.address))
                } else {
                    expect(state.votes).to.equal(ONEETH.mul(0))
                }
                expect(state.currentGroup).to.equal(BigNumber.from(cPrime.toString()))
            }
        })
    })
    describe("Final round", function (){
        let contesters: Array<string>
        let rounds: number = 1;
        let votingOptions: string;
        let instanceInfo: IdentifierAndTimestamp
        let winner: string
        beforeEach(async function(){
            await contracts.token.connect(Bob).mint(ONEETH.mul(200))
            
            contesters = [ ...Array(2).keys() ].map( i => '0x' + '0'.repeat(63) + (i+1).toString());
            let votingParamsOne = abi.encode(
                ["uint48", "uint256", "uint8", "address", "bytes32[]"],
                [0, VOTING_DURATION, rounds, contracts.token.address, contesters])
            winner = contesters[0];
            votingOptions = abi.encode(["bytes32[]"],[[winner]]);
            let identifier = (await contracts.tournament.getCurrentIndex()).toNumber()
            await contracts.integrator.connect(Alice).start(votingParamsOne, proposeImperatorCalldata);
            instanceInfo = {
                timestamp: (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp,
                identifier: identifier
            }
        })
        it("Should emit winner event in case at least one option has a non-zero outcome.", async function(){
            await contracts.tournament.connect(Bob).vote(instanceInfo.identifier, votingOptions)
            await ethers.provider.send('evm_setNextBlockTimestamp', [instanceInfo.timestamp + VOTING_DURATION + 1]); 
            await expect(contracts.tournament.connect(Alice).triggerNextRound(instanceInfo.identifier))
                .to.emit(contracts.tournament, "WinnersOfThisRound")
                .withArgs(instanceInfo.identifier, 1, [winner]);
        })
        it("Should set the status to awaitcall and the result to the tuple of winner and votes.", async function(){
            await contracts.tournament.connect(Bob).vote(instanceInfo.identifier, votingOptions)
            await ethers.provider.send('evm_setNextBlockTimestamp', [instanceInfo.timestamp + VOTING_DURATION + 1]); 
            await contracts.tournament.connect(Alice).triggerNextRound(instanceInfo.identifier)
            expect(await contracts.tournament.getStatus(instanceInfo.identifier)).to.equal(VotingStatus.awaitcall)
            let expectedResult = abi.encode(["bytes32", "uint256"], [winner, await contracts.token.balanceOf(Bob.address)])
            expect(await contracts.tournament.result(instanceInfo.identifier)).to.equal(expectedResult)
        })
        it("Should not emit a winner event but set status to failed when both option have zero votes.", async function(){
            await contracts.tournament.connect(Bob).vote(instanceInfo.identifier, votingOptions);
        })

    })
    // describe("Implement - Before Deadline", function(){
    //     it("Should revert when trying to implement the result before the deadline.")
    // })
    describe("Implement", function(){
        let rounds: number = 1;
        let votingOptions: string;
        let instanceInfoProposeImperator: IdentifierAndTimestamp;
        let instanceInfoFail: IdentifierAndTimestamp;
        let CommodusOption: string
        beforeEach(async function(){
            // await contracts.token.connect(Alice).mint(ONEETH.mul(100))
            await contracts.token.connect(Bob).mint(ONEETH.mul(200))
            CommodusOption = '0x' + '0'.repeat(24) + Commodus.address.slice(2,)
            let contesters: Array<string> = [CommodusOption, ethers.constants.MaxUint256.toHexString()]
            let votingParams = abi.encode(
                ["uint48", "uint256", "uint8", "address", "bytes32[]"],
                [0, VOTING_DURATION, rounds, contracts.token.address, contesters])
            votingOptions = abi.encode(["bytes32[]"],[[CommodusOption]]);
            let identifierProposeImperator = (await contracts.tournament.getCurrentIndex()).toNumber()
            await contracts.integrator.connect(Alice).start(votingParams, proposeImperatorCalldata);
            let identifierFail = (await contracts.tournament.getCurrentIndex()).toNumber()
            await contracts.integrator.connect(Alice).start(votingParams, failCalldata);
            let timestamp = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
            instanceInfoProposeImperator = {timestamp, identifier: identifierProposeImperator}
            instanceInfoFail = {timestamp, identifier: identifierFail}
        })
        it("Should implement the callback data with the winner inserted.", async function(){
            await contracts.tournament.connect(Bob).vote(instanceInfoProposeImperator.identifier, votingOptions)
            await ethers.provider.send('evm_setNextBlockTimestamp', [instanceInfoProposeImperator.timestamp + VOTING_DURATION + 1]);   
            await contracts.tournament.connect(Alice).triggerNextRound(instanceInfoProposeImperator.identifier)
            await expect(contracts.tournament.implement(instanceInfoProposeImperator.identifier, proposeImperatorCalldata))
                .to.emit(contracts.tournament, "Implemented")
                .withArgs(instanceInfoProposeImperator.identifier)
            expect(await contracts.tournament.getStatus(instanceInfoProposeImperator.identifier))
                .to.equal(VotingStatus.completed)
        })
        it("Should implement the callback data directly through implement when condition is met.", async function(){
            await contracts.tournament.connect(Bob).vote(instanceInfoProposeImperator.identifier, votingOptions)
            await ethers.provider.send('evm_setNextBlockTimestamp', [instanceInfoProposeImperator.timestamp + VOTING_DURATION + 1]);
            await expect(contracts.tournament.implement(instanceInfoProposeImperator.identifier, proposeImperatorCalldata))
                .to.emit(contracts.tournament, "Implemented")
                .withArgs(instanceInfoProposeImperator.identifier)
            expect(await contracts.tournament.getStatus(instanceInfoProposeImperator.identifier))
                .to.equal(VotingStatus.completed)
        })
        it("Should implement the callback and the winner should claim his title.", async function(){
            await contracts.tournament.connect(Bob).vote(instanceInfoProposeImperator.identifier, votingOptions)
            await ethers.provider.send('evm_setNextBlockTimestamp', [instanceInfoProposeImperator.timestamp + VOTING_DURATION + 1]);   
            await contracts.tournament.connect(Alice).triggerNextRound(instanceInfoProposeImperator.identifier)
            expect(await contracts.integrator.imperator()).to.equal(zeroAddress)
            expect(await contracts.integrator.imperatorElect()).to.equal(zeroAddress)
            await contracts.tournament.implement(instanceInfoProposeImperator.identifier, proposeImperatorCalldata)
            expect(await contracts.integrator.imperator()).to.equal(zeroAddress)
            expect(await contracts.integrator.imperatorElect()).to.equal(Commodus.address)
            await contracts.integrator.connect(Commodus).claimImperatorship()
            expect(await contracts.integrator.imperator()).to.equal(Commodus.address)
            expect(await contracts.integrator.imperatorElect()).to.equal(zeroAddress)
        })
        it("Should revert when the wrong callback data is passed into the implement function.", async function(){
            await contracts.tournament.connect(Bob).vote(instanceInfoProposeImperator.identifier, votingOptions)
            await ethers.provider.send('evm_setNextBlockTimestamp', [instanceInfoProposeImperator.timestamp + VOTING_DURATION + 1]);
            await expect(contracts.tournament.implement(instanceInfoProposeImperator.identifier, failCalldata))
                .to.be.revertedWith(`InvalidCalldata()`)
        })
        it("Should revert when implement is called when the status is not awaiting a call.", async function(){
            
            // First the case that the voting has not finished and we are one round behind
            let expectedStatus = ethers.utils.solidityPack(["uint248", "uint8"], [1, VotingStatus.awaitcall + rounds])
            await expect(contracts.tournament.implement(instanceInfoProposeImperator.identifier, proposeImperatorCalldata))
                .to.be.revertedWith(`ImplementingNotPermitted(${instanceInfoProposeImperator.identifier}, ${parseInt(expectedStatus)})`)
            // Next the case that the voting instance is inactive (not started yet)
            let identifierDoesntExist: number = 999;
            await expect(contracts.tournament.implement(identifierDoesntExist, proposeImperatorCalldata))
                .to.be.revertedWith(`ImplementingNotPermitted(${identifierDoesntExist}, ${0})`)
        })
        it("Should revert when implement is called on a failed status or about to fail status.", async function(){
            
            await ethers.provider.send('evm_setNextBlockTimestamp', [instanceInfoProposeImperator.timestamp + VOTING_DURATION + 1]);   
            await contracts.tournament.connect(Alice).triggerNextRound(instanceInfoProposeImperator.identifier)
            // expect(await contracts.tournament.getStatus(instanceInfoProposeImperator.identifier)).to.equal(VotingStatus.failed)
            await expect(contracts.tournament.implement(instanceInfoProposeImperator.identifier, proposeImperatorCalldata))
                .to.be.revertedWith(`ImplementingNotPermitted(${instanceInfoProposeImperator.identifier}, ${VotingStatus.failed})`)
            
        })
        it("Should set the status to failed whent the low-level implementation call reverted.", async function(){
            await contracts.tournament.connect(Bob).vote(instanceInfoFail.identifier, votingOptions)
            await ethers.provider.send('evm_setNextBlockTimestamp', [instanceInfoFail.timestamp + VOTING_DURATION + 1]);   
            await contracts.tournament.connect(Alice).triggerNextRound(instanceInfoFail.identifier)
            expect(await contracts.tournament.getStatus(instanceInfoFail.identifier))
                .to.equal(VotingStatus.awaitcall)
            await expect(contracts.tournament.implement(instanceInfoFail.identifier, failCalldata))
                .to.emit(contracts.tournament, "NotImplemented")
                .withArgs(instanceInfoFail.identifier)
            
        })
    })


});