// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;


interface IHasAlreadyVoted {
    function hasAlreadyVoted(uint256 identifier, address voter) external view returns(bool alreadyVoted);
}


