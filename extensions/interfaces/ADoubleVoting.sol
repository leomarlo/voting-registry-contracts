// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;

abstract contract ADoubleVoting {

    error AlreadyVoted(uint256 identifier, address voter);

    function _hasAlreadyVoted(uint256 identifier, address voter) virtual internal view returns(bool alreadyVoted);

    function _setAlreadyVoted(uint256 identifier, address voter) virtual internal;
    
}