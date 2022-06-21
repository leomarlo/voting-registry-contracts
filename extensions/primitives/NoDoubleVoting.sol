// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;

import {ANoDoubleVoting} from "../interfaces/ANoDoubleVoting.sol";
import {IQueryDoubleVoting} from "../interfaces/IQueryIdentifier.sol";


abstract contract NoDoubleVoting is ANoDoubleVoting {
    
    mapping(uint256=>mapping(address=>bool)) internal _alreadyVoted;

    function _hasAlreadyVoted(uint256 identifier, address voter)
    override(ANoDoubleVoting) 
    internal 
    view
    returns(bool alreadyVoted)
    {
        alreadyVoted = _alreadyVoted[identifier][voter];
    }

    function _setAlreadyVoted(uint256 identifier, address voter) 
    override(ANoDoubleVoting)
    internal
    {
        _alreadyVoted[identifier][voter] = true;
    }

    modifier doubleVotingGuard(uint256 identifier, address voter) {
        if(_alreadyVoted[identifier][voter]){
            revert ANoDoubleVoting.AlreadyVoted(identifier, voter);
        }
        _;
        _alreadyVoted[identifier][voter] = true;
    } 

}


abstract contract DoubleVotingPublicQuery is 
IQueryDoubleVoting,
NoDoubleVoting 
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