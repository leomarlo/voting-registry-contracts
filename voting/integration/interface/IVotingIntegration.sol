//SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;


interface IIntegrationVoteWithCallback {

    function start(bytes memory votingParams, bytes calldata callback) external; 

    function vote(uint256 identifier, bytes memory votingData, bytes calldata callback) external;

}

interface IIntegrationVoteWithoutCallback {
   
    function start(bytes memory votingParams, bytes calldata callback) external; 

    function vote(uint256 identifier, bytes memory votingData) external;

}

interface IIntegrationImplementIsPublic {
   
    function start(bytes memory votingParams, bytes calldata callback) external; 

    function vote(uint256 identifier, bytes memory votingData) external;

    function implement(uint256 identifier, bytes calldata callbackData) external;
}