// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;


abstract contract ADeadline{

    function _setDeadline(uint256 identifier, uint256 duration) internal virtual;

    function _getDeadline(uint256 identifier) internal view virtual returns(uint256 deadline);

    function _deadlineHasPast(uint256 identifier) internal view virtual returns(bool hasPast); 
}
