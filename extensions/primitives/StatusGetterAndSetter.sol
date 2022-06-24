// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;


abstract contract StatusGetterAndSetter {
    
    mapping (uint256=>uint256) internal _status;

    function _getStatus(uint256 identifier) public view virtual returns(uint256 status) {
        status = _status[identifier];
    } 

    function _setStatus(uint256 identifier, uint256 status) internal virtual {
        _status[identifier] = status;
    }
}
