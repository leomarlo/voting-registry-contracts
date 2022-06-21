// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;



abstract contract AQueryCaller {
    function _getCaller(uint256 identifier) public view virtual returns(address caller);

    function _setCaller(uint256 identifier, address caller) internal virtual;
}
