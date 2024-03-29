//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

import {IStartVoteAndImplement} from "../interface/IVotingIntegration.sol";
import {IVotingContract} from "../../votingContractStandard/IVotingContract.sol";
import {LegitInstanceHash, AssignedContractPrimitive} from "../primitives/AssignedContractPrimitive.sol";
import { Instance, InstanceInfoPrimitive } from "../primitives/InstanceInfoPrimitive.sol";
import {IImplementResult} from "../../extensions/interfaces/IImplementResult.sol";


abstract contract StartVoteAndImplementOnlyCallbackImplRemoteMinml is
IStartVoteAndImplement,
LegitInstanceHash,
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
        bytes32 instanceHash = LegitInstanceHash._getInstanceHash(assignedContract[selector], identifier);
        LegitInstanceHash._isLegitInstanceHash[instanceHash] = true;
        
    }

    
    function vote(uint256 identifier, bytes calldata votingData) 
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
        IImplementResult(instances[identifier].votingContract).implement(
                instances[identifier].identifier,
                callback);
        
    }

    function _beforeStart(bytes memory votingParams) virtual internal {}

    function _beforeVote(uint256 identifier) virtual internal {}
}

abstract contract StartVoteAndImplementOnlyCallbackImplRemoteHooks is 
IStartVoteAndImplement,
LegitInstanceHash,
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
        bytes32 instanceHash = LegitInstanceHash._getInstanceHash(assignedContract[selector], identifier);
        LegitInstanceHash._isLegitInstanceHash[instanceHash] = true;
        
        _afterStart(instances.length - 1, votingParams, callback);
    }

    
    function vote(uint256 identifier, bytes calldata votingData) 
    external 
    override(IStartVoteAndImplement){
        _beforeVote(identifier, votingData);
        uint256 status = IVotingContract(instances[identifier].votingContract).vote(
            instances[identifier].identifier,
            _modifyVotingData(identifier, votingData));
        _afterVote(identifier, status, votingData);
    }

    function implement(uint256 identifier, bytes calldata callback)
    external 
    payable
    override(IStartVoteAndImplement) 
    {
        _beforeImplement(identifier);
        IImplementResult.Response _response = IImplementResult(instances[identifier].votingContract).implement(
                instances[identifier].identifier,
                callback);
        _afterImplement(identifier, _response==IImplementResult.Response.successful);
        
    }

    function _beforeStart(bytes memory votingParams, bytes calldata callback) virtual internal {}

    function _afterStart(uint256 identifier, bytes memory votingParams, bytes calldata callback) virtual internal {}
    
    function _beforeVote(uint256 identifier, bytes calldata votingData) virtual internal {}

    function _modifyVotingData(uint256 identifier, bytes calldata votingData) virtual internal returns(bytes memory newVotingData){ return votingData;}

    function _afterVote(uint256 identifier, uint256 status, bytes calldata votingData) virtual internal {}

    function _beforeImplement(uint256 identifier) virtual internal {}
    
    function _afterImplement(uint256 identifier, bool responseFlag) virtual internal {}    

}


abstract contract StartVoteAndImplementHybridVotingImplRemoteMinml is
IStartVoteAndImplement,
LegitInstanceHash,
AssignedContractPrimitive,
InstanceInfoPrimitive 
{
    
    address public votingContract;

    function start(bytes memory votingParams, bytes calldata callback) 
    external 
    override(IStartVoteAndImplement){
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
        instances.push(Instance({
            identifier: identifier,
            votingContract: _votingContract
        }));
    }

    
    function vote(uint256 identifier, bytes calldata votingData) 
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
        _beforeImplement(identifier);
        IImplementResult(instances[identifier].votingContract).implement(
                instances[identifier].identifier,
                callback);
        
    }

    function _beforeStart(bytes memory votingParams) virtual internal {}

    function _beforeVote(uint256 identifier) virtual internal {}

    function _beforeImplement(uint256 identifier) virtual internal {}
    
}

abstract contract StartVoteAndImplementHybridVotingImplRemoteHooks is 
IStartVoteAndImplement,
LegitInstanceHash,
AssignedContractPrimitive,
InstanceInfoPrimitive
{
    function start(bytes memory votingParams, bytes calldata callback) 
    external 
    override(IStartVoteAndImplement){
        _beforeStart(votingParams, callback);
        address _votingContract;
        uint256 identifier;
        bytes5 flagAndSelector;
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
        instances.push(Instance({
            identifier: identifier,
            votingContract: _votingContract
        }));
        _afterStart(instances.length - 1, votingParams, callback);
    }

    
    function vote(uint256 identifier, bytes calldata votingData) 
    external 
    override(IStartVoteAndImplement){
        _beforeVote(identifier, votingData);
        uint256 status = IVotingContract(instances[identifier].votingContract).vote(
            instances[identifier].identifier,
            _modifyVotingData(identifier, votingData));
        _afterVote(identifier, status, votingData);
    }

    event Balaa(address votingContract, bool successflag, bytes response);

    function implement(uint256 identifier, bytes calldata callback)
    external
    payable 
    override(IStartVoteAndImplement) 
    {
        _beforeImplement(identifier);
        bytes memory data = abi.encodeWithSelector(
                IImplementResult.implement.selector, 
                instances[identifier].identifier,
                callback);
        (bool success, bytes memory responsedata) = instances[identifier].votingContract.call{value: msg.value}(data);
       
        emit Balaa(instances[identifier].votingContract, success, responsedata);
        _afterImplement(identifier, success);
        
    }

    event WhatsNow(bool success, bytes response);

    

    function _beforeStart(bytes memory votingParams, bytes calldata callback) virtual internal {}

    function _afterStart(uint256 identifier, bytes memory votingParams, bytes calldata callback) virtual internal {}
    
    function _getSimpleVotingContract(bytes calldata callback) virtual internal view returns(address) {}

    function _beforeVote(uint256 identifier, bytes calldata votingData) virtual internal {}

    function _modifyVotingData(uint256 identifier, bytes calldata votingData) virtual internal returns(bytes memory newVotingData){ return votingData;}

    function _afterVote(uint256 identifier, uint256 status, bytes calldata votingData) virtual internal {}

    function _beforeImplement(uint256 identifier) virtual internal {}
    
    function _afterImplement(uint256 identifier, bool responseFlag) virtual internal {}    

}
