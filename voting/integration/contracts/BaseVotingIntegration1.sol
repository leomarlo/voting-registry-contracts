//SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;

import {IVotingIntegration} from "../interface/IVotingIntegration.sol";
import {IVotingContract} from "../../votingContractStandard/IVotingContract.sol";
import {VotingIntegrationPrimitive} from "../primitives/VotingIntegrationPrimitive.sol";


contract BaseVotingIntegration1 is VotingIntegrationPrimitive {
    
    mapping(uint256=>address) public votingContracts;    

    function _afterStart(
        uint256 identifier,
        bytes memory votingParams,
        bytes memory callback) 
    internal 
    override(VotingIntegrationPrimitive) 
    {
        votingParams;
        votingContracts[identifier] = assignedContract[bytes4(callback)];
    }

    function getVotingContract(uint256 identifier)
    public 
    view 
    override(VotingIntegrationPrimitive)
    returns(address votingContract)
    {
        return votingContracts[identifier];
    }
}
