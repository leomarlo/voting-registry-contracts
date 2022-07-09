//SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;

import { IIntegrationVoteWithoutCallback } from "../interface/IVotingIntegration.sol";
import {IVotingContract} from "../../votingContractStandard/IVotingContract.sol";
import {SecurityPrimitive} from "./SecurityPrimitive.sol";
import {IImplementResult} from "../../extensions/interfaces/IImplementResult.sol";
import {IndexedVotingContracts} from "../primitives/IndexedVotingContractsMapping.sol";


abstract contract VoteWithoutCallbackWithHooks is IIntegrationVoteWithoutCallback, SecurityPrimitive {

    function start(bytes memory votingParams, bytes memory callback) 
    external 
    override(IIntegrationVoteWithoutCallback){
        _beforeStart(votingParams, callback);
        bytes4 selector = bytes4(callback);
        if (!SecurityPrimitive._isVotableFunction(selector)){
            revert SecurityPrimitive.IsNotVotableFunction(selector);
        }
        uint256 identifier = IVotingContract(assignedContract[selector]).start(votingParams, callback);
        _afterStart(identifier, votingParams, callback);
    }

    function vote(uint256 identifier, bytes memory votingData) 
    external 
    override(IIntegrationVoteWithoutCallback)
    {
        _beforeVote(identifier, votingData);
        uint256 status = IVotingContract(getVotingContract(identifier)).vote(identifier, votingData);
        _afterVote(identifier, status);
    }

    function getVotingContract(uint256 identifier) virtual public view returns(address votingContract) {}

    function _beforeStart(bytes memory votingParams, bytes memory callback) virtual internal {}

    function _afterStart(uint256 identifier, bytes memory votingParams, bytes memory callback) virtual internal {}

    function _beforeVote(uint256 identifier, bytes memory votingData) virtual internal {}

    function _afterVote(uint256 identifier, uint256 status) virtual internal {}

}


abstract contract VoteWithoutCallbackMinimal is IIntegrationVoteWithoutCallback, IndexedVotingContracts, SecurityPrimitive {

    function start(bytes memory votingParams, bytes memory callback) 
    external 
    override(IIntegrationVoteWithoutCallback){
        _beforeStart(votingParams, callback);
        bytes4 selector = bytes4(callback);
        if (!SecurityPrimitive._isVotableFunction(selector)){
            revert SecurityPrimitive.IsNotVotableFunction(selector);
        }
        uint256 identifier = IVotingContract(assignedContract[selector]).start(votingParams, callback);
        indexedVotingContracts[identifier] = assignedContract[selector];
    }

    function vote(uint256 identifier, bytes memory votingData) 
    external 
    override(IIntegrationVoteWithoutCallback)
    {
        _beforeVote(identifier, votingData);
        IVotingContract(indexedVotingContracts[identifier]).vote(identifier, votingData);
    }

    function _beforeStart(bytes memory votingParams, bytes memory callback) virtual internal {}

    function _beforeVote(uint256 identifier, bytes memory votingData) virtual internal {}

}
