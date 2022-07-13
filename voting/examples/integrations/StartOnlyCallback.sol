// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.13;

import {IImplementResult} from "../../extensions/interfaces/IImplementResult.sol";
import {
    AssignedContractPrimitive,
    SecurityThroughAssignmentPrimitive
} from "../../integration/primitives/AssignedContractPrimitive.sol";
import {
    StartOnlyCallbackMinml,
    StartOnlyCallbackHooks
} from "../../integration/abstracts/OnlyStart.sol";


contract StartOnlyCallbackMinmlExample is 
AssignedContractPrimitive,
SecurityThroughAssignmentPrimitive,
StartOnlyCallbackMinml
{

    address public deployer;
    uint256 public i;
    
    constructor(address _votingContractOne, address _votingContractTwo) {
        // assign deployer
        deployer = msg.sender;
        // assign the votingContract the increment function.
        AssignedContractPrimitive.assignedContract[bytes4(keccak256("increment()"))] = _votingContractOne;
        AssignedContractPrimitive.assignedContract[bytes4(keccak256("reset(uint256)"))] = _votingContractTwo;
    }


    function increment() 
    external 
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

    function _beforeStart(bytes memory votingParams) internal view
    override(StartOnlyCallbackMinml) 
    {
        // Let's say only the deployer can start a voting instance.
        require(msg.sender==deployer, "Only deployer");
    }


    modifier OnlyByVote {
        require(SecurityThroughAssignmentPrimitive._isImplementer(), "Only by vote");
        _;
    }

    modifier OnlyDeployerOrByVote {
        require(deployer==msg.sender || SecurityThroughAssignmentPrimitive._isImplementer(), "Only deployer or by vote");
        _;
    }
}




contract StartOnlyCallbackHooksExample is 
AssignedContractPrimitive,
SecurityThroughAssignmentPrimitive,
StartOnlyCallbackHooks
{

    address public deployer;
    uint256 public i;
    uint256 public numberOfInstances;
    mapping(uint24=>address) internal simpleVotingContract;
    
    constructor(address _votingContractOne, address _votingContractTwo) {
        // assign deployer
        deployer = msg.sender;
        // assign the voting contract the increment function.
        AssignedContractPrimitive.assignedContract[bytes4(keccak256("increment()"))] = _votingContractOne;
        AssignedContractPrimitive.assignedContract[bytes4(keccak256("reset(uint256)"))] = _votingContractTwo;
    }


    function increment() 
    external 
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
    override(StartOnlyCallbackHooks) 
    {
        // Let's say only the deployer can start a voting instance.
        require(msg.sender==deployer, "Only deployer");
    }

    function _afterStart(uint256 identifier, bytes memory votingParams, bytes calldata callback) 
    internal
    override(StartOnlyCallbackHooks) 
    {
        numberOfInstances += 1;
    }


    modifier OnlyByVote {
        require(
            SecurityThroughAssignmentPrimitive._isImplementer(),
            "Only by vote");
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