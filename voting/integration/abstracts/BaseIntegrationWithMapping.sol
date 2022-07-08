//SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;

import {VotingIntegrationPrimitive} from "../primitives/VotingIntegrationPrimitive.sol";
import {IndexedVotingContracts} from "../primitives/IndexedVotingContractsMapping.sol";


contract BaseVotingIntegrationMapping is IndexedVotingContracts, VotingIntegrationPrimitive {
    
    function _afterStart(
        uint256 identifier,
        bytes memory votingParams,
        bytes memory callback) 
    internal 
    override(VotingIntegrationPrimitive) 
    {
        votingParams;
        indexedVotingContracts[identifier] = assignedContract[bytes4(callback)];
    }

    function getVotingContract(uint256 identifier)
    public 
    view 
    override(VotingIntegrationPrimitive)
    returns(address votingContract)
    {
        return indexedVotingContracts[identifier];
    }
}
