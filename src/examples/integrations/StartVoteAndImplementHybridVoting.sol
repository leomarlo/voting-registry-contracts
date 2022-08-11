// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

import {IImplementResult} from "../../extensions/interfaces/IImplementResult.sol";
import {
    OnlyVoteImplementer,
    AssignedContractPrimitive,
    SecurityThroughAssignmentPrimitive
} from "../../integration/primitives/AssignedContractPrimitive.sol";

import {
    StartVoteAndImplementHybridVotingImplRemoteMinml,
    StartVoteAndImplementHybridVotingImplRemoteHooks
} from "../../integration/abstracts/StartVoteAndImplementRemote.sol";

import {CounterPrimitive} from "../dummies/Counter.sol";



contract StartVoteAndImplementHybridVotingMinmlExample is 
CounterPrimitive,
AssignedContractPrimitive,
SecurityThroughAssignmentPrimitive,
StartVoteAndImplementHybridVotingImplRemoteMinml
{

    address public deployer;
    uint256 public votes;
    uint256 public implementations;
    
    constructor(address _votingContractOne, address _votingContractTwo) {
        // set the voting contract
        StartVoteAndImplementHybridVotingImplRemoteMinml.votingContract = _votingContractOne;
        // assign deployer
        deployer = msg.sender;
        // assign the votingContract the increment function.
        assignedContract[bytes4(keccak256("increment()"))] = _votingContractTwo;
        assignedContract[bytes4(keccak256("reset(uint256)"))] = _votingContractTwo;
    }


    function increment() 
    virtual
    external 
    override(CounterPrimitive)
    OnlyByVote
    {
        i = i + 1;
    }

    function reset(uint256 _i)
    virtual
    external
    OnlyDeployerOrByVote
    {
        i = _i;
    }

    function _beforeStart(bytes memory votingParams) internal view
    override(StartVoteAndImplementHybridVotingImplRemoteMinml) 
    {
        // Let's say only the deployer can start a voting instance.
        require(msg.sender==deployer, "Only deployer");
    }


    function _beforeVote(uint256 identifier) 
    internal 
    override(StartVoteAndImplementHybridVotingImplRemoteMinml){
        votes += 1;
    }
    

    function _beforeImplement(uint256 identifier)
    internal 
    override(StartVoteAndImplementHybridVotingImplRemoteMinml){
        implementations += 1;
    }



    modifier OnlyByVote {
        if(!_isImplementer()){
            revert OnlyVoteImplementer(msg.sender);
        }
        _;
    }

    modifier OnlyDeployerOrByVote {
        require(deployer==msg.sender || _isImplementer(), "Only deployer or by vote");
        _;
    }
}






contract StartVoteAndImplementHybridVotingHooksExample is 
CounterPrimitive,
AssignedContractPrimitive,
SecurityThroughAssignmentPrimitive,
StartVoteAndImplementHybridVotingImplRemoteHooks
{

    address public deployer;
    uint256 public numberOfInstances;
    uint256 public votes;
    uint256 public implementations;
    mapping(uint256=>uint256) public votingStatus;
    mapping(uint256=>IImplementResult.Response) public responseStatus;
    mapping(uint24=>address) internal simpleVotingContract;
    
    constructor(address _votingContractOne, address _votingContractTwo) {
        // assign deployer
        deployer = msg.sender;
        // set the simple voting contracts
        simpleVotingContract[uint24(1)] = _votingContractOne;
        // assign the voting contract the increment function.
        AssignedContractPrimitive.assignedContract[bytes4(keccak256("increment()"))] = _votingContractTwo;
        AssignedContractPrimitive.assignedContract[bytes4(keccak256("reset(uint256)"))] = _votingContractTwo;
    }


    function increment() 
    external 
    override(CounterPrimitive)
    OnlyByVote
    {
        i = i + 1;
    }

    function reset(uint256 _i)
    external
    OnlyDeployerOrByVote
    {
        i = _i;
    }

    
    function _beforeStart(bytes memory votingParams, bytes calldata callback) internal view
    override(StartVoteAndImplementHybridVotingImplRemoteHooks) 
    {
        // Let's say only the deployer can start a voting instance.
        require(msg.sender==deployer, "Only deployer");
    }

    function _afterStart(uint256 identifier, bytes memory votingParams, bytes calldata callback) 
    internal
    override(StartVoteAndImplementHybridVotingImplRemoteHooks) 
    {
        numberOfInstances += 1;
    }

    function _getSimpleVotingContract(bytes calldata callback) 
    internal 
    view
    override(StartVoteAndImplementHybridVotingImplRemoteHooks) 
    returns(address votingContract) {
        votingContract = simpleVotingContract[uint24(bytes3(callback[0:3]))];
    }

    function _beforeVote(uint256 identifier, bytes calldata votingData) 
    internal override(StartVoteAndImplementHybridVotingImplRemoteHooks) 
    {
        votes += 1;
    }

    function _afterVote(uint256 identifier, uint256 status, bytes calldata votingData) 
    internal override(StartVoteAndImplementHybridVotingImplRemoteHooks) 
    {
        votingStatus[identifier] = status;
    }

    function _beforeImplement(uint256 identifier)  
    internal override(StartVoteAndImplementHybridVotingImplRemoteHooks) 
    {
        implementations += 1;
    }
    
    function _afterImplement(uint256 identifier, IImplementResult.Response _responseStatus)  
    internal override(StartVoteAndImplementHybridVotingImplRemoteHooks) 
    {
        responseStatus[identifier] = _responseStatus;
    }    

    modifier OnlyByVote {
        if(!_isImplementer()){
            revert OnlyVoteImplementer(msg.sender);
        }
        _;
    }

    modifier OnlyDeployerOrByVote {
        require(
            SecurityThroughAssignmentPrimitive._isImplementer() ||
            deployer==msg.sender, 
            "Only deployer or by vote");
        _;
    }
}