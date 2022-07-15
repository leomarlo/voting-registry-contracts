// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.13;

import {IImplementResult} from "../../extensions/interfaces/IImplementResult.sol";
import {
    OnlyVoteImplementer,
    AssignedContractPrimitive,
    SecurityThroughAssignmentPrimitive
} from "../../integration/primitives/AssignedContractPrimitive.sol";
import {
    StartHybridVotingMinml,
    StartHybridVotingHooks
} from "../../integration/abstracts/OnlyStart.sol";
import {CounterPrimitive} from "../dummies/Counter.sol";


contract StartHybridVotingMinmlExample is 
CounterPrimitive,
AssignedContractPrimitive,
SecurityThroughAssignmentPrimitive,
StartHybridVotingMinml
{

    address public deployer;
    
    constructor(address _votingContractOne, address _votingContractTwo) {
        // set the voting contract
        StartHybridVotingMinml.votingContract = _votingContractOne;
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
    override(StartHybridVotingMinml) 
    {
        // Let's say only the deployer can start a voting instance.
        require(msg.sender==deployer, "Only deployer");
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




contract StartHybridVotingHooksExample is 
CounterPrimitive,
AssignedContractPrimitive,
SecurityThroughAssignmentPrimitive,
StartHybridVotingHooks
{

    address public deployer;
    uint256 public numberOfInstances;
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
    override(StartHybridVotingHooks) 
    {
        // Let's say only the deployer can start a voting instance.
        require(msg.sender==deployer, "Only deployer");
    }

    function _afterStart(uint256 identifier, bytes memory votingParams, bytes calldata callback) 
    internal
    override(StartHybridVotingHooks) 
    {
        numberOfInstances += 1;
    }

    function _getSimpleVotingContract(bytes calldata callback) 
    internal 
    view
    override(StartHybridVotingHooks) 
    returns(address votingContract) {
        votingContract = simpleVotingContract[uint24(bytes3(callback[0:3]))];
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