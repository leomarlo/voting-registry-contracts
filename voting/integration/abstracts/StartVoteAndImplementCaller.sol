//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;


import {IStartVoteAndImplement} from "../interface/IVotingIntegration.sol";
import {IVotingContract} from "../../votingContractStandard/IVotingContract.sol";
import {AssignedContractPrimitive} from "../primitives/AssignedContractPrimitive.sol";

import {
    ImplementResultPrimitive,
    HandleImplementationResponse,
    HandleFailedImplementationResponse
} from "../../extensions/primitives/ImplementResultPrimitive.sol";

import {IImplementResult} from "../../extensions/interfaces/IImplementResult.sol";
import { Instance, InstanceInfoPrimitive } from "../primitives/InstanceInfoPrimitive.sol";

import {ImplementingPermitted} from "../../extensions/primitives/ImplementingPermitted.sol";
import {IImplementingPermitted} from "../../extensions/interfaces/IImplementingPermitted.sol";
import {StatusPrimitive} from "../../extensions/primitives/Status.sol";

import {CallbackHashPrimitive} from "../../extensions/primitives/CallbackHash.sol";
import {CheckCalldataValidity} from "../../extensions/primitives/CheckCalldataValidity.sol";


abstract contract StartVoteAndImplementOnlyCallbackImplCallerMinml is
IStartVoteAndImplement,
IImplementingPermitted,
InstanceInfoPrimitive, 
AssignedContractPrimitive,
CallbackHashPrimitive,
CheckCalldataValidity,
HandleFailedImplementationResponse,
StatusPrimitive,
ImplementingPermitted,
ImplementResultPrimitive
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
        _callbackHash[instances.length] = keccak256(callback);
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
    payable
    override(IStartVoteAndImplement) 
    {
        if(!CheckCalldataValidity._isValidCalldata(identifier, callback)){
            revert CheckCalldataValidity.InvalidCalldata();
        }

        _beforeImplement(identifier);
        
        (
            IImplementResult.Response _responseStatus,
            bytes memory _responseData
        ) = _implement(address(this), callback);
        
        if (_responseStatus == IImplementResult.Response.failed) {
            _handleFailedImplementation(identifier, _responseData);
        } 
        
    }

    function _beforeStart(bytes memory votingParams) virtual internal {}

    function _beforeVote(uint256 identifier) virtual internal {}

    function _beforeImplement(uint256 identifier) virtual internal {}
   
}

abstract contract StartVoteAndImplementOnlyCallbackImplCallerHooks is
IStartVoteAndImplement,
IImplementingPermitted,
InstanceInfoPrimitive, 
AssignedContractPrimitive,
CallbackHashPrimitive,
CheckCalldataValidity,
HandleImplementationResponse,
StatusPrimitive,
ImplementingPermitted,
ImplementResultPrimitive
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
        _callbackHash[instances.length] = keccak256(callback);
        instances.push(Instance({
            identifier: identifier,
            votingContract: votingContract
        }));
        _afterStart(identifier, votingParams, callback);
    }

    
    function vote(uint256 identifier, bytes memory votingData) 
    external 
    override(IStartVoteAndImplement){
        _beforeVote(identifier);
        uint256 remoteStatus;
        remoteStatus = IVotingContract(instances[identifier].votingContract).vote(
            instances[identifier].identifier,
            votingData);
        _afterVote(identifier, remoteStatus, votingData);
    }


    function implement(uint256 identifier, bytes calldata callback)
    external
    payable 
    override(IStartVoteAndImplement) 
    {
        if(!CheckCalldataValidity._isValidCalldata(identifier, callback)){
            revert CheckCalldataValidity.InvalidCalldata();
        }

        _beforeImplement(identifier);
        
        (
            IImplementResult.Response _responseStatus,
            bytes memory _responseData
        ) = _implement(address(this), callback);
        
        if (_responseStatus == IImplementResult.Response.failed) {
            _handleFailedImplementation(identifier, _responseData);
        } else {
            _handleNotFailedImplementation(identifier, _responseData);
        }
        
    }


    function _beforeStart(bytes memory votingParams) virtual internal {}

    function _afterStart(uint256 identifier, bytes memory votingParams, bytes calldata callback) virtual internal {}

    function _beforeVote(uint256 identifier) virtual internal {}

    function _afterVote(uint256 identifier, uint256 status, bytes memory votingData) virtual internal {}

    function _beforeImplement(uint256 identifier) virtual internal {}

}



abstract contract StartVoteAndImplementHybridVotingImplCallerMinml is 
IStartVoteAndImplement, 
IImplementingPermitted,
InstanceInfoPrimitive, 
AssignedContractPrimitive, 
CallbackHashPrimitive,
CheckCalldataValidity,
HandleFailedImplementationResponse, 
ImplementResultPrimitive,
StatusPrimitive,
ImplementingPermitted
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
        _callbackHash[instances.length] = keccak256(callback);
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
    payable
    override(IStartVoteAndImplement) 
    {
        if(!CheckCalldataValidity._isValidCalldata(identifier, callback)){
            revert CheckCalldataValidity.InvalidCalldata();
        }

        _beforeImplement(identifier);

        (
            IImplementResult.Response _responseStatus,
            bytes memory _responseData
        ) = _implement(address(this), callback);
            
        // check whether the response from the call was not susccessful
        // check whether the response from the call was susccessful
        if (_responseStatus == IImplementResult.Response.failed) {
            _handleFailedImplementation(identifier, _responseData);
        } 
    }

    function _beforeStart(bytes memory votingParams) virtual internal {}

    function _beforeVote(uint256 identifier) virtual internal {}

    function _beforeImplement(uint256 identifier) virtual internal {}

}

    


abstract contract StartVoteAndImplementHybridVotingImplCallerHooks is 
IStartVoteAndImplement, 
IImplementingPermitted,
InstanceInfoPrimitive, 
AssignedContractPrimitive, 
CallbackHashPrimitive,
CheckCalldataValidity,
HandleImplementationResponse, 
ImplementResultPrimitive,
StatusPrimitive,
ImplementingPermitted
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
        _callbackHash[instances.length] = keccak256(callback);
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
        uint256 remoteStatus = IVotingContract(instances[identifier].votingContract).vote(
            instances[identifier].identifier,
            _modifyVotingData(identifier, votingData));
        _afterVote(identifier, remoteStatus, votingData);
    }


    function implement(uint256 identifier, bytes calldata callback)
    external 
    payable
    override(IStartVoteAndImplement) 
    {
        if(!CheckCalldataValidity._isValidCalldata(identifier, callback)){
            revert CheckCalldataValidity.InvalidCalldata();
        }

        _beforeImplement(identifier);
        
        (
            IImplementResult.Response _responseStatus,
            bytes memory _responseData
        ) = _implement(address(this), callback);
        
        if (_responseStatus == IImplementResult.Response.failed) {
            _handleFailedImplementation(identifier, _responseData);
        } else {
            _handleNotFailedImplementation(identifier, _responseData);
        }
        
    }


    function _beforeStart(bytes memory votingParams, bytes calldata callback) virtual internal {}

    function _afterStart(uint256 identifier, bytes memory votingParams, bytes calldata callback) virtual internal {}

    function _getSimpleVotingContract(bytes calldata callback) virtual internal view returns(address) {}

    function _beforeVote(uint256 identifier, bytes memory votingData) virtual internal {}

    function _modifyVotingData(uint256 identifier, bytes memory votingData) virtual internal returns(bytes memory newVotingData){ return votingData;}

    function _afterVote(uint256 identifier, uint256 status, bytes memory votingData) virtual internal {}

    function _beforeImplement(uint256 identifier) virtual internal {}


}


