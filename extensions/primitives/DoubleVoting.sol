// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;

import {ADoubleVoting} from "../interfaces/ADoubleVoting.sol";
import {IQueryDoubleVoting} from "../interfaces/IQueryIdentifier.sol";


abstract contract DoubleVoting is ADoubleVoting {
    
    mapping(uint256=>mapping(address=>bool)) internal _alreadyVoted;

    function _hasAlreadyVoted(uint256 identifier, address voter)
    override(ADoubleVoting) 
    internal 
    view
    returns(bool alreadyVoted)
    {
        alreadyVoted = _alreadyVoted[identifier][voter];
    }

    function _setAlreadyVoted(uint256 identifier, address voter) 
    override(ADoubleVoting)
    internal
    {
        _alreadyVoted[identifier][voter] = true;
    }

}


abstract contract DoubleVotingPublicQuery is 
IQueryDoubleVoting,
DoubleVoting 
{
    function hasAlreadyVoted(uint256 identifier, address voter) 
    external 
    view 
    override(IQueryDoubleVoting)
    returns(bool alreadyVoted)
    {
        alreadyVoted = _hasAlreadyVoted(identifier, voter); 
    }   
} 