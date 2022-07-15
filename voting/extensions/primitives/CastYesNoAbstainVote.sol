// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;



contract CastYesNoAbstainVote {

    enum VoteOptions {no, yes, abstain}

    mapping(uint256=>uint256[3]) internal _vote;

    function _castVote(uint256 identifier, VoteOptions option, uint256 amount) internal {
        // Since solidity 0.8.0 this will throw an error for amounts bigger than 2^(255-1), as it should!
        _vote[identifier][uint256(option)] += amount;
    }

    function _getVotes(uint256 identifier) internal view returns(uint256[3] memory _votes) {
        return _vote[identifier];
    }
}
