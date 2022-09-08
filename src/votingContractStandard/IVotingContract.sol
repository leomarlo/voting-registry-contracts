//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/*
This contract allows for voting with on-chain consequences as well as without.
*/

/// @title Voting Contract Interface - A basic interface for the essential on-chain voting functionality
/// @notice 

/// @title Voting Contract Interface: A general purpose interface for voting contracts. 
///        The defined methods are *REQUIRED* for an implementing contract to conform to the standard
///
/// @author Leonhard Horstmeyer <leomarlo.eth@gmail.com>
///
/// @dev A Voting Contract is an implementations of a particular type of voting mechanism. 
///      It can be thought of as a box that handles the entire life-cycle of voting, 
///      from the initialization, via the casting of votes to the retrieval of results and 
///      optionally to the triggering of an on-chain consequence whose calldata is already passsed at the initialization. 
///      The standard allows for a great deal of versatility and modularity. Versatility stems from the fact that 
///      the standard doesn't prescribe any particular way of defining the votes and the status of the vote. But it does
///      define a universal interface used by them all. It is "Recommended" to add features to a voting contract through building blocks that  



interface IVotingContract is IERC165{
    ///
    ///  Note: the ERC-165 identifier for this interface is 0x9452d78d.
    ///  0x9452d78d ===
    ///         bytes4(keccak256('start(bytes,bytes)')) ^
    ///         bytes4(keccak256('vote(uint256,bytes)')) ^
    ///         bytes4(keccak256('result(uint256)'));
    ///

    enum VotingStatus {inactive, completed, failed, active}

    event VotingInstanceStarted(uint256 identifier, address caller);

    function start(bytes memory votingParams, bytes calldata callback) external returns(uint256 identifier); 

    function vote(uint256 identifier, bytes calldata votingData) external returns(uint256 status);

    /// @notice The result can be the casted version of an address, an integer or a pointer to a mapping that contains the entire result.
    function result(uint256 identifier) external view returns(bytes memory resultData);

}

