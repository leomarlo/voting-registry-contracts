// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

import {IImplementResult} from "../../extensions/interfaces/IImplementResult.sol";
import {
    OnlyVoteImplementer,
    AssignedContractPrimitive,
    SecurityThroughAssignmentPrimitive
} from "../../integration/primitives/AssignedContractPrimitive.sol";
import {
    StartSimpleVotingMinml,
    StartSimpleVotingHooks
} from "../../integration/abstracts/OnlyStart.sol";
import {CounterPrimitive} from "../dummies/Counter.sol";


contract StartSimpleVotingMinmlExample is 
CounterPrimitive,
StartSimpleVotingMinml
{

    address public deployer;
    
    constructor(address _votingContract) {
        // set the voting contract
        votingContract = _votingContract;
        // assign deployer
        deployer = msg.sender;
    }


    function increment() 
    virtual
    external 
    override(CounterPrimitive)
    {
        i = i + 1;
    }


    function reset(uint256 _i)
    virtual
    external
    OnlyDeployer
    {
        i = _i;
    }


    function _beforeStart(bytes memory votingParams) internal view
    override(StartSimpleVotingMinml) 
    {
        // Let's say only the deployer can start a voting instance.
        require(msg.sender==deployer, "Only deployer");
    }

    
    modifier OnlyDeployer {
        require(
            deployer==msg.sender, 
            "Only deployer");
        _;
    }

}




contract StartSimpleVotingHooksExample is 
CounterPrimitive,
StartSimpleVotingHooks
{

    address public deployer;
    uint256 public numberOfInstances;
    mapping(uint24=>address) internal simpleVotingContract;
    
    constructor(address _votingContractOne, address _votingContractTwo) {
        // assign deployer
        deployer = msg.sender;
        // set the simple voting contracts
        simpleVotingContract[uint24(1)] = _votingContractOne;
        simpleVotingContract[uint24(2)] = _votingContractTwo;
    }


    function increment() 
    external 
    override(CounterPrimitive)
    {
        i = i + 1;
    }

    function reset(uint256 _i)
    external
    OnlyDeployer
    {
        i = _i;
    }

    
    function _beforeStart(bytes memory votingParams, bytes calldata callback) internal view
    override(StartSimpleVotingHooks) 
    {
        // Let's say only the deployer can start a voting instance.
        require(msg.sender==deployer, "Only deployer");
    }

    function _afterStart(uint256 identifier, bytes memory votingParams, bytes calldata callback) 
    internal
    override(StartSimpleVotingHooks) 
    {
        numberOfInstances += 1;
    }

    function _getSimpleVotingContract(bytes calldata callback) 
    internal 
    view
    override(StartSimpleVotingHooks) 
    returns(address votingContract) {
        votingContract = simpleVotingContract[uint24(bytes3(callback[0:3]))];
    }

    modifier OnlyDeployer {
        require(
            deployer==msg.sender, 
            "Only deployer");
        _;
    }

}