//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;


import {REGISTRY} from "../registry/RegistryAddress.sol";
import {IVotingRegistry} from "../registry/IVotingRegistry.sol";
import {IVoteContract, Callback, Response} from "../voteContract/IVoteContract.sol";
import {ImplementCallback} from "../voteContract/VoteContract.sol";
import {CanVoteWithoutStarting, CanVotePrimitive, Whitelisting, FunctionGuard} from "./CanVote.sol";


abstract contract CanVoteAndImplement is Whitelisting, ImplementCallback, FunctionGuard, CanVoteWithoutStarting {

    mapping(uint256=>Callback) internal callback;

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
    returns(uint256 index) 
    {
        index = _start(_callbackSelector, votingParams);
        callback[index] = Callback({
            selector: _callbackSelector,
            arguments: _callbackArgs,
            response: Response.none});
    }

    function _implement(uint256 voteIndex) internal {
        callback[voteIndex].response = _implement(address(this), callback[voteIndex]); 
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
        selector;
        return msg.sender == address(this);
    }

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
