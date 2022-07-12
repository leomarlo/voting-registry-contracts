// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.13;


import {IHasAlreadyVoted} from "../interfaces/IHasAlreadyVoted.sol";


abstract contract NoDoubleVoting  {
    
    error AlreadyVoted(uint256 identifier, address voter);
    
    mapping(uint256=>mapping(address=>bool)) internal _alreadyVoted;


    modifier doubleVotingGuard(uint256 identifier, address voter) {
        if(_alreadyVoted[identifier][voter]){
            revert AlreadyVoted(identifier, voter);
        }
        _;
        _alreadyVoted[identifier][voter] = true;
    } 

}


abstract contract NoDoubleVotingPublic is 
IHasAlreadyVoted,
NoDoubleVoting 
{
    function hasAlreadyVoted(uint256 identifier, address voter) 
    external 
    view 
    override(IHasAlreadyVoted)
    returns(bool alreadyVoted)
    {
        alreadyVoted = _alreadyVoted[identifier][voter]; 
    }   
} 