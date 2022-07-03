import { expect } from "chai";
import { Result } from "ethers/lib/utils";
import { ContractReceipt, BigNumber } from "ethers";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import {
    ImplementMajorityVote,
    Counter
} from "../../typechain"

interface Contracts {
    majority: ImplementMajorityVote
    counter: Counter
}

interface IdentifierAndTimestamp {
    identifier: number,
    timestamp: number
}



describe("Implement Majority Vote", function(){

    let contracts: Contracts;
    let Alice: SignerWithAddress;
    let Bob: SignerWithAddress;
    beforeEach(async function() {
        [Alice, Bob] = await ethers.getSigners()   
        let MajorityFactory = await ethers.getContractFactory("ImplementMajorityVote")
        let majority: ImplementMajorityVote = await MajorityFactory.connect(Alice).deploy()
        await majority.deployed()
        let CounterFactory = await ethers.getContractFactory("Counter")
        let counter: Counter = await CounterFactory.connect(Alice).deploy()
        await counter.deployed()
        
        contracts = {majority, counter}
    });

    describe("Deployment", function(){
        it("Should instantiate the public state variable 'VOTING_DURATION'.", async ()=> {
            expect(await contracts.majority.VOTING_DURATION()).to.equal(BigNumber.from("432000"))
        });
        it("Should instantiate the counter variable of the target contract with zero.", async function(){
            expect(await contracts.counter.i()).to.equal(0)
        })
    });
});