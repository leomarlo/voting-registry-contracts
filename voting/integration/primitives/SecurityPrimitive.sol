//SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;

abstract contract SecurityPrimitive {
    
    error IsNotVotableFunction(bytes4 selector);

    mapping(bytes4=>address) internal assignedContract; 

    function _isVotableFunction(bytes4 selector) internal view returns(bool votable){
        return assignedContract[selector]!=address(0);
    }
}