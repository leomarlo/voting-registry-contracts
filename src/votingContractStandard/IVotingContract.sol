//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/*
This contract allows for voting with on-chain consequences as well as without.
*/

/// @title Voting Contract Interface - A basic interface for the essential on-chain voting functionality
/// @notice 
interface IVotingContract is IERC165{

    enum VotingStatus {inactive, completed, failed, active}

    event VotingInstanceStarted(uint256 identifier, address caller);

    function start(bytes memory votingParams, bytes calldata callback) external returns(uint256 identifier); 

    function vote(uint256 identifier, bytes memory votingData) external returns(uint256 status);

    /// @notice The result can be the casted version of an address, an integer or a pointer to a mapping that contains the entire result.
    function result(uint256 identifier) external view returns(bytes memory resultData);

}

