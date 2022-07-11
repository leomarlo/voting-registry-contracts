//SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;

import {IStartAndVote} from "../interface/IVotingIntegration.sol";
import {IVotingContract} from "../../votingContractStandard/IVotingContract.sol";
import {SecurityPrimitive} from "../primitives/SecurityPrimitive.sol";
import {
    InstanceWithCallback,
    InstanceInfoWithCallback
} from "../primitives/InstanceInfoPrimitive.sol";
import {IImplementResult} from "../../extensions/interfaces/IImplementResult.sol";
import {
    ImplementResultPrimitive,
    HandleImplementationResponse
} from "../../extensions/primitives/ImplementResultPrimitive.sol";
import {ImplementingPermitted} from "../../extensions/primitives/ImplementingPermitted.sol";
import {IImplementingPermitted} from "../../extensions/interfaces/IImplementingPermitted.sol";
import {StatusPrimitive} from "../../extensions/primitives/Status.sol";


abstract contract StartAndVoteHybridVotingImplCallerMinml is 
IStartAndVote, 
IImplementingPermitted,
InstanceInfoWithCallback, 
SecurityPrimitive, 
HandleImplementationResponse, 
ImplementResultPrimitive,
StatusPrimitive,
ImplementingPermitted{

    IVotingContract public votingContract;

    function start(bytes memory votingParams, bytes calldata callback) 
    external 
    override(IStartAndVote){
        _beforeStart(votingParams);
        address _votingContract;
        if (callback.length<4){
            _votingContract = votingContract;
        } else {
            bytes4 selector = bytes4(callback[0:4]);
            if (!SecurityPrimitive._isVotableFunction(selector)){
                revert SecurityPrimitive.IsNotVotableFunction(selector);
            }
            _votingContract = assignedContract[selector];
        }
        uint256 identifier = IVotingContract(_votingContract).start(votingParams, callback);
        _status[instances.length] = uint256(IImplementResult.VotingStatusImplement.active);
        instances.push(InstanceWithCallback({
            identifier: identifier,
            votingContract: _votingContract,
            callback: callback
        }));
    }

    
    function vote(uint256 identifier, bytes memory votingData) 
    external 
    override(IStartAndVote){
        _beforeVote(identifier);
        uint256 status = IVotingContract(instances[identifier].votingContract).vote(
            instances[identifier].identifier,
            votingData);
        if(status==uint256(IImplementResult.VotingStatusImplement.awaitcall) && instances[identifier].callback.length<4 && _implementingPermitted(identifier)){
            // implement the result
            (
                IImplementResult.Response _responseStatus,
                bytes memory _responseData
            ) = _implement(address(this), instances[identifier].callback);
                
            // check whether the response from the call was not susccessful
            // check whether the response from the call was susccessful
            if (_responseStatus == IImplementResult.Response.successful) {
                _status[identifier] = uint256(IImplementResult.VotingStatusImplement.complete);
                _handleNotFailedImplementation(identifier, _responseData);
            } else {
                _status[identifier] = uint256(IImplementResult.VotingStatusImplement.failed);
                _handleFailedImplementation(identifier, _responseData);
            } 
            // IImplementResult(instances[identifier]).implement(identifier, callback);
        }
    }

    function _beforeStart(bytes memory votingParams) virtual internal {}

    function _beforeVote(uint256 identifier) virtual internal {}

}


abstract contract StartAndVoteHybridVotingImplCallerHooks is 
IStartAndVote, 
IImplementingPermitted,
InstanceInfoWithCallback, 
SecurityPrimitive, 
HandleImplementationResponse, 
ImplementResultPrimitive,
StatusPrimitive,
ImplementingPermitted
{
    
    function start(bytes memory votingParams, bytes calldata callback) 
    external 
    override(IStartAndVote){
        _beforeStart(votingParams, callback);
        address _votingContract;
        if (callback.length<4){
            _votingContract = _getSimpleVotingContract(callback);
        } else {
            bytes4 selector = bytes4(callback[0:4]);
            if (!SecurityPrimitive._isVotableFunction(selector)){
                revert SecurityPrimitive.IsNotVotableFunction(selector);
            }
            _votingContract = assignedContract[selector];
        }
        uint256 identifier = IVotingContract(_votingContract).start(votingParams, callback);
        _status[instances.length] = uint256(IImplementResult.VotingStatusImplement.active);
        instances.push(InstanceWithCallback({
            identifier: identifier,
            votingContract: _votingContract,
            callback: callback
        }));
        _afterStart(identifier, votingParams, callback);
    }

    
    function vote(uint256 identifier, bytes memory votingData) 
    external 
    override(IStartAndVote){

        _beforeVote(identifier, votingData);

        uint256 status = IVotingContract(instances[identifier].votingContract).vote(
            instances[identifier].identifier,
            votingData);
        if(status==uint256(IImplementResult.VotingStatusImplement.awaitcall) && instances[identifier].callback.length<4 && _implementingPermitted(identifier)){
            // implement the result
            (
                IImplementResult.Response _responseStatus,
                bytes memory _responseData
            ) = _implement(address(this), instances[identifier].callback);
                
            // check whether the response from the call was susccessful
            if (_responseStatus == IImplementResult.Response.successful) {
                _status[identifier] = uint256(IImplementResult.VotingStatusImplement.complete);
                _handleNotFailedImplementation(identifier, _responseData);
            } else {
                _status[identifier] = uint256(IImplementResult.VotingStatusImplement.failed);
                _handleFailedImplementation(identifier, _responseData);
            } 
            
            // IImplementResult(instances[identifier]).implement(identifier, callback);
        }
        _afterVote(identifier, status, votingData);
    }

    function _beforeStart(bytes memory votingParams, bytes calldata callback) virtual internal {}

    function _afterStart(uint256 identifier, bytes memory votingParams, bytes calldata callback) virtual internal {}

    function _getSimpleVotingContract(bytes calldata callback) virtual internal returns(address) {}

    function _beforeVote(uint256 identifier, bytes memory votingData) virtual internal {}

    function _afterVote(uint256 identifier, uint256 status, bytes memory votingData) virtual internal {}

}

abstract contract StartAndVoteOnlyCallbackImplCallerMinml is 
IStartAndVote, 
IImplementingPermitted,
InstanceInfoWithCallback, 
SecurityPrimitive,
HandleImplementationResponse,
StatusPrimitive,
ImplementingPermitted,
ImplementResultPrimitive
{

    function start(bytes memory votingParams, bytes calldata callback) 
    external 
    override(IStartAndVote){
        _beforeStart(votingParams);
        bytes4 selector = bytes4(callback[0:4]);
        if (!SecurityPrimitive._isVotableFunction(selector)){
            revert SecurityPrimitive.IsNotVotableFunction(selector);
        }
        address votingContract = assignedContract[selector];
        uint256 identifier = IVotingContract(votingContract).start(votingParams, callback);
        _status[instances.length] = uint256(IImplementResult.VotingStatusImplement.active);
        instances.push(InstanceWithCallback({
            identifier: identifier,
            votingContract: votingContract,
            callback: callback
        }));
    }

    
    function vote(uint256 identifier, bytes memory votingData) 
    external 
    override(IStartAndVote){
        _beforeVote(identifier);
        uint256 remoteStatus = IVotingContract(instances[identifier].votingContract).vote(
            instances[identifier].identifier,
            votingData);
        if(remoteStatus==uint256(IImplementResult.VotingStatusImplement.awaitcall) && _implementingPermitted(identifier)){
            // implement the result
            (
                IImplementResult.Response _responseStatus,
                bytes memory _responseData
            ) = _implement(address(this), instances[identifier].callback);
                
            // check whether the response from the call was not susccessful
            if (_responseStatus == IImplementResult.Response.failed) {
                _status[identifier] = uint256(IImplementResult.VotingStatusImplement.failed);
                _handleFailedImplementation(identifier, _responseData);
            } else {
                _status[identifier] = uint256(IImplementResult.VotingStatusImplement.completed);
            }
        }
    }

    function _beforeStart(bytes memory votingParams) virtual internal {}

    function _beforeVote(uint256 identifier) virtual internal {}
}


abstract contract StartAndVoteOnlyCallbackImplCallerHooks is 
IStartAndVote, 
IImplementingPermitted,
InstanceInfoWithCallback, 
SecurityPrimitive,
HandleImplementationResponse,
StatusPrimitive,
ImplementingPermitted,
ImplementResultPrimitive
{
    function start(bytes memory votingParams, bytes calldata callback) 
    external 
    override(IStartAndVote){
        _beforeStart(votingParams);
        bytes4 selector = bytes4(callback[0:4]);
        if (!SecurityPrimitive._isVotableFunction(selector)){
            revert SecurityPrimitive.IsNotVotableFunction(selector);
        }
        address votingContract = assignedContract[selector];
        uint256 identifier = IVotingContract(votingContract).start(votingParams, callback);
        _status[instances.length] = uint256(IImplementResult.VotingStatusImplement.active);
        instances.push(InstanceWithCallback({
            identifier: identifier,
            votingContract: votingContract,
            callback: callback
        }));
        _afterStart(identifier, votingParams, callback);
    }

    
    function vote(uint256 identifier, bytes memory votingData) 
    external 
    override(IStartAndVote){
        _beforeVote(identifier);
        uint256 remoteStatus = IVotingContract(instances[identifier].votingContract).vote(
            instances[identifier].identifier,
            votingData);
        if(remoteStatus==uint256(IImplementResult.VotingStatusImplement.awaitcall) && _implementingPermitted(identifier)){
            // implement the result
            (
                IImplementResult.Response _responseStatus,
                bytes memory _responseData
            ) = _implement(address(this), instances[identifier].callback);
                
            // check whether the response from the call was susccessful
            if (_responseStatus == IImplementResult.Response.successful) {
                _status[identifier] = uint256(IImplementResult.VotingStatusImplement.complete);
                _handleNotFailedImplementation(identifier, _responseData);
            } else {
                _status[identifier] = uint256(IImplementResult.VotingStatusImplement.failed);
                _handleFailedImplementation(identifier, _responseData);
            }  
        }
        _afterVote(identifier, remoteStatus, votingData);
    }


    function _beforeStart(bytes memory votingParams, bytes calldata callback) virtual internal {}

    function _afterStart(uint256 identifier, bytes memory votingParams, bytes calldata callback) virtual internal {}

    function _beforeVote(uint256 identifier, bytes memory votingData) virtual internal {}

    function _afterVote(uint256 identifier, uint256 status, bytes memory votingData) virtual internal {}

}
