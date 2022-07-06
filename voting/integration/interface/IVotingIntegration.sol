//SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;

interface IVotingIntegration {
    
    function start(bytes memory votingParams, bytes memory callback) external; 

    function vote(uint256 identifier, bytes memory votingData) external;

}