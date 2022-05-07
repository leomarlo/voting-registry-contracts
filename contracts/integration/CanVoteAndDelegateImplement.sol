//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import {REGISTRY} from "../registry/RegistryAddress.sol";
import {IVotingRegistry} from "../registry/IVotingRegistry.sol";
import {IVoteContract, IVoteAndImplementContract} from "../voteContract/IVoteContract.sol";
import {CanVotePrimitive, Whitelisting, FunctionGuard, VoteInfo} from "./CanVote.sol";


abstract contract CanVoteAndDelegateImplement is Whitelisting, FunctionGuard, CanVotePrimitive {

    // constructor() CanVote(){}

    function start(
        bytes memory votingParams,
        bytes4 _callbackSelector,
        bytes memory _callbackArgs)
    public virtual; 

    function vote(uint256 voteIndex, uint256 option) public virtual;

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

    function _functionGuard(bytes4 selector) 
    internal 
    view 
    override(FunctionGuard)
    returns(bool)
    {
        return msg.sender == voteContract[selector];
    }

    function _supportsAdditionalInterfaces(address _voteContract)
    internal 
    view 
    override(Whitelisting)
    returns(bool)
    {
        return IVoteContract(_voteContract).supportsInterface(type(IVoteAndImplementContract).interfaceId);
    }
    
}