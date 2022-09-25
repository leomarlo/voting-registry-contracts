import { expect } from "chai";
import { keccak256, Result } from "ethers/lib/utils";
import { ContractReceipt, BigNumber } from "ethers";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { IVOTINGCONTRACT_ID, IERC165_ID } from "../../scripts/utils/interfaceIds";
import { getEventArgs } from "../../scripts/utils/getEventArgs";

import {
    ControllableRegistrar,
    VotingRegistry,
    SimpleSnapshotWithoutToken, 
    MajorityVoteWithNFTQuorumAndOptionalDVGuard,
    ResolverWithControl
} from "../../typechain"

import { ControllableRegistrarInterface } from "../../typechain/ControllableRegistrar";


interface Contracts {
    registry: VotingRegistry
    snapshot: SimpleSnapshotWithoutToken
    majority: MajorityVoteWithNFTQuorumAndOptionalDVGuard,
    registrar: ControllableRegistrar
    resolver: ResolverWithControl
}

const abi = ethers.utils.defaultAbiCoder 

let addreee : string = ethers.utils.getAddress("0x" + "e".repeat(40))

let APPROVE = abi.encode(["uint256"],[1])

let VotingStatus = {
    "inactive": 0,
    "completed": 1,
    "failed": 2,
    "active": 3,
    "awaitcall": 4
}

describe("Controllable Registrar with Bytecode Deployment", function(){
    let contracts: Contracts;
    let Alice: SignerWithAddress;
    let Bob: SignerWithAddress;
    let SnapshotBytecode: string;
    let registrarInterface: ControllableRegistrarInterface;
    beforeEach( async function(){
        [Alice, Bob] = await ethers.getSigners()

        let RegistryFactory = await ethers.getContractFactory("VotingRegistry")
        let registry: VotingRegistry = await RegistryFactory.connect(Alice).deploy(`${IVOTINGCONTRACT_ID}`)
        await registry.deployed()


        let MajorityFactory = await ethers.getContractFactory("MajorityVoteWithNFTQuorumAndOptionalDVGuard")
        let majority: MajorityVoteWithNFTQuorumAndOptionalDVGuard = await MajorityFactory.connect(Alice).deploy()
        await majority.deployed()

        let SnapshotFactory = await ethers.getContractFactory("SimpleSnapshotWithoutToken")
        let snapshot: SimpleSnapshotWithoutToken = await SnapshotFactory.connect(Alice).deploy()
        await snapshot.deployed()
        SnapshotBytecode = SnapshotFactory.bytecode;

        let ResolverFactory = await ethers.getContractFactory("ResolverWithControl")
        let resolver: ResolverWithControl = await ResolverFactory.connect(Alice).deploy() 
        await resolver.deployed()

        let RegistrarFactory = await ethers.getContractFactory("ControllableRegistrar")
        let registrar: ControllableRegistrar = await RegistrarFactory.connect(Alice).deploy(
            majority.address,
            registry.address,
            resolver.address,
            "Test Registrar",
            "Reg")
        await registrar.deployed()
        registrarInterface = registrar.interface;

        await resolver.connect(Alice).setRegistrar(registrar.address);

        contracts = {
            registrar,
            majority,
            snapshot,
            registry,
            resolver
        }
    })

    describe("Registrar - Registration", function(){
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
    describe("Registrar - Ownership of the registration", function(){
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
    
    describe("Registrar - Change controlled keys for resolver", function(){
        let isProxyKey : string;
        beforeEach(async function(){
            isProxyKey = ethers.utils.keccak256(abi.encode(["string"],["metadata.isproxy"]));
            await contracts.registrar.connect(Alice).register(contracts.snapshot.address, contracts.resolver.address, Bob.address)
        })
        it("Should revert when trying to update the registrar controlled keys without vote.",async function(){
            await expect(contracts.registrar.connect(Bob).changeRegistrarControlledKeys(isProxyKey, true))
                .to.be.revertedWith(`'OnlyVoteImplementer("${Bob.address}")'`)
        })
        it("Should revert when trying to change the registrar controlled keys on the resolver.", async function(){
            await expect(contracts.resolver.connect(Bob).changeRegistrarControlledKeys(isProxyKey, true))
                .to.be.revertedWith(`'IsNotRegistrar("${Bob.address}", "${contracts.registrar.address}")'`)
        })
        it("Should update the registrar controlled keys by vote.",async function(){
            let quorumInHolders : number = 1;
            let tokenAddress : string = contracts.registrar.address
            let votingDuration : number = 5555;
            let expectReturnFlag : boolean = true;
            let guardOnSenderVotingDataOrNone : boolean = true;
            let changeControllKeyCalldata : string = registrarInterface.encodeFunctionData("changeRegistrarControlledKeys",[isProxyKey, true])
            let votingParams : string = abi.encode(
                ["address", "uint256", "uint256", "bool", "bool"],
                [tokenAddress, votingDuration, quorumInHolders, expectReturnFlag, guardOnSenderVotingDataOrNone])
            await contracts.registrar.start(votingParams, changeControllKeyCalldata)
            let identifier: number = 0
            await contracts.majority.connect(Bob).vote(identifier, APPROVE)
            let timestamp = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
            await ethers.provider.send('evm_setNextBlockTimestamp', [timestamp + votingDuration + 1]); 
            await contracts.majority.connect(Bob).implement(identifier,changeControllKeyCalldata)
            expect(await contracts.majority.getStatus(identifier)).to.equal(VotingStatus.completed)
        })
    });
    describe("Resolver", function(){
        let newKey : string = "voterSettings.duration"
        let newKeyBytes : string = ethers.utils.keccak256(abi.encode(["string"],[newKey]));
            
        beforeEach(async function(){
            await contracts.registrar.connect(Alice).register(contracts.snapshot.address, contracts.resolver.address, Bob.address)
            
        })
        it("Should add new key-value pairs to the resolver by the controller (ERC721-owner).", async function(){
            await expect(contracts.resolver.connect(Bob).setInformation(newKeyBytes, contracts.snapshot.address,1))
                .to.not.be.reverted;
        })
        it("Should get key-value pairs either from the string input or from bytes32.", async function(){
            expect(await contracts.resolver["getInformation(bytes32,address)"](newKeyBytes,contracts.snapshot.address)).to.equal(0)
            await contracts.resolver.connect(Bob).setInformation(newKeyBytes, contracts.snapshot.address,1);
            expect(await contracts.resolver["getInformation(string,address)"](newKey,contracts.snapshot.address)).to.equal(1)
            expect(await contracts.resolver["getInformation(bytes32,address)"](newKeyBytes,contracts.snapshot.address)).to.equal(1)
        })
        it("Should revert the attempt to add a new key-value pair, when caller is not the controller (ERC721-owner).", async function(){
            expect(await contracts.resolver["getInformation(bytes32,address)"](newKeyBytes,contracts.snapshot.address)).to.equal(0)
            await expect(contracts.resolver.connect(Alice).setInformation(newKeyBytes, contracts.snapshot.address,1))
                .to.be.revertedWith(`'NotAuthorized("${Alice.address}", "${Bob.address}")'`);
            expect(await contracts.resolver["getInformation(bytes32,address)"](newKeyBytes,contracts.snapshot.address)).to.equal(0)
        })
        it("Should revert the attempt to add a new key-value pair for keys that are controlled by the registrar.", async function(){
            let quorumInHolders : number = 1;
            let tokenAddress : string = contracts.registrar.address
            let votingDuration : number = 5555;
            let expectReturnFlag : boolean = true;
            let guardOnSenderVotingDataOrNone : boolean = true;
            let changeControllKeyCalldata : string = registrarInterface.encodeFunctionData("changeRegistrarControlledKeys",[newKeyBytes, true])
            let votingParams : string = abi.encode(
                ["address", "uint256", "uint256", "bool", "bool"],
                [tokenAddress, votingDuration, quorumInHolders, expectReturnFlag, guardOnSenderVotingDataOrNone])
            await contracts.registrar.start(votingParams, changeControllKeyCalldata)
            let identifier: number = 0
            await contracts.majority.connect(Bob).vote(identifier, APPROVE)
            let timestamp = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
            await ethers.provider.send('evm_setNextBlockTimestamp', [timestamp + votingDuration + 1]);
            await contracts.majority.connect(Bob).implement(identifier, changeControllKeyCalldata)
            expect(await contracts.resolver["getInformation(bytes32,address)"](newKeyBytes, contracts.snapshot.address)).to.equal(0)
            await expect(contracts.resolver.connect(Alice).setInformation(newKeyBytes, contracts.snapshot.address,1))
                .to.be.revertedWith(`'NotAuthorized("${Alice.address}", "${contracts.registrar.address}")'`);
            expect(await contracts.resolver["getInformation(bytes32,address)"](newKeyBytes, contracts.snapshot.address)).to.equal(0)
        })
    })
    describe("Registrar - set new key-values.", function(){
        
        let newKeyBytes : string = ethers.utils.keccak256(abi.encode(["string"],["voterSettings.duration"]));
        let isProxyKeyBytes : string = ethers.utils.keccak256(abi.encode(["string"],["metadata.isproxy"]));
        let quorumInHolders : number = 1;
        let tokenAddress : string;
        let votingDuration : number = 5555;
        let expectReturnFlag : boolean = true;
        let guardOnSenderVotingDataOrNone : boolean = true;
        beforeEach(async function(){
            tokenAddress = contracts.registrar.address
            await contracts.registrar.connect(Alice).register(contracts.snapshot.address, contracts.resolver.address, Bob.address)
            let changeControllKeyCalldata : string = registrarInterface.encodeFunctionData("changeRegistrarControlledKeys",[newKeyBytes, true])
            let votingParams : string = abi.encode(
                ["address", "uint256", "uint256", "bool", "bool"],
                [tokenAddress, votingDuration, quorumInHolders, expectReturnFlag, guardOnSenderVotingDataOrNone])
            let identifier: number = 0
            await expect(contracts.registrar.connect(Alice).start(votingParams, changeControllKeyCalldata))
                .to.emit(contracts.majority,'VotingInstanceStarted')
                .withArgs(identifier, contracts.registrar.address)
            await contracts.majority.connect(Bob).vote(identifier, APPROVE)
            let timestamp = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
            await ethers.provider.send('evm_setNextBlockTimestamp', [timestamp + votingDuration + 1]); 
            await contracts.majority.connect(Bob).implement(identifier,changeControllKeyCalldata) 
        })
        it("Should revert when trying to set a key-value pair through the registrar without a vote.", async function(){
            await expect(contracts.registrar.connect(Bob).setInformation(newKeyBytes, contracts.snapshot.address,1))
                .to.be.revertedWith(`'OnlyVoteImplementer("${Bob.address}")'`)
        })
        it("Should set a new key-value through registrar vote", async function(){
            let newValue: number = 99;
            let setInformationCalldata : string = registrarInterface.encodeFunctionData("setInformation",[newKeyBytes, contracts.snapshot.address, newValue])
            let votingParams : string = abi.encode(
                ["address", "uint256", "uint256", "bool", "bool"],
                [tokenAddress, votingDuration, quorumInHolders, expectReturnFlag, guardOnSenderVotingDataOrNone])
            let identifier: number = 1
            await expect(contracts.registrar.connect(Alice).start(votingParams, setInformationCalldata))
                .to.emit(contracts.majority,'VotingInstanceStarted')
                .withArgs(identifier, contracts.registrar.address)
            await contracts.majority.connect(Bob).vote(identifier, APPROVE)
            let timestamp = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
            await ethers.provider.send('evm_setNextBlockTimestamp', [timestamp + votingDuration + 1]); 
            await contracts.majority.connect(Bob).implement(identifier,setInformationCalldata) 
            expect(await contracts.majority.getStatus(identifier)).to.equal(VotingStatus.completed)
            expect(await contracts.resolver["getInformation(bytes32,address)"](newKeyBytes, contracts.snapshot.address)).to.equal(newValue)
        })
        it("Should not be able to set a new key-value through registrar vote, when the key is not controlled by registrar.", async function(){
            let newValue: number = 99;
            let setInformationCalldata : string = registrarInterface.encodeFunctionData("setInformation",[isProxyKeyBytes, contracts.snapshot.address, newValue])
            let votingParams : string = abi.encode(
                ["address", "uint256", "uint256", "bool", "bool"],
                [tokenAddress, votingDuration, quorumInHolders, expectReturnFlag, guardOnSenderVotingDataOrNone])
            let identifier: number = 1
            await expect(contracts.registrar.connect(Alice).start(votingParams, setInformationCalldata))
                .to.emit(contracts.majority,'VotingInstanceStarted')
                .withArgs(identifier, contracts.registrar.address)
            await contracts.majority.connect(Bob).vote(identifier, APPROVE)
            let timestamp = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
            await ethers.provider.send('evm_setNextBlockTimestamp', [timestamp + votingDuration + 1]); 
            await expect(contracts.majority.connect(Bob).implement(identifier,setInformationCalldata))
                .to.be.reverted;
            // expect(await contracts.majority.getStatus(identifier)).to.equal(VotingStatus.awaitcall)
            
        })
    })
})
