// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;


contract Deadline {

    error DeadlineHasPast(uint256 identifier, uint256 deadline);

    mapping(uint256=>uint256) internal _deadline;

    function _setDeadline(uint256 identifier, uint256 duration) internal {
        _deadline[identifier] = block.timestamp + duration;
    }

    function _deadlineHasPast(uint256 identifier) internal view returns(bool hasPast) {
        return block.timestamp > _deadline[identifier];
    }
}
