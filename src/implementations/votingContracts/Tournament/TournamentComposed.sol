// // SPDX-License-Identifier: GPL-3.0
// pragma solidity ^0.8.13;


// import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// import {IVotingContract} from "../../../votingContractStandard/IVotingContract.sol";
// import {Deadline} from "../../../extensions/primitives/Deadline.sol";
// import {CastSimpleVote} from "../../../extensions/primitives/CastSimpleVote.sol";
// import {CallbackHashPrimitive} from "../../../extensions/primitives/CallbackHash.sol";
// import {CheckCalldataValidity} from "../../../extensions/primitives/CheckCalldataValidity.sol";
// import {CallerPrimitive, CallerGetter} from "../../../extensions/primitives/Caller.sol";
// import {BaseVotingContract} from "../../../extensions/abstracts/BaseVotingContract.sol";
// import {ImplementingPermitted} from "../../../extensions/primitives/ImplementingPermitted.sol";
// import {IImplementResult} from "../../../extensions/interfaces/IImplementResult.sol";
// import {StatusGetter, StatusError} from "../../../extensions/primitives/Status.sol";
// import {
//     ExpectReturnValue,
//     HandleImplementationResponse
// } from "../../../extensions/primitives/ImplementResultPrimitive.sol";
// import {ImplementResultWithInsertion} from "../../../extensions/primitives/ImplementResult.sol";
// import {TokenPrimitive} from "../../../extensions/primitives/TokenPrimitive.sol";
// import {QuorumPrimitive} from "../../../extensions/primitives/Quorum.sol";



// error CallbackInsert(uint48 insertAtByte, bytes callback);
// error OnlyDistinctOptions(uint256 identifier, bytes32 label);
// error InvalidRounds(uint256 identifier, uint8 rounds, uint256 options);
// error AlreadyVoted(uint256 identifier, uint256 group, address voter);




// contract TournamentComposed is
// CallbackHashPrimitive,
// CallerGetter,
// StatusGetter,
// Deadline,
// CheckCalldataValidity,
// TokenPrimitive,
// ImplementingPermitted,
// BaseVotingContract,
// HandleImplementationResponse,
// ImplementResultWithInsertion
// {

//     mapping(uint256 => address) internal _firstRoundVotingContract;
//     mapping(uint256 => address) internal _lastRoundsVotingContract;

//     function _start(uint256 identifier, bytes memory votingParams, bytes calldata callback)
//     virtual
//     internal
//     override(BaseVotingContract) 
//     {

//         // get voting params
//         (uint48 insertAtByte,
//          uint32 durationOfRounds,
//          uint8 rounds,
//          address firstRoundVotingContract,
//          address lastRoundsVotingContract,
//          address token,
//          bytes32[] memory permutation
//         ) = decodeParameters(votingParams);

//         // set the caller
//         _caller[identifier] = msg.sender;

//         // rounds should be bigger 1
//         if (rounds==0) revert InvalidRounds(identifier, 0, permutation.length);
        
//         // number of groups
//         uint256 groups = 2 ** (rounds - 1);

//         // rounds should accommodate for the options
//         if (permutation.length < 2*groups) revert InvalidRounds(identifier, rounds, permutation.length);
        
//                 // check that insertAtByte is legit:
//         if (uint256(insertAtByte) + 36 > callback.length) revert CallbackInsert(insertAtByte, callback);
        
//         _insertAtByte[identifier] = insertAtByte;
//         _token[identifier] = token;
//         _firstRoundVotingContract[identifier] = firstRoundVotingContract;
//         _lastRoundsVotingContract[identifier] = lastRoundsVotingContract;


//         // Set deadline and duration
//         _deadline[identifier] = block.timestamp + (durationOfRounds * rounds); 

//         // assign states and group leaders
//         _groupLeaders[identifier] = new bytes32[](groups);
//         for (uint16 i=0; i<permutation.length; i++ ) {
//             // allocate group
//             if (_state[identifier][permutation[i]]!=bytes32(0)) revert OnlyDistinctOptions(identifier, permutation[i]);

//             uint16 group = uint16(i % groups + 1);  // groups start at c=1
//             _state[identifier][permutation[i]] = TournamentLib.initializeState(group);
//             // set the initial group leaders;
//             // when i is bigger or equal to groups, then that group already has a group leader.
//             if (i<groups) _groupLeaders[identifier][group - 1] = permutation[i];  // indexing starts at 0. (here c=1)

//         }

//         // set status 
//         _status[identifier] = uint256(1).encodeStatus(uint256(IImplementResult.VotingStatusImplement.awaitcall) + rounds);

//         // hash the callback
//         _callbackHash[identifier] = keccak256(callback);
//     }


//     /// We obtain the caller and a flag (whether the target function returns a value) from the votingParams' only argument.
//     function decodeParameters(bytes memory votingParams) public pure 
//     returns(
//         uint48 insertAtByte,
//         uint32 duration,
//         uint8 rounds,
//         address token,
//         bytes32[] memory permutation
//     ) {
//         (
//             insertAtByte,
//             duration,
//             rounds,
//             token,
//             permutation
//         ) = abi.decode(votingParams, 
//         (uint48, uint32, uint8, address, bytes32[] )); 

//     }

// }