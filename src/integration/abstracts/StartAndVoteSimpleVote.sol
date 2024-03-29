//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

import {IStartAndVote} from "../interface/IVotingIntegration.sol";
import {IVotingContract} from "../../votingContractStandard/IVotingContract.sol";
import {AssignedContractPrimitive} from "../primitives/AssignedContractPrimitive.sol";
import { Instance, InstanceInfoPrimitive } from "../primitives/InstanceInfoPrimitive.sol";


abstract contract StartAndVoteSimpleVotingMinml is IStartAndVote {

    IVotingContract public votingContract;

    function start(bytes memory votingParams, bytes calldata callback) 
    external 
    override(IStartAndVote){
        _beforeStart(votingParams);
        votingContract.start(votingParams, callback);
    }

    function vote(uint256 identifier, bytes calldata votingData) 
    external 
    override(IStartAndVote){
        _beforeVote(identifier);
        votingContract.vote(identifier, votingData);
    }

    function _beforeStart(bytes memory votingParams) virtual internal {}

    function _beforeVote(uint256 identifier) virtual internal {}

}



abstract contract StartAndVoteSimpleVotingHooks is IStartAndVote, InstanceInfoPrimitive {

    function start(bytes memory votingParams, bytes calldata callback) 
    external 
    override(IStartAndVote){
        _beforeStart(votingParams, callback);
        address _votingContract = _getSimpleVotingContract(callback);
        uint256 identifier = IVotingContract(_votingContract).start(votingParams, callback);
        instances.push(Instance({
            identifier: identifier,
            votingContract: _votingContract
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
        _afterVote(identifier, status, votingData);
    }

    function _beforeStart(bytes memory votingParams, bytes calldata callback) virtual internal {}

    function _afterStart(uint256 identifier, bytes memory votingParams, bytes calldata callback) virtual internal {}

    function _getSimpleVotingContract(bytes calldata callback) virtual internal view returns(address) {}

    function _beforeVote(uint256 identifier, bytes calldata votingData) virtual internal {}

    function _modifyVotingData(uint256 identifier, bytes calldata votingData) virtual internal returns(bytes memory newVotingData){ return votingData;}

    function _afterVote(uint256 identifier, uint256 status, bytes calldata votingData) virtual internal {}

}

