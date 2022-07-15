import { expect } from "chai";
import { Result } from "ethers/lib/utils";
import { ContractReceipt, BigNumber } from "ethers";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { IVOTINGCONTRACT_ID, IERC165_ID } from "../../scripts/interfaceIds";
import { getEventArgs } from "../../scripts/getEventArgs";

import {
    ControllableRegistrar,
    VotingRegistry,
    SimpleSnapshotWithoutToken, 
    MajorityVoteWithNFTQuorumAndOptionalDVGuard,
    ResolverWithControl
} from "../../typechain"


interface Contracts {
    registry: VotingRegistry
    snapshot: SimpleSnapshotWithoutToken
    majority: MajorityVoteWithNFTQuorumAndOptionalDVGuard,
    registrar: ControllableRegistrar
    resolver: ResolverWithControl
}

const abi = ethers.utils.defaultAbiCoder 

let addreee : string = ethers.utils.getAddress("0x" + "e".repeat(40))

describe("Controllable Registrar with Bytecode Deployment", function(){
    let contracts: Contracts;
    let Alice: SignerWithAddress;
    let Bob: SignerWithAddress;
    let SnapshotBytecode: string;
    beforeEach( async function(){
        [Alice, Bob] = await ethers.getSigners()

        let RegistryFactory = await ethers.getContractFactory("VotingRegistry")
        let registry: VotingRegistry = await RegistryFactory.connect(Alice).deploy(`${IVOTINGCONTRACT_ID}`)
        await registry.deployed()

        let ResolverFactory = await ethers.getContractFactory("ResolverWithControl")

        let MajorityFactory = await ethers.getContractFactory("MajorityVoteWithNFTQuorumAndOptionalDVGuard")
        let majority: MajorityVoteWithNFTQuorumAndOptionalDVGuard = await MajorityFactory.connect(Alice).deploy()
        await majority.deployed()

        let SnapshotFactory = await ethers.getContractFactory("SimpleSnapshotWithoutToken")
        let snapshot: SimpleSnapshotWithoutToken = await SnapshotFactory.connect(Alice).deploy()
        await snapshot.deployed()
        SnapshotBytecode = SnapshotFactory.bytecode;

        let RegistrarFactory = await ethers.getContractFactory("ControllableRegistrar")
        let registrar: ControllableRegistrar = await RegistrarFactory.connect(Alice).deploy(
            majority.address,
            registry.address,
            "TestRegistrar",
            "REG",
            abi.encode(["uint256"],[1]),
            ResolverFactory.bytecode)
        await registrar.deployed()

        let resolver: ResolverWithControl = await ethers.getContractAt("ResolverWithControl", await registrar.RESOLVER(), Alice)
        
        contracts = {
            registrar,
            majority,
            snapshot,
            registry,
            resolver
        }
    })

    describe("Registration", function(){
        it("Should register a new voting contract via register", async function(){
            await expect(contracts.registrar.connect(Alice).register(contracts.snapshot.address, contracts.resolver.address, Bob.address))
                .to.emit(contracts.registry, 'Registered')
                .withArgs(contracts.snapshot.address, contracts.registrar.address, contracts.resolver.address)
        })
        it("Should register a new voting contract via deployAndRegister.", async function(){
            await expect(contracts.registrar.connect(Alice).deployAndRegister(abi.encode(["uint256"],[1]), SnapshotBytecode))
                .to.emit(contracts.registry, 'Registered')
        })
    })
    describe("Ownership of the registration", function(){
        it("Should mint an ERC721 token upon registration",async function(){
            expect(await contracts.registrar.balanceOf(Bob.address)).to.equal(0)
            await expect(contracts.registrar.connect(Alice).register(contracts.snapshot.address, contracts.resolver.address, Bob.address))
                .to.emit(contracts.registrar, "Transfer")
                .withArgs(
                    ethers.constants.AddressZero,
                    Bob.address,
                    abi.encode(["address"],[contracts.snapshot.address]))
            expect(await contracts.registrar.balanceOf(Bob.address)).to.equal(1)
        })
        it("Should transfer ownership.", async function(){
            expect(await contracts.registrar.balanceOf(Alice.address)).to.equal(0)
            expect(await contracts.registrar.balanceOf(Bob.address)).to.equal(0)
            await contracts.registrar.connect(Alice).register(contracts.snapshot.address, contracts.resolver.address, Bob.address)
            expect(await contracts.registrar.balanceOf(Alice.address)).to.equal(0)
            expect(await contracts.registrar.balanceOf(Bob.address)).to.equal(1)
            await expect(contracts.registrar.connect(Bob).transferFrom(Bob.address, Alice.address, abi.encode(["address"],[contracts.snapshot.address])))
                .to.emit(contracts.registrar, "Transfer")
                .withArgs(
                    Bob.address,
                    Alice.address,
                    abi.encode(["address"],[contracts.snapshot.address]))
            expect(await contracts.registrar.balanceOf(Alice.address)).to.equal(1)
            expect(await contracts.registrar.balanceOf(Bob.address)).to.equal(0)
                    
        })
    })
})
