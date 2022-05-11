//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;


import {REGISTRY} from "../registry/RegistryAddress.sol";
import {IVotingRegistry} from "../registry/IVotingRegistry.sol";
import {IVoteContract, Callback, Response} from "../voteContract/IVoteContract.sol";
import {ImplementCallback} from "../voteContract/VoteContract.sol";
import {CanVoteWithoutStarting, CanVotePrimitive, Whitelisting, FunctionGuard} from "./CanVoteUtils.sol";

/// @title Can Vote and Implement Votes.
/// @dev This contract needs to be inherited if one would like to implement the function calls on the side of the integration contract.
abstract contract CanVoteAndImplement is Whitelisting, ImplementCallback, FunctionGuard, CanVoteWithoutStarting {

    //////////////////////////////////////////////////
    // STATE VARIABLES                              //
    //////////////////////////////////////////////////

    mapping(uint256=>Callback) internal callback;


    //////////////////////////////////////////////////
    // WRITE FUNCTIONS                              //
    //////////////////////////////////////////////////

    /// @dev The inheriting contract needs to implement this public start function that initiates a new voting instance.
    /// @param selector the function selector that this voting instance is targeting
    /// @param votingParams the bytes-encoded voting parameters that are received by the voteContract. 
    /// @param _callbackSelector the bytes4 selector of the function that will be called by this contract, when the conditions are met.
    /// @param _callbackArgs the byte-encoded arguments for the function that will be called. 
    function start(
        bytes memory votingParams,
        bytes4 _callbackSelector,
        bytes memory _callbackArgs)
    public virtual; 

    /// @dev The inheriting contract needs to implement a public vote function
    /// @param voteIndex the index of the voting instance where one would like to cast a vote.
    /// @param option the option that one wishes to vote on.
    function vote(uint256 voteIndex, uint256 option) public virtual;


    //////////////////////////////////////////////////
    // INTERNAL HELPER FUNCTIONS                    //
    //////////////////////////////////////////////////

    /// @dev An internal function that provides the interace with the voting contract to start a new voting instance and stores the calldata for the function locally on this contract.
    /// @param selector the function selector that this voting instance is targeting
    /// @param votingParams the bytes-encoded voting parameters that are received by the voteContract. 
    /// @param _callbackSelector the bytes4 selector of the function that will be called by this contract, when the conditions are met.
    /// @param _callbackArgs the byte-encoded arguments for the function that will be called. 
    function _start(
        bytes memory votingParams,
        bytes4 _callbackSelector,
        bytes memory _callbackArgs)
    internal 
    returns(uint256 index) 
    {
        // only the voting parameters are passed alongside the function selector. Not the call data.
        index = _start(_callbackSelector, votingParams);
        // the calldata is saved locally.
        callback[index] = Callback({
            selector: _callbackSelector,
            arguments: _callbackArgs,
            response: Response.none});
    }

    /// @dev internal helper function that implements the outcome of the vote.
    /// @param voteIndex the index of this vote instance, as saved in the inheriting contract.
    function _implement(uint256 voteIndex) internal {
        callback[voteIndex].response = _implement(address(this), callback[voteIndex]); 
    }

    /// @dev customizable function guard. 
    /// @param selector the selector for the function to be guarded.
    function _customFunctionGuard(bytes4 selector) 
    internal 
    view 
    virtual
    override(FunctionGuard)
    returns(bool)
    {
        selector;  // silence warnings
        return false;
    }

    /// @dev fixed function guard that is always in place.
    /// @param selector the selector for the function to be guarded. 
    function _functionGuard(bytes4 selector) 
    internal 
    view 
    override(FunctionGuard)
    returns(bool)
    {
        selector;
        return msg.sender == address(this);
    }

    /// @dev checks whether a given vote contract satisfies the required ERC165-interface.
    /// @param _voteContract the vote contract whose interface condition is queried.
    function _supportsAdditionalInterfaces(address _voteContract)
    internal 
    pure 
    override(Whitelisting)
    returns(bool)
    {
        _voteContract;  // silence warnings
        return true;
    }
}
