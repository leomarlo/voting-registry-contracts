// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;





interface IImplementingPermitted {

    error ImplementingNotPermitted(uint256 identifier, uint256 status);

    
    /// @dev Checks whether the current voting instance permits implementation of the result. This is customizable.
    /// @param identifier the index for the voting instance in question
    /// @return permitted a boolean flag that is raised when the voting instance permits implementation of the result.
    function implementingPermitted(uint256 identifier) external view returns(bool permitted);
}