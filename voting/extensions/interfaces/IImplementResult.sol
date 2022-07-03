// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;

interface IImplementResult {

    enum VotingStatusImplement {inactive, completed, failed, active, awaitcall}
    
    enum Response {precall, successful, failed}

    event Implemented(uint256 identifier, bytes callbackData);

    /// @dev Checks whether the current voting instance permits voting. This is customizable.
    /// @param identifier the index for the voting instance in question
    /// @param callbackData data that is passed along with the function call.
    /// @return response information on whether the call was successful or unsuccessful.
    function implement(uint256 identifier, bytes memory callbackData) external returns(Response response); 
}