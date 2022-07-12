//SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.13;

import {IStartVoteAndImplement} from "../interface/IVotingIntegration.sol";
import {IVotingContract} from "../../votingContractStandard/IVotingContract.sol";
import {AssignedContractPrimitive} from "../primitives/AssignedContractPrimitive.sol";
import { Instance, InstanceInfoPrimitive } from "../primitives/InstanceInfoPrimitive.sol";
import {IImplementResult} from "../../extensions/interfaces/IImplementResult.sol";


abstract contract StartVoteAndImplementOnlyCallbackImplRemoteMinml is
IStartVoteAndImplement,
AssignedContractPrimitive,
InstanceInfoPrimitive
{

    function start(bytes memory votingParams, bytes calldata callback) 
    external 
    override(IStartVoteAndImplement){
        _beforeStart(votingParams);
        bytes4 selector = bytes4(callback[0:4]);
        if (!AssignedContractPrimitive._isVotableFunction(selector)){
            revert AssignedContractPrimitive.IsNotVotableFunction(selector);
        }
        address votingContract = assignedContract[selector];
        uint256 identifier = IVotingContract(votingContract).start(votingParams, callback);
        instances.push(Instance({
            identifier: identifier,
            votingContract: votingContract
        }));
    }

    
    function vote(uint256 identifier, bytes memory votingData) 
    external 
    override(IStartVoteAndImplement){
        _beforeVote(identifier);
        IVotingContract(instances[identifier].votingContract).vote(
            instances[identifier].identifier,
            votingData);
    }

    function implement(uint256 identifier, bytes calldata callback)
    external 
    override(IStartVoteAndImplement) 
    {
        IImplementResult(instances[identifier].votingContract).implement(
                instances[identifier].identifier,
                callback);
        
    }

    function _beforeStart(bytes memory votingParams) virtual internal {}

    function _beforeVote(uint256 identifier) virtual internal {}
}

abstract contract StartVoteAndImplementOnlyCallbackImplRemoteHooks is 
IStartVoteAndImplement,
AssignedContractPrimitive,
InstanceInfoPrimitive
{

    function start(bytes memory votingParams, bytes calldata callback) 
    external 
    override(IStartVoteAndImplement){
        _beforeStart(votingParams, callback);
        bytes4 selector = bytes4(callback[0:4]);
        if (!AssignedContractPrimitive._isVotableFunction(selector)){
            revert AssignedContractPrimitive.IsNotVotableFunction(selector);
        }
        address votingContract = assignedContract[selector];
        uint256 identifier = IVotingContract(votingContract).start(votingParams, callback);
        instances.push(Instance({
            identifier: identifier,
            votingContract: votingContract
        }));
        _afterStart(identifier, votingParams, callback);
    }

    
    function vote(uint256 identifier, bytes memory votingData) 
    external 
    override(IStartVoteAndImplement){
        _beforeVote(identifier, votingData);
        uint256 status = IVotingContract(instances[identifier].votingContract).vote(
            instances[identifier].identifier,
            votingData);
        _afterVote(identifier, status, votingData);
    }

    function implement(uint256 identifier, bytes calldata callback)
    external 
    override(IStartVoteAndImplement) 
    {
        _beforeImplement(identifier);
        IImplementResult.Response _response;
        _response = IImplementResult(instances[identifier].votingContract).implement(
                instances[identifier].identifier,
                callback);
        _afterImplementation(identifier, _response);
        
    }

    function _beforeStart(bytes memory votingParams, bytes calldata callback) virtual internal {}

    function _afterStart(uint256 identifier, bytes memory votingParams, bytes calldata callback) virtual internal {}
    
    function _beforeVote(uint256 identifier, bytes memory votingData) virtual internal {}

    function _afterVote(uint256 identifier, uint256 status, bytes memory votingData) virtual internal {}

    function _beforeImplement(uint256 identifier) virtual internal {}
    
    function _afterImplementation(uint256 identifier, IImplementResult.Response _responseStatus) virtual internal {}    

}


abstract contract StartVoteAndImplementHybridVotingImplRemoteMinml is
IStartVoteAndImplement,
AssignedContractPrimitive,
InstanceInfoPrimitive 
{
    
    address public votingContract;

    function start(bytes memory votingParams, bytes calldata callback) 
    external 
    override(IStartVoteAndImplement){
         _beforeStart(votingParams);
        address _votingContract;
        if (callback.length<4){
            _votingContract = votingContract;
        } else {
            bytes4 selector = bytes4(callback[0:4]);
            if (!AssignedContractPrimitive._isVotableFunction(selector)){
                revert AssignedContractPrimitive.IsNotVotableFunction(selector);
            }
            _votingContract = assignedContract[selector];
        }
        uint256 identifier = IVotingContract(_votingContract).start(votingParams, callback);
        instances.push(Instance({
            identifier: identifier,
            votingContract: _votingContract
        }));
    }

    
    function vote(uint256 identifier, bytes memory votingData) 
    external 
    override(IStartVoteAndImplement){
        _beforeVote(identifier);
        IVotingContract(instances[identifier].votingContract).vote(
            instances[identifier].identifier,
            votingData);
    }

    function implement(uint256 identifier, bytes calldata callback)
    external 
    override(IStartVoteAndImplement) 
    {
        IImplementResult(instances[identifier].votingContract).implement(
                instances[identifier].identifier,
                callback);
        
    }

    function _beforeStart(bytes memory votingParams) virtual internal {}

    function _beforeVote(uint256 identifier) virtual internal {}
}

abstract contract StartVoteAndImplementHybridVotingImplRemoteHooks is 
IStartVoteAndImplement,
AssignedContractPrimitive,
InstanceInfoPrimitive
{
    function start(bytes memory votingParams, bytes calldata callback) 
    external 
    override(IStartVoteAndImplement){
        _beforeStart(votingParams, callback);
        address _votingContract;
        if (callback.length<4){
            _votingContract = _getSimpleVotingContract(callback);
        } else {
            bytes4 selector = bytes4(callback[0:4]);
            if (!AssignedContractPrimitive._isVotableFunction(selector)){
                revert AssignedContractPrimitive.IsNotVotableFunction(selector);
            }
            _votingContract = assignedContract[selector];
        }
        uint256 identifier = IVotingContract(_votingContract).start(votingParams, callback);
        instances.push(Instance({
            identifier: identifier,
            votingContract: _votingContract
        }));
        _afterStart(identifier, votingParams, callback);
    }

    
    function vote(uint256 identifier, bytes memory votingData) 
    external 
    override(IStartVoteAndImplement){
        _beforeVote(identifier, votingData);
        uint256 status = IVotingContract(instances[identifier].votingContract).vote(
            instances[identifier].identifier,
            votingData);
        _afterVote(identifier, status, votingData);
    }

    function implement(uint256 identifier, bytes calldata callback)
    external 
    override(IStartVoteAndImplement) 
    {
        _beforeImplement(identifier);
        IImplementResult.Response _response;
        _response = IImplementResult(instances[identifier].votingContract).implement(
                instances[identifier].identifier,
                callback);
        _afterImplementation(identifier, _response);
        
    }

    function _beforeStart(bytes memory votingParams, bytes calldata callback) virtual internal {}

    function _afterStart(uint256 identifier, bytes memory votingParams, bytes calldata callback) virtual internal {}
    
    function _getSimpleVotingContract(bytes calldata callback) virtual internal returns(address) {}

    function _beforeVote(uint256 identifier, bytes memory votingData) virtual internal {}

    function _afterVote(uint256 identifier, uint256 status, bytes memory votingData) virtual internal {}

    function _beforeImplement(uint256 identifier) virtual internal {}
    
    function _afterImplementation(uint256 identifier, IImplementResult.Response _responseStatus) virtual internal {}    

}
