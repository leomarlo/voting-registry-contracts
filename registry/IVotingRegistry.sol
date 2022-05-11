//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {IVoteContract} from "../voteContract/IVoteContract.sol";

interface IVotingRegistry {

    /// @dev handles the registration of new voting contracts with a category id.
    /// @param categoryId the category id that the voting contract seeks to add to the registration.
    /// @return the registration index for the successfully registered new voting contract.
    function register(bytes8 categoryId) external returns(uint256 registrationIndex);

    /// @dev allows anyone and any contract to check whether a given voting contract has registered.
    /// @param votingContract the address of the voting contract whose registration is sought after.
    /// @return registrationFlag a boolean response to the registration status request of the voting contract.
    function isRegistered(address votingContract) external view returns(bool registrationFlag);

    /// @dev adds another category to the existing registration.
    /// @param categoryId the category id which the voting contract seeks to add to its registration.
    function addCategoryToRegistration(bytes8 categoryId) external;

    /// @dev allows anyone and any contract to check whether a given voting contract has already been registered.
    /// @param categoryId the category id whose registration status is being requested.
    /// @return registrationFlag a boolean response to the request of the category registration status.
    function isRegisteredCategory(bytes8 categoryId) external view returns(bool registrationFlag);

}