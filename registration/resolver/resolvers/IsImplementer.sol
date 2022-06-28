// SPDX-License-Identifier: GPL-2.0

pragma solidity ^0.8.4;

contract IsImplementerResolver {
    mapping(address=>bool) public isImplementer;

    function _setIsImplementer(address votingContract, bool _isImplementer) internal {
        isImplementer[votingContract] = _isImplementer;
    }

    function getIsImplementer(address votingContract) external view returns(bool) {
        return isImplementer[votingContract];
    }
}