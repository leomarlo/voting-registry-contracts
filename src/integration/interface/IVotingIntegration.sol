//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;


interface IStart {

    function start(bytes memory votingParams, bytes calldata callback) external; 

}

interface IStartAndVote {

    function start(bytes memory votingParams, bytes calldata callback) external; 

    function vote(uint256 identifier, bytes calldata votingData) external;

}

interface IStartVoteAndImplement {
   
    function start(bytes memory votingParams, bytes calldata callback) external; 

    function vote(uint256 identifier, bytes calldata votingData) external;

    function implement(uint256 identifier, bytes calldata callback) external payable;

}
