import { expect } from "chai";
import { Result } from "ethers/lib/utils";
import { ContractReceipt, BigNumber } from "ethers";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { IVOTINGCONTRACT_ID, IERC165_ID } from "../../scripts/interfaceIds";
import { getEventArgs } from "../../scripts/getEventArgs";

import {
    SimpleSnapshotWithoutToken,
    VotingRegistry,
    DummyNFT
} from "../../typechain"


interface Contracts {
    registry: VotingRegistry
    snapshot: SimpleSnapshotWithoutToken
    token: DummyNFT
}

const abi = ethers.utils.defaultAbiCoder 

let addreff : string = ethers.utils.getAddress(abi.encode(["int256"],[-1]).slice(0,42))
let addreee : string = ethers.utils.getAddress("0x" + "e".repeat(40))

describe("Voting Registry", function(){
    let contracts: Contracts;
    let Alice: SignerWithAddress;
    let Bob: SignerWithAddress;
    beforeEach(async function() {
        [Alice, Bob] = await ethers.getSigners()  
        let RegistryFactory = await ethers.getContractFactory("VotingRegistry")
        let registry: VotingRegistry = await RegistryFactory.connect(Alice).deploy(`${IVOTINGCONTRACT_ID}`)
        await registry.deployed()

        let SnapshotFactory = await ethers.getContractFactory("SimpleSnapshotWithoutToken")
        let snapshot: SimpleSnapshotWithoutToken = await SnapshotFactory.connect(Alice).deploy()
        await snapshot.deployed()

        let TokenFactory = await ethers.getContractFactory("DummyNFT")
        let token: DummyNFT = await TokenFactory.connect(Alice).deploy()
        await token.deployed()
        
        contracts = {registry, snapshot, token}
    });

    describe("Registration", function(){
        it("Should register a voting contract.", async function(){
            await expect(contracts.registry.connect(Alice).register(contracts.snapshot.address, addreff))
                .to.emit(contracts.registry, 'Registered')
                .withArgs(contracts.snapshot.address, Alice.address, addreff)
        })
        it("Should retrieve the registrar and resolver after the registration.", async function(){
            await contracts.registry.connect(Alice).register(contracts.snapshot.address, addreff)
            expect(await contracts.registry.getRegistrar(contracts.snapshot.address))
                .to.equal(Alice.address)
            expect(await contracts.registry.getResolver(contracts.snapshot.address))
                .to.equal(addreff)
        })
        it("Should revert when trying to register an already registered voting contract.", async function(){
            await contracts.registry.connect(Alice).register(contracts.snapshot.address, addreff)
            await expect(contracts.registry.connect(Alice).register(contracts.snapshot.address, addreff))
                .to.be.revertedWith(`'AlreadyRegistered("${contracts.snapshot.address}", "${Alice.address}")'`)
        })
        it("Should revert when trying to register a contract that is ERC165 but not IVotingContract compliant.", async function(){
            await expect(contracts.registry.connect(Alice).register(contracts.token.address, addreff))
                .to.be.revertedWith(`'DoesNotSatisfyInterface("${contracts.token.address}")'`)
        })
        it("Should revert when trying to register a contract that is not ERC165 compliant.", async function(){
            await expect(contracts.registry.connect(Alice).register(contracts.registry.address, addreff))
                .to.be.reverted
        })
        
    })
    describe("Change Resolver", function(){
        it("Should change the resolver.", async function () {
            await contracts.registry.connect(Alice).register(contracts.snapshot.address, addreff)
            await expect(contracts.registry.connect(Alice).changeResolver(contracts.snapshot.address, addreee))
                .to.emit(contracts.registry, 'ResolverUpdated')
                .withArgs(addreee)
            expect(await contracts.registry.getResolver(contracts.snapshot.address))
                .to.equal(addreee)
        })
        it("Should revert when the call does not come from the registrar.", async function(){
            await contracts.registry.connect(Alice).register(contracts.snapshot.address, addreff)
            await expect(contracts.registry.connect(Bob).changeResolver(contracts.snapshot.address, addreee))
                .to.be.revertedWith(`'OnlyRegistrar("${Bob.address}", "${Alice.address}")'`)
        })
    })
    
})


