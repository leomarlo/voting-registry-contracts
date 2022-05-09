//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import {IVoteContract} from "../voteContract/IVoteContract.sol";



interface IVotingRegistry {

    function register(bytes8 categoryId) external returns(uint256 registrationIndex);
    function isRegistered(address voteContract) external view returns(bool registrationFlag);

    function addCategoryToRegistration(bytes8 categoryId) external;
    function isRegisteredCategory(bytes8 categoryId) external view returns(bool registrationFlag);

}