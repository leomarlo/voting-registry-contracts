//SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;

import { IIntegrationImplementIsPublic } from "../interface/IVotingIntegration.sol";
import { IVotingContract } from "../../votingContractStandard/IVotingContract.sol";
import { SecurityPrimitive } from "./SecurityPrimitive.sol";
import { IImplementResult } from "../../extensions/interfaces/IImplementResult.sol";
import { IndexedVotingContracts } from "../primitives/IndexedVotingContractsMapping.sol";


abstract contract ImplementIsPublicWithHooks is IIntegrationImplementIsPublic, SecurityPrimitive {

    function start(bytes memory votingParams, bytes memory callback) 
    external 
    override(IIntegrationImplementIsPublic){
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
    override(IIntegrationImplementIsPublic)
    {
        _beforeVote(identifier, votingData);
        uint256 status = IVotingContract(getVotingContract(identifier)).vote(identifier, votingData);
        _afterVote(identifier, status);
    }

    function implement(uint256 identifier, bytes memory callbackData)
    virtual
    external {
        IImplementResult.Response response; 
        response = IImplementResult(getVotingContract(identifier)).implement(identifier, callbackData);
        _afterImplement(identifier, uint256(response));
    }

    function getVotingContract(uint256 identifier) virtual public view returns(address votingContract) {}

    function _beforeStart(bytes memory votingParams, bytes memory callback) virtual internal {}

    function _afterStart(uint256 identifier, bytes memory votingParams, bytes memory callback) virtual internal {}

    function _beforeVote(uint256 identifier, bytes memory votingData) virtual internal {}

    function _afterVote(uint256 identifier, uint256 status) virtual internal {}

    function _afterImplement(uint256 identifier, uint256 response) virtual internal {}
}



abstract contract ImplementIsPublicMinimal is IIntegrationImplementIsPublic, IndexedVotingContracts, SecurityPrimitive {

    function start(bytes memory votingParams, bytes memory callback) 
    external 
    override(IIntegrationImplementIsPublic){
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
    override(IIntegrationImplementIsPublic)
    {
        _beforeVote(identifier, votingData);
        IVotingContract(indexedVotingContracts[identifier]).vote(identifier, votingData);
    }

    /// @dev Can also be overridden with a coustom implement function
    function implement(uint256 identifier, bytes memory callbackData)
    external 
    virtual 
    {
        IImplementResult(indexedVotingContracts[identifier]).implement(identifier, callbackData);
    }

    function _beforeStart(bytes memory votingParams, bytes memory callback) virtual internal {}

    function _beforeVote(uint256 identifier, bytes memory votingData) virtual internal {}

}
