//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

import {IStartAndVote} from "../interface/IVotingIntegration.sol";
import {IVotingContract} from "../../votingContractStandard/IVotingContract.sol";
import {LegitInstanceHash, AssignedContractPrimitive} from "../primitives/AssignedContractPrimitive.sol";
import {
    InstanceWithCallback,
    InstanceInfoWithCallback
} from "../primitives/InstanceInfoPrimitive.sol";
import {IImplementResult} from "../../extensions/interfaces/IImplementResult.sol";


abstract contract StartAndVoteHybridVotingImplRemoteMinml is 
IStartAndVote, 
InstanceInfoWithCallback,
LegitInstanceHash, 
AssignedContractPrimitive
{

    address public votingContract;

    function start(bytes memory votingParams, bytes calldata callback) 
    external 
    override(IStartAndVote){
        _beforeStart(votingParams);
        address _votingContract;
        uint256 identifier;
        if (callback.length<4){
            _votingContract = votingContract;
            identifier = IVotingContract(_votingContract).start(votingParams, callback);
        } else {
            bytes4 selector = bytes4(callback[0:4]);
            if (!AssignedContractPrimitive._isVotableFunction(selector)){
                revert AssignedContractPrimitive.IsNotVotableFunction(selector);
            }
            _votingContract = assignedContract[selector];
            identifier = IVotingContract(_votingContract).start(votingParams, callback);
            bytes32 instanceHash = LegitInstanceHash._getInstanceHash(assignedContract[selector], identifier);
            LegitInstanceHash._isLegitInstanceHash[instanceHash] = true;
        }
        
        instances.push(InstanceWithCallback({
            identifier: identifier,
            votingContract: _votingContract,
            callback: callback
        }));
        
    }

    
    function vote(uint256 identifier, bytes calldata votingData) 
    external 
    override(IStartAndVote){
        _beforeVote(identifier);
        uint256 status = IVotingContract(instances[identifier].votingContract).vote(
            instances[identifier].identifier,
            votingData);
        if(status==uint256(IImplementResult.VotingStatusImplement.awaitcall) && instances[identifier].callback.length<4){
            // implement the result
            IImplementResult(instances[identifier].votingContract).implement(
                instances[identifier].identifier,
                instances[identifier].callback);
            
        }
    }

    function _beforeStart(bytes memory votingParams) virtual internal {}

    function _beforeVote(uint256 identifier) virtual internal {}

}


abstract contract StartAndVoteHybridVotingImplRemoteHooks is 
IStartAndVote, 
InstanceInfoWithCallback, 
LegitInstanceHash,
AssignedContractPrimitive
{
 
    function start(bytes memory votingParams, bytes calldata callback) 
    external 
    override(IStartAndVote){
        _beforeStart(votingParams, callback);
        address _votingContract;
        uint256 identifier;
        if (callback.length<4){
            _votingContract = _getSimpleVotingContract(callback);
            identifier = IVotingContract(_votingContract).start(votingParams, callback);
        } else {
            bytes4 selector = bytes4(callback[0:4]);
            if (!AssignedContractPrimitive._isVotableFunction(selector)){
                revert AssignedContractPrimitive.IsNotVotableFunction(selector);
            }
            _votingContract = assignedContract[selector];
            identifier = IVotingContract(_votingContract).start(votingParams, callback);
            bytes32 instanceHash = LegitInstanceHash._getInstanceHash(assignedContract[selector], identifier);
            LegitInstanceHash._isLegitInstanceHash[instanceHash] = true;
        }
        
        instances.push(InstanceWithCallback({
            identifier: identifier,
            votingContract: _votingContract,
            callback: callback
        }));
        _afterStart(instances.length - 1, votingParams, callback);
    }

    
    function vote(uint256 identifier, bytes calldata votingData) 
    external 
    override(IStartAndVote){
        _beforeVote(identifier, votingData);
        uint256 status = IVotingContract(instances[identifier].votingContract).vote(
            instances[identifier].identifier,
            _modifyVotingData(identifier, votingData));
        if(status==uint256(IImplementResult.VotingStatusImplement.awaitcall) && instances[identifier].callback.length<4){
            // implement the result
            IImplementResult.Response _responseStatus;
            _responseStatus = IImplementResult(instances[identifier].votingContract).implement(
                instances[identifier].identifier,
                instances[identifier].callback);
            _afterImplementation(identifier, _responseStatus);
        }
        _afterVote(identifier, status, votingData);
    }

    function _beforeStart(bytes memory votingParams, bytes calldata callback) virtual internal {}

    function _afterStart(uint256 identifier, bytes memory votingParams, bytes calldata callback) virtual internal {}

    function _getSimpleVotingContract(bytes calldata callback) virtual internal view returns(address) {}

    function _beforeVote(uint256 identifier, bytes calldata votingData) virtual internal {}

    function _modifyVotingData(uint256 identifier, bytes calldata votingData) virtual internal returns(bytes memory newVotingData){ return votingData;}

    function _afterVote(uint256 identifier, uint256 status, bytes calldata votingData) virtual internal {}

    function _afterImplementation(uint256 identifier, IImplementResult.Response _responseStatus) virtual internal;
}



abstract contract StartAndVoteOnlyCallbackImplRemoteMinml is 
IStartAndVote, 
InstanceInfoWithCallback,
LegitInstanceHash, 
AssignedContractPrimitive
{

    function start(bytes memory votingParams, bytes calldata callback) 
    external 
    override(IStartAndVote){
        _beforeStart(votingParams);
        bytes4 selector = bytes4(callback[0:4]);
        if (!AssignedContractPrimitive._isVotableFunction(selector)){
            revert AssignedContractPrimitive.IsNotVotableFunction(selector);
        }
        address votingContract = assignedContract[selector];
        uint256 identifier = IVotingContract(votingContract).start(votingParams, callback);
        instances.push(InstanceWithCallback({
            identifier: identifier,
            votingContract: votingContract,
            callback: callback
        }));
        bytes32 instanceHash = LegitInstanceHash._getInstanceHash(assignedContract[selector], identifier);
        LegitInstanceHash._isLegitInstanceHash[instanceHash] = true;
        
    }

    
    function vote(uint256 identifier, bytes calldata votingData) 
    external 
    override(IStartAndVote){
        _beforeVote(identifier);
        uint256 status = IVotingContract(instances[identifier].votingContract).vote(
            instances[identifier].identifier,
            votingData);
        if(status==uint256(IImplementResult.VotingStatusImplement.awaitcall)){
            // implement the result
            IImplementResult(instances[identifier].votingContract).implement(
                instances[identifier].identifier,
                instances[identifier].callback);
        }
    }

    function _beforeStart(bytes memory votingParams) virtual internal {}
  
    function _beforeVote(uint256 identifier) virtual internal {}
}


abstract contract StartAndVoteOnlyCallbackImplRemoteHooks is 
IStartAndVote, 
InstanceInfoWithCallback,
LegitInstanceHash, 
AssignedContractPrimitive
{
    function start(bytes memory votingParams, bytes calldata callback) 
    external 
    override(IStartAndVote){
        _beforeStart(votingParams, callback);
        bytes4 selector = bytes4(callback[0:4]);
        if (!AssignedContractPrimitive._isVotableFunction(selector)){
            revert AssignedContractPrimitive.IsNotVotableFunction(selector);
        }
        address votingContract = assignedContract[selector];
        uint256 identifier = IVotingContract(votingContract).start(votingParams, callback);
        instances.push(InstanceWithCallback({
            identifier: identifier,
            votingContract: votingContract,
            callback: callback
        }));
        bytes32 instanceHash = LegitInstanceHash._getInstanceHash(assignedContract[selector], identifier);
        LegitInstanceHash._isLegitInstanceHash[instanceHash] = true;
        _afterStart(instances.length - 1, votingParams, callback);
    }

    
    function vote(uint256 identifier, bytes calldata votingData) 
    external 
    override(IStartAndVote){
        _beforeVote(identifier, votingData);
        uint256 status = IVotingContract(instances[identifier].votingContract).vote(
            instances[identifier].identifier,
            _modifyVotingData(identifier, votingData));
        if(status==uint256(IImplementResult.VotingStatusImplement.awaitcall)){
            // implement the result
            IImplementResult.Response _responseStatus;
            _responseStatus = IImplementResult(instances[identifier].votingContract).implement(
                instances[identifier].identifier,
                instances[identifier].callback);
            _afterImplementation(identifier, _responseStatus);
        }
        _afterVote(identifier, status, votingData);
    }

    function _beforeStart(bytes memory votingParams, bytes calldata callback) virtual internal {}

    function _afterStart(uint256 identifier, bytes memory votingParams, bytes calldata callback) virtual internal {}
    
    function _beforeVote(uint256 identifier, bytes calldata votingData) virtual internal {}

    function _modifyVotingData(uint256 identifier, bytes calldata votingData) virtual internal returns(bytes memory newVotingData){ return votingData;}

    function _afterVote(uint256 identifier, uint256 status, bytes calldata votingData) virtual internal {}

    function _afterImplementation(uint256 identifier, IImplementResult.Response _responseStatus) virtual internal;
    
}


