import { expect } from "chai";
import { Result } from "ethers/lib/utils";
import { ContractReceipt, BigNumber } from "ethers";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { IVOTINGCONTRACT_ID, IERC165_ID } from "../../scripts/interfaceIds";
import { getEventArgs } from "../../scripts/getEventArgs";

import {
    TournamentTest
} from "../../typechain"


interface Contracts {
    test: TournamentTest
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

let One = abi.encode(["uint256"],[1])
let Two = abi.encode(["uint256"],[2])
let Three = abi.encode(["uint256"],[3])
let Six = abi.encode(["uint256"],[6])
let Number: number = 11;
let State: string = abi.encode(["uint256"],[(2**Number)-1])
let exampleVote : number = 0;
let exampleVoteNumbers = [1,3,4,7,8,9]
let exampleVoteBinary = [true,false,true,true,false,false,true,true,true,false,false]
for (let j=0; j<exampleVoteNumbers.length; j++){
    exampleVote += 2**(exampleVoteNumbers[j] - 1);
}
let exampleVoteBytes : string = abi.encode(["uint256"],[exampleVote])

describe("Tournament Test", function(){
    let contracts: Contracts;
    let Alice: SignerWithAddress;
    let Bob: SignerWithAddress;
    beforeEach(async function() {
        [Alice, Bob] = await ethers.getSigners()   
        let TestFactory = await ethers.getContractFactory("TournamentTest")
        let test: TournamentTest = await TestFactory.connect(Alice).deploy()
        await test.deployed()
        contracts = {test}
    });
    it("Should add bit-wise", async function(){
        
        expect(await contracts.test.addBitwise(One,Three))
            .to.equal(One)
        expect(await contracts.test.addBitwise(Three,Six))
            .to.equal(Two)
    })
    it("Should create the correct initial state", async function(){
        
        expect(await contracts.test.state()).to.equal(ethers.constants.HashZero)
        await contracts.test.start(Number)
        expect(await contracts.test.state()).to.equal(State)
        for (let i=1; i<=Number; i++){
            expect(await contracts.test.getStateOf(i)).to.equal(true)
        }
        expect(await contracts.test.getStateOf(Number + 1)).to.equal(false)
    })
    it("Should cast a collective vote for that round", async function(){
        await contracts.test.start(Number)
        await contracts.test.collectiveVote(exampleVoteBytes)
        for (let j=0; j<exampleVoteNumbers.length; j++){
            expect(await contracts.test.getStateOf(exampleVoteNumbers[j])).to.equal(true)
        }
    })


})