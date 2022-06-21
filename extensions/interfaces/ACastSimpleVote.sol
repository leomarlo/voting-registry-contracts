// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;


abstract contract ACastSimpleVote{

    function _castVote(uint256 identifier, uint256 amount) virtual internal;

    function _getVotes(uint256 identifier) virtual internal view returns(int256 amount);

}
