//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";


/// @title Configurable Voting Contract Interface
/// @author Leonhard Horstmeyer <leomarlo.eth@gmail.com>
/// @dev A Voting Contract is an implementations of a particular type of voting mechanism. 
///      It can be thought of as a standalone contract that handles the entire life-cycle of voting, 
///      from the initialization, via the casting of votes to the retrieval of results. Optionally it can
///      be extended by the functionality of triggering the outcome of the vote through a call whose calldata is already passsed at the initialization. 
///      The standard allows for a great deal of versatility and modularity. Versatility stems from the fact that 
///      the standard doesn't prescribe any particular way of defining the votes and the status of the vote. But it does
///      define a universal interface used by them all.  



interface IVotingContract is IERC165{
    ///  Note: the ERC-165 identifier for this interface is 0x9452d78d.
    ///  0x9452d78d ===
    ///         bytes4(keccak256('start(bytes,bytes)')) ^
    ///         bytes4(keccak256('vote(uint256,bytes)')) ^
    ///         bytes4(keccak256('result(uint256)'));
    ///

    /// @notice The states first three statuses are recommended to be 
    ///         'inactive', 'completed' and 'failed'.
    enum VotingStatus {inactive, completed, failed, active}

    /// @notice When a new instance is started this event gets triggered.
    event VotingInstanceStarted(uint256 indexed identifier, address caller);

    /// @notice starts a new voting instance.
    /// @param votingParams byte-encoded parameters that configure the voting instance
    /// @param callback calldata that gets executed when the motion passes
    /// @return identifier the instance identifier that needs to be referenced to vote on this motion.
    function start(bytes memory votingParams, bytes calldata callback) external returns(uint256 identifier); 

    /// @notice casts a vote on a voting instance referenced by the identifier
    /// @param identifier unique identifier of the voting instance on which one would like to cast a vote
    /// @param votingData carries byte-encoded information about the vote
    /// @return status information for the caller, whether the vote has triggered any changes to the status
    function vote(uint256 identifier, bytes calldata votingData) external returns(uint256 status);

    /// @notice returns the result of the voting instance
    /// @dev The result can be the byte-encoded version of an address, an integer or a pointer to a mapping that contains the entire result.
    /// @param identifier unique identifier for which one would like to know the result
    /// @return resultData byte-encoded data that encodes the result.
    function result(uint256 identifier) external view returns(bytes memory resultData);

}

