//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {REGISTRY} from "../registry/RegistryAddress.sol";
import {IVotingRegistry} from "../registry/IVotingRegistry.sol";
import {IVoteContract, IVoteAndImplementContract} from "../voteContract/IVoteContract.sol";
import {CanVotePrimitive, Whitelisting, FunctionGuard, VoteInfo} from "./CanVoteUtils.sol";

/// @title Can Vote and Delegate the Implementation
/// @dev This contract can be inherited, if one likes to cast votes and let the voting contract implement them.
/// @notice This requires a lot of trust and should only be done for voting contracts that have their source code open and/or audited.
abstract contract CanVoteAndDelegateImplement is Whitelisting, FunctionGuard, CanVotePrimitive {

    /// @dev The inheriting contract needs to implement a public start function that passes also the implementation data.
    /// @param votingParams the bytes-encoded parameters required by the voting contract to decide what kind of vote is being executed
    /// @param _callbackSelector the bytes4 selector of the function that will be called by the voting contract, when the conditions are met.
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

    /// @dev An internal function that initiates a new voting instance, by calling the start function on contract that handles the implementation for that function selector.
    /// @param votingParams the bytes-encoded parameters required by the voting contract to decide what kind of vote is being executed
    /// @param _callbackSelector the bytes4 selector of the function that will be called by the voting contract, when the conditions are met.
    /// @param _callbackArgs the byte-encoded arguments for the function that will be called. 
    function _start(
        bytes memory votingParams,
        bytes4 _callbackSelector,
        bytes memory _callbackArgs)
    internal 
    isVotable(_callbackSelector)
    isWhitelisted(voteContract[_callbackSelector])
    returns(uint256)
    {
        totalVotesStarted += 1;
        VoteInfo memory _voteInfo;
        _voteInfo.voteContract = voteContract[_callbackSelector];
        _voteInfo.index = IVoteAndImplementContract(_voteInfo.voteContract).start(
            votingParams, 
            _callbackSelector,
            _callbackArgs);
        voteInfo[totalVotesStarted] = _voteInfo;
        return totalVotesStarted;
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
        return msg.sender == voteContract[selector];
    }

    /// @dev checks whether a given vote contract satisfies the additional ERC165-interfac for implementing contracts.
    /// @param _voteContract the vote contract whose interface condition is queried.
    function _supportsAdditionalInterfaces(address _voteContract)
    internal 
    view 
    override(Whitelisting)
    returns(bool)
    {
        return IVoteContract(_voteContract).supportsInterface(type(IVoteAndImplementContract).interfaceId);
    }
    
}