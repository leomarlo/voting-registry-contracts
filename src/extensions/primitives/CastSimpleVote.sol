// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;



contract CastSimpleVote {

    mapping(uint256=>int256) internal _vote;

    function _castVote(uint256 identifier, int256 amount) internal {
        // Since solidity 0.8.0 this will throw an error for amounts bigger than 2^(255-1), as it should!
        _vote[identifier] += int256(amount);
    }

    function _getVotes(uint256 identifier) internal view returns(int256 amount) {
        return _vote[identifier];
    }
}
