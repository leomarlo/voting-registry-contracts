//SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;


import { CanVoteWithoutStarting } from "./CanVotePrimitive.sol";

abstract contract CanVote is CanVoteWithoutStarting {

    //////////////////////////////////////////////////
    // WRITE FUNCTIONS                              //
    //////////////////////////////////////////////////

    /// @dev The inheriting contract needs to implement this public vote function
    /// @param voteIndex the index of the voting instance where one would like to cast a vote.
    /// @param option the option that one wishes to vote on.
    function vote(uint256 voteIndex, uint256 option) public virtual;

    /// @dev The inheriting contract needs to implement this public start function that initiates a new voting instance.
    /// @param selector the function selector that this voting instance is targeting
    /// @param votingParams the bytes-encoded voting parameters that are received by the voteContract. 
    function start(bytes4 selector, bytes memory votingParams) public virtual;

}