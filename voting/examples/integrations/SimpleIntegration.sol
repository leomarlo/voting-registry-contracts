// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;

import {BaseIntegrationWithSimpleStruct, BaseIntegrationWithStatusStruct} from "../../integration/abstracts/BaseIntegrationWithStruct.sol";
import {BaseVotingIntegrationMapping} from "../../integration/abstracts/BaseIntegrationWithMapping.sol";
import {Counter} from "../dummies/Counter.sol";
import {IImplementResult} from "../../extensions/interfaces/IImplementResult.sol";


contract SimpleIntegrationStruct is BaseIntegrationWithSimpleStruct, Counter {

    mapping(address=>bool) public isDAOMember;
    
    constructor(address[] members, address votingContract) {
        // assign the votingContract the increment function.
        assignedContract[Counter.increment.interfaceId] = votingContract;
        
        // assign some DAO Members
        for (uint256 i=0; i<members.length; i++){
            isDAOMember[members[i]] = true;
        }
    }

    function _beforeVote(uint256 identifier, bytes memory votingData) virtual internal {
        require(isDAOMember[msg.sender], "Only DAO Members");
    }
    
    function _afterVote(uint256 identifier, uint256 status, bytes memory callback)
    internal 
    override(BaseIntegrationWithSimpleStruct)
    {
        if(status==uint256(IImplementResult.VotingStatusImplement.awaitcall)){
            IImplementResult.Response response; 
            response = IImplementResult(instances[identifier].votingContract)
                .implement(instances[identifier].identifier, callback);
        }
    }

}


contract SimpleIntegrationWithStatusStruct is BaseIntegrationWithStatusStruct, Counter {

    mapping(address=>bool) public isDAOMember;
    
    constructor(address[] members, address votingContract) {
        // assign the votingContract the increment function.
        assignedContract[Counter.increment.interfaceId] = votingContract;
        
        // assign some DAO Members
        for (uint256 i=0; i<members.length; i++){
            isDAOMember[members[i]] = true;
        }
    }

    function _beforeVote(uint256 identifier, bytes memory votingData) virtual internal {
        require(isDAOMember[msg.sender], "Only DAO Members");
    }
    
    function _afterVote(uint256 identifier, uint256 status, bytes memory callback)
    internal 
    override(BaseIntegrationWithStatusStruct)
    {
        if(status==uint256(IImplementResult.VotingStatusImplement.awaitcall)){
            IImplementResult.Response response; 
            response = IImplementResult(instances[identifier].votingContract)
                .implement(instances[identifier].identifier, callback);
            instances[identifier].implementationStatus = uint256(response);
        }
    }
}

contract SimpleIntegrationMapping is BaseVotingIntegrationMapping, Counter {

    mapping(address=>bool) public isDAOMember;
    
    constructor(address[] members, address votingContract) {
        // assign the votingContract the increment function.
        assignedContract[Counter.increment.interfaceId] = votingContract;
        
        // assign some DAO Members
        for (uint256 i=0; i<members.length; i++){
            isDAOMember[members[i]] = true;
        }
    }

    function _beforeVote(uint256 identifier, bytes memory votingData) virtual internal {
        require(isDAOMember[msg.sender], "Only DAO Members");
    }
    
    function _afterVote(uint256 identifier, uint256 status)
    internal 
    override(BaseVotingIntegrationStruct)
    {
        if(status==uint256(IImplementResult.VotingStatusImplement.awaitcall)){
            // if the voting contract assignment cannot be changed
            // then it's safe to use the asigned contract mapping.
            IVotingContract(assignedContract[Counter.increment.interfaceId]).implement(identifier);
        }
    } 
}

