// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;


import {ACastSimpleVote} from "../interfaces/ACastSimpleVote.sol";

contract CastSimpleVote is ACastSimpleVote{

    mapping(uint256=>int256) internal _vote;

    function _castVote(uint256 identifier, uint256 amount) internal override(ACastSimpleVote) {
        // Since solidity 0.8.0 this will throw an error for amounts bigger than 2^(255-1), as it should!
        _vote[identifier] += int256(amount);
    }

    function _getVotes(uint256 identifier) internal view override(ACastSimpleVote) returns(int256 amount) {
        return _vote[identifier];
    }
}
