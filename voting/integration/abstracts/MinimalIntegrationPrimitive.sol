//SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;

import {IVotingIntegration} from "../interface/IVotingIntegration.sol";
import {IVotingContract} from "../../votingContractStandard/IVotingContract.sol";
import {SecurityPrimitive} from "../primitives/SecurityPrimitive.sol";
import {IndexedVotingContracts} from "../primitives/IndexedVotingContractsMapping.sol";
import {IImplementResult} from "../../extensions/interfaces/IImplementResult.sol";


abstract contract MinimalIntegrationPrimitive is IVotingIntegration, IndexedVotingContracts, SecurityPrimitive {

    function start(bytes memory votingParams, bytes calldata callback) 
    external 
    override(IVotingIntegration)
    {
        bytes4 selector = bytes4(callback);
        if (!SecurityPrimitive._isVotableFunction(selector)){
            revert SecurityPrimitive.IsNotVotableFunction(selector);
        }
        uint256 identifier = IVotingContract(assignedContract[selector]).start(votingParams, callback);
        indexedVotingContracts[identifier] = assignedContract[bytes4(callback)];
    }

    function vote(uint256 identifier, bytes memory votingData, bytes calldata callback) 
    external 
    override(IVotingIntegration)
    {
        _beforeVote(identifier, votingData);
        uint256 status = IVotingContract(indexedVotingContracts[identifier]).vote(identifier, votingData);
        if(status==uint256(IImplementResult.VotingStatusImplement.awaitcall)){
            IImplementResult.Response response; 
            response = IImplementResult(indexedVotingContracts[identifier]).implement(identifier, callback);
        }
    }

    function _beforeVote(uint256 identifier, bytes memory votingData) virtual internal {}


}