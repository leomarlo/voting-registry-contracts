//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

error OnlyVoteImplementer(address implementer);

abstract contract AssignedContractPrimitive {
    
    error IsNotVotableFunction(bytes4 selector);

    mapping(bytes4=>address) internal assignedContract; 

    function _isVotableFunction(bytes4 selector) internal view returns(bool votable){
        return assignedContract[selector]!=address(0);
    }
}

abstract contract SecurityPrimitive {
    
    error IsNotImplementer(address imposter);

    function _isImplementer() virtual internal returns(bool){}

}

abstract contract SecurityThroughAssignmentPrimitive is 
AssignedContractPrimitive, 
SecurityPrimitive 
{

    function _isImplementer()
    virtual 
    internal 
    override(SecurityPrimitive)
    returns(bool){
        return assignedContract[msg.sig]==msg.sender;
    }

}