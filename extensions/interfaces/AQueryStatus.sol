// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;



abstract contract AQueryStatus {

    function _getStatus(uint256 identifier) public view virtual returns(uint256 status);

    function _setStatus(uint256 identifier, uint256 status) internal virtual;
}

abstract contract AImplementingPermitted {

    error ImplementingNotPermitted(uint256 identifier);

    /// @dev Checks whether the current voting instance permits implementation of the result. This is customizable.
    /// @param identifier the index for the voting instance in question
    /// @return permitted a boolean flag that is raised when the voting instance permits implementation of the result.
    function _implementingPermitted(uint256 identifier) virtual internal view returns(bool permitted);
}


