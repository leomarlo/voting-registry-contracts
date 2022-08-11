// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;


import {IHasAlreadyVoted} from "../interfaces/IHasAlreadyVoted.sol";


abstract contract NoDoubleVoting  {
    
    error AlreadyVoted(uint256 identifier, address voter);
    
    mapping(uint256=>mapping(address=>bool)) internal _alreadyVoted;

}

abstract contract HandleDoubleVotingGuard {

    enum VotingGuard {none, onSender, onVotingData}

    mapping(uint256=>VotingGuard) internal _guardOnSenderVotingDataOrNone; //_guardOnSenderVotingDataOrNone;

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