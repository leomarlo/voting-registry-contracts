//SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;

import {VotingIntegrationPrimitive} from "../primitives/VotingIntegrationPrimitive.sol";
import {Instance, InstanceWithStatus, InstanceInfoPrimitive, InstanceInfoWithStatusPrimitive} from "../primitives/InstanceInfoPrimitive.sol";


contract BaseIntegrationWithSimpleStruct is InstanceInfoPrimitive, VotingIntegrationPrimitive {

    function _afterStart(
        uint256 identifier,
        bytes memory votingParams,
        bytes memory callback) 
    internal 
    override(VotingIntegrationPrimitive) 
    {
        votingParams;
        
        instances.push(
            Instance({
                identifier: identifier,
                votingContract: assignedContract[bytes4(callback)]
        }));
    }

    function getVotingContract(uint256 identifier)
    public 
    view 
    override(VotingIntegrationPrimitive)
    returns(address votingContract)
    {
        return instances[identifier].votingContract;
    }
}



contract BaseIntegrationWithStatusStruct is InstanceInfoWithStatusPrimitive, VotingIntegrationPrimitive {

    function _afterStart(
        uint256 identifier,
        bytes memory votingParams,
        bytes memory callback) 
    internal 
    override(VotingIntegrationPrimitive) 
    {
        votingParams;
        
        instances.push(
            InstanceWithStatus({
                identifier: identifier,
                votingContract: assignedContract[bytes4(callback)],
                implementationStatus: 0
        }));
    }

    function getVotingContract(uint256 identifier)
    public 
    view 
    override(VotingIntegrationPrimitive)
    returns(address votingContract)
    {
        return instances[identifier].votingContract;
    }
}

