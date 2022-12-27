import { ethers, network } from "hardhat";
import { keccak256 } from "ethers/lib/utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { IVOTINGCONTRACT_ID, IERC165_ID } from "../../utils/interfaceIds";
import { ContractDeploymentInfo } from "../../interfaces/deployment"
import { durations, types as pgSetting } from "../../utils/playgroundVotingContracts";
import { VotingPlaygroundInterface } from "../../../typechain/VotingPlayground";
import {  basePath } from "../../utils/paths";
import { BigNumber } from "ethers";


import {
  VotingPlayground
} from "../../../typechain"


const abi = ethers.utils.defaultAbiCoder


async function deployOnlyPlaygroundAndBadge(
    signer: SignerWithAddress, 
    registryAddress: string,
    majorityWithNftTokenAddress: string,
    majorityWithoutTokenAddress: string,
    minQuorum: number,
    gasPrice: BigNumber, 
    verbosity: number): Promise<ContractDeploymentInfo>
{

    let BadgeFactory = await ethers.getContractFactory("PlaygroundVotingBadge")
    const playgroundMockup = await ethers.getContractAt("VotingPlayground", ethers.constants.AddressZero);
    let playgroundInterface = playgroundMockup.interface;


    let flagAndSelectors : Array<string> = []
    let votingContracts : Array<string> = []
    let minDurations : Array<number> = []
    let minQuorums : Array<number> = []
    let badgeWeightedVote : Array<boolean> = []

    let functions = Object.keys(pgSetting)
    for (let i=0; i<functions.length; i++){
        let fct : string = functions[i].toString();
        flagAndSelectors.push(
            (pgSetting[fct].security=="secure" ? "0x01": "0x00") + playgroundInterface.getSighash(fct).slice(2,)
        )
        votingContracts.push(
            pgSetting[fct].badgeWeightedVote ? majorityWithNftTokenAddress : majorityWithoutTokenAddress
        )
        badgeWeightedVote.push(pgSetting[fct].badgeWeightedVote as boolean)
        if (pgSetting[fct].duration)
        minDurations.push(pgSetting[fct].duration as number)
        minQuorums.push(minQuorum)
    }

    let votingBadgeName = "Playground Voting Badge"
    let votingBadgeSymbol = "PLAY"
    let deployArguments = abi.encode(["string", "string"],[votingBadgeName, votingBadgeSymbol])
    let rawByteCode = BadgeFactory.bytecode + deployArguments.slice(2,);
    let hashedBytecode = keccak256(rawByteCode)

    let contractName: string = "VotingPlayground"
    let PlaygroundFactory = await ethers.getContractFactory("VotingPlayground")
    let playground: VotingPlayground 


    if (gasPrice > BigNumber.from("0")){
        // let gasLimit: BigNumber =  BigNumber.from("603731")
        
        playground = await PlaygroundFactory.connect(signer).deploy(
            registryAddress,
            flagAndSelectors,
            votingContracts,
            minDurations,
            minQuorums,
            badgeWeightedVote,
            hashedBytecode,
            {gasPrice}
        )
    } else {
        playground = await PlaygroundFactory.connect(signer).deploy(
            registryAddress,
            flagAndSelectors,
            votingContracts,
            minDurations,
            minQuorums,
            badgeWeightedVote,
            hashedBytecode
        )   

    }

    
    let playgroundTx = await playground.deployed() 

    let info: ContractDeploymentInfo = {} as ContractDeploymentInfo
    info = Object.assign(info, { "VotingPlayground": 
      {
        "address": playground.address,
        "date": Date().toLocaleString(),
        "gasLimit": playgroundTx.deployTransaction.gasLimit.toNumber(),    
        "path": basePath + "implementations/registration/RegistrarAndResolver.sol",
        "arguments": [
            `"${registryAddress}"`,
            `[${flagAndSelectors.map((e) => (`"${e}"`)).join(',')}]`,
            `[${votingContracts.map((e) => (`"${e}"`)).join(',')}]`,
            `[${minDurations.map((e) => (e.toString())).join(',')}]`,
            `[${minQuorums.map((e) => (e.toString())).join(',')}]`,
            `[${badgeWeightedVote.map((e) => (e.toString())).join(',')}]`,
            `"${hashedBytecode}"`
        ]
      }})

    if (verbosity>0) console.log(`--> Deployed ${contractName}`)
    if (verbosity>1) console.log(`\t address: ${playground.address}\n\t network: ${network.name}`)
      
    contractName = "PlaygroundVotingBadge"
    let receipt = await playground.connect(signer).deployNewBadge(ethers.constants.HashZero, rawByteCode, signer.address)
    await receipt.wait()
    let badgeAddress = await playground.badges(0)

    info = Object.assign(info, { "PlaygroundVotingBadge": 
      {
        "address": badgeAddress,
        "date": Date().toLocaleString(),
        "gasLimit": receipt.gasLimit.toNumber(),    
        "path": basePath + "examples/playground/VotingBadge.sol",
        "arguments": [
            `"${votingBadgeName}"`,
            `"${votingBadgeSymbol}"`
        ]
      }}) 
       
    
    if (verbosity>0) console.log(`--> Deployed ${contractName}`)
    if (verbosity>1) console.log(`\t address: ${badgeAddress}\n\t network: ${network.name}`)
    
    return info
}

async function startVotingInstances(
    signer: SignerWithAddress, 
    playgroundAddress: string,
    dummyNFTAddress: string,
    minQuorum: number,
    expectReturnValue: boolean,
    verbosity: number)
{
    // get constants:
    let DISAPPROVE = abi.encode(["uint256"],[0])
    let APPROVE = abi.encode(["uint256"],[1])
    
    // get playground and badge address
    let playground = await ethers.getContractAt("VotingPlayground",playgroundAddress,signer)
    let badgeAddress = await playground.badges(0)
    let badge = await ethers.getContractAt("PlaygroundVotingBadge", badgeAddress, signer)
    let nft = await ethers.getContractAt("DummyNFT", dummyNFTAddress, signer)
    // get sighashes 
    let fragments = ["changeCounter", "changeOperation", "newIncumbent", "setMinXpToStartAnything", "approveNFT"]
    let sigHashes = fragments.map((frag)=> playground.interface.getSighash(frag))
    
    const getVotingContracts = async ()=>{
        let votingContractsTemp : Array<string> = []
        for (let i=0; i<sigHashes.length; i++){
            let contract = await playground.getAssignedContract(sigHashes[i])
            votingContractsTemp.push(contract)
        } 
        return votingContractsTemp
    }
    let votingContracts = await getVotingContracts()
 
    let majorityVCWithoutNFTWeight = await ethers.getContractAt("PlainMajorityVoteWithQuorum", votingContracts[1], signer)
    let majorityVCWithNFTWeight = await ethers.getContractAt("MajorityVoteWithNFTQuorumAndOptionalDVGuard", votingContracts[0], signer) 

    const Operation = {add:0, subtract:1, divide:2, multiply:3, modulo:4, exponentiate:5}
    let ApprovalType = {"limitedApproval":0, "unapproveAll":1, "approveAll":2}

    // start voting instances
    let k = 0
    if (verbosity>0) console.log(`The function ${fragments[k]} is called using voting contract ${votingContracts[k]}`)
    let changeCounterBy = 3
    let guardOnSenderVotingDataOrNone: number = 2;
    let callback = playground.interface.encodeFunctionData("changeCounter",[changeCounterBy])
    // let counterVotingMetaParams = await playground.votingMetaParams(sigHashes[k])
    let regularVotingParams = abi.encode(
        ["address", "uint256", "uint256", "bool", "uint8"],
        [badgeAddress, pgSetting.changeCounter.duration, minQuorum, expectReturnValue, guardOnSenderVotingDataOrNone])
    let voteSigHash = playground.interface.getSighash("vote")
    let tx = await playground.connect(signer).start(regularVotingParams, callback)
    await tx.wait()
    tx = await playground.connect(signer).vote(k, APPROVE)
    await tx.wait()
    // let tokenId = await playground.calculateId(0, voteSigHash, majorityVCWithNFTWeight.address, signer.address)
    // let ownerTokenId = await badge.ownerOf(tokenId)
    // if (verbosity>0) console.log(`The owner of the token ${tokenId} is ${ownerTokenId}`)
    // await badge.connect(signer).transferFrom(ownerTokenId, playground.address, tokenId)
    tx = await nft.connect(signer).freeMint()
    await tx.wait()
    let tokenId = 0
    let ownerTokenId = await nft.ownerOf(tokenId)
    if (verbosity>0) console.log(`Now the owner of the token ${tokenId} is ${ownerTokenId}`)

    k = 1
    if (verbosity>0) console.log(`The function ${fragments[k]} is called using voting contract ${votingContracts[k]}`)
    let duration = pgSetting.changeOperation.duration as number
    let votingParams = abi.encode(
        ["address", "uint256", "uint256", "bool"],
        [playgroundAddress, minQuorum, duration,  expectReturnValue])
    callback = playground.interface.encodeFunctionData("changeOperation",[Operation.multiply])
    tx = await playground.connect(signer).start(votingParams, callback)
    let receipt = await tx.wait()
    let instanceInfo = await playground.instances(k)
    if (verbosity>0) console.log(`The instance info is `, instanceInfo)
    tx = await majorityVCWithoutNFTWeight.connect(signer).vote(instanceInfo.identifier, APPROVE)
    await tx.wait()

    k = 2 
    if (verbosity>0) console.log(`The function ${fragments[k]} is called using voting contract ${votingContracts[k]}`)
    duration = pgSetting.newIncumbent.duration as number
    votingParams = abi.encode(
        ["address", "uint256", "uint256", "bool", "uint8"],
        [badge.address, duration, minQuorum, expectReturnValue, guardOnSenderVotingDataOrNone])
    let newOffice: string = "Gluon"
    callback = playground.interface.encodeFunctionData("newIncumbent", [newOffice, signer.address])
    tx = await playground.connect(signer).start(votingParams, callback)
    await tx.wait()
    await playground.connect(signer).vote(k, APPROVE)

    k = 3 
    if (verbosity>0) console.log(`The function ${fragments[k]} is called using voting contract ${votingContracts[k]}`)
    duration = pgSetting.setMinXpToStartThisFunction.duration as number
    votingParams = abi.encode(
        ["address", "uint256", "uint256", "bool", "uint8"],
        [badge.address, duration, minQuorum, expectReturnValue, guardOnSenderVotingDataOrNone])
    let newMinXP = 3;
    let changeOperationSig = playground.interface.getSighash("changeOperation")
    callback = playground.interface.encodeFunctionData(
        "setMinXpToStartThisFunction", [changeOperationSig, newMinXP])
    tx = await playground.connect(signer).start(votingParams, callback)
    await tx.wait()
    await playground.connect(signer).vote(k, DISAPPROVE)

    k = 4
    if (verbosity>0) console.log(`The function ${fragments[k]} is called using voting contract ${votingContracts[k]}`)
    duration = pgSetting.approveNFT.duration as number
    votingParams = abi.encode(
                ["address", "uint256", "uint256", "bool", "uint8"],
                [badge.address, duration, minQuorum, expectReturnValue, guardOnSenderVotingDataOrNone])
    let callbackLimited = playground.interface.encodeFunctionData("approveNFT", 
                [nft.address, signer.address, tokenId, ApprovalType.limitedApproval])
    tx = await playground.connect(signer).start(votingParams, callbackLimited)
    await tx.wait()
    await playground.connect(signer).vote(k, APPROVE)
}

export {
    deployOnlyPlaygroundAndBadge,
    startVotingInstances
}