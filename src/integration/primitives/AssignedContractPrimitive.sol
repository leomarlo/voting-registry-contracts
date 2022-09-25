//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

error OnlyVoteImplementer(address implementer);
error NotLegitIdentifer(address votingContract, uint256 identifier);

abstract contract AssignedContractPrimitive {
    
    error IsNotVotableFunction(bytes4 selector);

    mapping(bytes4=>address) internal assignedContract; 

    function _isVotableFunction(bytes4 selector) internal view returns(bool votable){
        return assignedContract[selector]!=address(0);
    }
}

abstract contract LegitInstanceHash {
    mapping(bytes32=>bool) internal _isLegitInstanceHash;

    function _getInstanceHash(address votingContract, uint256 identifier) pure internal returns(bytes32) {
        return keccak256(abi.encode(votingContract, identifier));
    }
}

abstract contract SecurityPrimitive {
    
    error IsNotImplementer(address imposter);

    function _isImplementer(bool checkIdentifier) virtual internal returns(bool){}

}

abstract contract SecurityThroughAssignmentPrimitive is 
LegitInstanceHash,
AssignedContractPrimitive, 
SecurityPrimitive 
{

    function _isImplementer(bool checkIdentifier)
    virtual 
    internal 
    override(SecurityPrimitive)
    returns(bool){

        bool isImplementer = assignedContract[msg.sig]==msg.sender;
        
        if (!checkIdentifier || !isImplementer) return isImplementer;
        if (msg.data.length<36) return false;

        uint256 identifier = uint256(bytes32(msg.data[(msg.data.length - 32):msg.data.length]));
        
        // only need to check whether identifier is legit
        // because if the assigned contract was wrong the 
        // first if-condition would have returned false
        return _isLegitInstanceHash[_getInstanceHash(msg.sender, identifier)];
    }

}