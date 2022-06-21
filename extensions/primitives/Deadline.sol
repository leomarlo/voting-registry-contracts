// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;


import {ADeadline} from "../interfaces/ADeadline.sol";

contract Deadline is ADeadline{

    mapping(uint256=>uint256) internal _deadline;

    function _setDeadline(uint256 identifier, uint256 duration) internal override(ADeadline) {
        _deadline[identifier] = block.timestamp + duration;
    }

    function _getDeadline(uint256 identifier) internal view override(ADeadline) returns(uint256 deadline) {
        return _deadline[identifier];
    }

    function _deadlineHasPast(uint256 identifier) internal view override(ADeadline) returns(bool hasPast) {
        return block.timestamp > _deadline[identifier];
    }
}
