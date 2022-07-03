// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;





interface IImplementingPermitted {

    error ImplementingNotPermitted(uint256 identifier);

    
    /// @dev Checks whether the current voting instance permits implementation of the result. This is customizable.
    /// @param identifier the index for the voting instance in question
    /// @return permitted a boolean flag that is raised when the voting instance permits implementation of the result.
    function implementingPermitted(uint256 identifier) external view returns(bool permitted);
}