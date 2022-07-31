// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IVotingContract} from "../../../votingContractStandard/IVotingContract.sol";
import {Deadline} from "../../../extensions/primitives/Deadline.sol";
import {CastSimpleVote} from "../../../extensions/primitives/CastSimpleVote.sol";
import {CallbackHashPrimitive} from "../../../extensions/primitives/CallbackHash.sol";
import {CheckCalldataValidity} from "../../../extensions/primitives/CheckCalldataValidity.sol";
import {CallerPrimitive, CallerGetter} from "../../../extensions/primitives/Caller.sol";
import {BaseVotingContract} from "../../../extensions/abstracts/BaseVotingContract.sol";
import {ImplementingPermitted} from "../../../extensions/primitives/ImplementingPermitted.sol";
import {IImplementResult} from "../../../extensions/interfaces/IImplementResult.sol";
import {StatusGetter, StatusError} from "../../../extensions/primitives/Status.sol";
import {
    ExpectReturnValue,
    HandleImplementationResponse
} from "../../../extensions/primitives/ImplementResultPrimitive.sol";
import {ImplementResultWithInsertion} from "../../../extensions/primitives/ImplementResult.sol";
import {TokenPrimitive} from "../../../extensions/primitives/TokenPrimitive.sol";
import {QuorumPrimitive} from "../../../extensions/primitives/Quorum.sol";

/// The idea of a tournament vote is by Andrei Taranu.
/// This is an implementation within the framework of the voting contract system.

/// @title Tournament Voting Contract
/// @dev This voting contract allows several rounds of voting, like in a tournament
contract Tournament is 
CallbackHashPrimitive,
CallerGetter,
StatusGetter,
CheckCalldataValidity,
TokenPrimitive,
ImplementingPermitted,
BaseVotingContract,
ExpectReturnValue,
HandleImplementationResponse,
ImplementResultWithInsertion
{

    // Should only vote through another contract
    // Should vote in rounds. The number of rounds is determined by the number of initial options
    // Should be based on a token. 
    // Should handle a tie. Depending on the setting, 
    //              - either a relegation is created amongst the ties
    //              - the first motion that is approved gets it and if no one approved then the zeroAddress goes on.
    //              - there will be another round choose either the one with 
    // Should have individual deadlines for each round
    // Should vote on all the pairs
    // 



    mapping(uint256=>mapping(bytes32=>bytes32)) internal _state;
    mapping(uint256=>mapping(uint256=>mapping(address=>uint8))) internal _alreadyVoted;
    mapping(uint256=>bytes32[]) internal _groupLeaders;
    // first 28 bytes are deadline, the rest 4 bytes are duration.
    mapping(uint256=>bytes32) internal _deadlineAndDuration; 
    
    event WinnersOfThisRound(uint256 identifier, uint8 round, bytes32[] winners);
    event WinnersOfTheFinal(uint256 identifier, bytes32 winner);
    
    error OnlyDistinctOptions(uint256 identifier, bytes32 label);
    error TooManyRounds(uint256 identifier, uint8 rounds, uint256 options);
    error AtLeastOneRound(uint256 identifier);
    error AlreadyVoted(uint256 identifier, uint16 group, bytes32 label, address voter);

    function _start(uint256 identifier, bytes memory votingParams)
    internal
    override(BaseVotingContract) 
    {
        // set the caller
        _caller[identifier] = msg.sender;

        // get voting params
        (uint48 insertAtByte,
         uint256 duration,
         uint8 rounds,
         address token,
         bytes32[] memory permutation
        ) = abi.decode(votingParams, 
            (
                uint48,
                uint256,
                uint8,
                address,
                bytes32[])
            ); 

        _insertAtByte[identifier] = insertAtByte;
        _token[identifier] = token;
        
        // number of options 
        uint256 options = permutation.length;

        // rounds should be bigger 1
        if (rounds==0) {
            revert AtLeastOneRound(identifier);
        }

        // number of groups
        uint256 groups = 2 ** (rounds - 1);

        // rounds should accommodate for the options
        if (options < 2*groups) {
            revert TooManyRounds(identifier, rounds, options);
        }
        
        // Set deadline and duration
        _deadlineAndDuration[identifier] = bytes32(abi.encodePacked(
            uint224(block.timestamp + duration), uint32(duration)));

        // set states (TODO: permutations should be able to have values in bytes32 or something)
        uint248 c = 1;
        _groupLeaders[identifier] = new bytes32[](groups);
        for (uint16 i=0; i<permutation.length; i++ ) {
            // allocate group
            bytes32 label = permutation[i];
            if (_state[identifier][label]!=bytes32(0)){
                revert OnlyDistinctOptions(identifier, label);
            }
            uint16 group = uint16(i % groups + c);  // groups start at c=1
            _state[identifier][label] = bytes32(abi.encodePacked(group, uint240(0)));
            // set the initial group leaders;
            if (i<groups){
                // when i is bigger or equal to groups, then that group already has a group leader.
                _groupLeaders[identifier][group - c] = label;  // indexing starts at 0.
                
            }
        }

        // set status 
        _status[identifier] = uint256(bytes32(abi.encodePacked(
            uint248(c),
            uint8(uint256(IImplementResult.VotingStatusImplement.awaitcall) + rounds))));
    }


    function _beforeStart(uint256 identifier, bytes memory votingParams, bytes calldata callback) internal override(BaseVotingContract){
        // hash the callback
        _callbackHash[identifier] = keccak256(callback);
        
    }

    
    // returns(uint256 votes, uint256 currentGroup, bool participatesInCurrentRound)
    
    function getState(uint256 identifier, bytes32 option)
    external 
    view
    returns(uint256 votes, uint256 currentGroup, bool participatesInCurrentRound)
    {
        currentGroup = uint256(uint16(bytes2(_state[identifier][option])));
        votes = uint256(uint240(bytes30(_state[identifier][option]<<16)));
        participatesInCurrentRound = currentGroup >= uint256(uint248(bytes31(bytes32(_status[identifier]))));
    }

    // function getStatePure(uint256 identifier, bytes32 option)
    // external 
    // view
    // returns(bytes32 state)
    // {
    //     return _state[identifier][option];
    // }


    /// @dev We must implement a vote function 
    function vote(uint256 identifier, bytes memory votingData) 
    external 
    override(BaseVotingContract)
    returns (uint256)
    {
        

        bytes32 status = bytes32(_status[identifier]);
        uint8 statusFlag = uint8(bytes1(status<<(8 * 31)));
        
        // add some voting guards. For instance, no voting when status does not permit
        if(statusFlag <= uint256(IImplementResult.VotingStatusImplement.awaitcall)) {
            revert StatusError(identifier, _status[identifier]);
        }

        // check whether time is over
        uint248 c = uint248(bytes31(status));
        if (block.timestamp > uint224(bytes28(_deadlineAndDuration[identifier]))){
            // set the next round
            c = _startNextRound(
                identifier, 
                statusFlag - uint8(uint256(IImplementResult.VotingStatusImplement.awaitcall)) - 1,
                c);
        }
        
        // check status for the round that we're in
        bytes32[] memory ballot = abi.decode(votingData, (bytes32[]));
        address voter = msg.sender; //TODO: could be determined by votingData

        for (uint16 i=0; i<ballot.length; i++){
            // for each label it casts the vote
            uint16 group = uint16(bytes2(_state[identifier][ballot[i]]));
            if (_alreadyVoted[identifier][group][voter]>0){
                revert AlreadyVoted(identifier, group, ballot[i], voter);
            }
            uint256 weight = IERC721(_token[identifier]).balanceOf(voter);
            if (uint256(uint240(bytes30(_state[identifier][ballot[i]]<<16))) + weight > (2**(240) - 1)){
                // This tournament is invalid.
                _status[identifier] = uint256(IImplementResult.VotingStatusImplement.failed);
                // revert VotingWeightExceedsBallotLimit(identifier, ballot[i], _state[identifier][ballot[i]], weight);
            } 
            // set state            
            _state[identifier][ballot[i]] = bytes32(uint256(_state[identifier][ballot[i]]) + weight);
            // check whether state exceeds the groupLeader
            bytes32 leaderLabel;
            if (c==1){
                leaderLabel = _groupLeaders[identifier][uint16(group) - uint16(c)];
                if ((uint256(_state[identifier][ballot[i]])>uint256(_state[identifier][leaderLabel])) && (ballot[i]!=leaderLabel)){
                    _groupLeaders[identifier][uint16(group) - uint16(c)] = ballot[i];
                }
            } else {
                leaderLabel = _groupLeaders[identifier][0];
            }
            
            
            _alreadyVoted[identifier][group][voter] = 1;
        }

        return statusFlag;

    }

    
    function triggerNextRound(uint256 identifier) public {
        bytes32 status = bytes32(_status[identifier]);
        uint248 c = uint248(bytes31(status));
        uint8 statusFlag = uint8(bytes1(status<<(8 * 31)));
        uint8 awaitCall = uint8(uint256(IImplementResult.VotingStatusImplement.awaitcall));
        
        if ((statusFlag > awaitCall) && block.timestamp>uint224(bytes28(_deadlineAndDuration[identifier]))){
            _startNextRound(identifier, statusFlag - awaitCall - uint8(1), c);
        }
    }

    
    function _startNextRound(uint256 identifier, uint8 newRound, uint248 c) internal returns(uint248 cPrime){
            
        if (newRound == 0){
            // Check whether no votes were cast. Otherwise the groupLeader wins even if its a tie.
            bool noVotesWereCast = uint240(bytes30(_state[identifier][_groupLeaders[identifier][0]]<<16)) > 0;
            if (!noVotesWereCast) {
                _status[identifier] = uint256(IImplementResult.VotingStatusImplement.awaitcall);
                emit WinnersOfTheFinal(identifier, _groupLeaders[identifier][0]);
            } else {
                _status[identifier] = uint256(IImplementResult.VotingStatusImplement.failed);
            }
            cPrime = c + uint248(1);

        } else {

            emit WinnersOfThisRound(identifier, newRound + uint8(1), _groupLeaders[identifier]);
            cPrime =  c + uint248(2 ** newRound);
            _status[identifier] = uint256(bytes32(abi.encodePacked(
                    uint248(cPrime),
                    uint8(uint256(IImplementResult.VotingStatusImplement.awaitcall) + newRound))));
            
            // reduce the size of group Leaders by a factor of 2
            // therfore at every second iteration fill the label from the group leader and pop the last entry
                
            bytes32 label;
            for (uint256 i=0; i<_groupLeaders[identifier].length; i++){
                label = _groupLeaders[identifier][i];
                _state[identifier][label] = bytes32(abi.encodePacked(uint16(cPrime) + uint16(i / 2), uint240(0)));

                if (i % 2 == 0) {
                    _groupLeaders[identifier][i / 2] = label;
                }
            }
            for (uint256 i=0; i<(_groupLeaders[identifier].length / 2); i++) {
                _groupLeaders[identifier].pop();
            }

            // change deadline and duration;
            uint32 duration = uint32(bytes4(bytes32(_deadlineAndDuration[identifier]<<(8*28))));
            _deadlineAndDuration[identifier] = bytes32(abi.encodePacked(
                uint224(block.timestamp + duration), uint32(duration)));
            
        }
    }

    /// We obtain the caller and a flag (whether the target function returns a value) from the votingParams' only argument.
    function decodeParameters(bytes memory votingParams) public pure 
    returns(
        uint48 insertAtByte,
        uint256 duration,
        uint8 rounds,
        address token,
        bytes32[] memory permutation
    ) {
        (
            insertAtByte,
            duration,
            rounds,
            token,
            permutation
        ) = abi.decode(votingParams, 
        (uint48, uint256, uint8, address, bytes32[] )); 

    }

    /// We obtain the caller and a flag (whether the target function returns a value) from the votingParams' only argument.
    function encodeParameters(
        uint48 insertAtByte,
        uint256 duration,
        uint8 rounds,
        address token,
        bytes32[] memory permutation
    )
    public pure 
    returns(bytes memory votingParams) {
        votingParams = abi.encode(insertAtByte, duration, rounds, token, permutation); 
    }


    function result(uint256 identifier) public view override(BaseVotingContract) returns(bytes memory resultData) {
        if (_groupLeaders[identifier].length==1){
            return abi.encode(
                _groupLeaders[identifier][0],
                uint256(uint240(bytes30(_state[identifier][_groupLeaders[identifier][0]]<<16))));
        } else {
            uint256[] memory votes = new uint256[](_groupLeaders[identifier].length);
            for(uint256 i=0; i<_groupLeaders[identifier].length; i++){
                votes[i] = uint256(uint240(bytes30(_state[identifier][_groupLeaders[identifier][i]]<<16)));
            }
            return abi.encode(_groupLeaders[identifier], votes);
        }
        
    }

    function _modifyCallback(
        uint256 identifier, 
        bytes calldata callback) 
    internal view override(ImplementResultWithInsertion)
    returns(bytes memory modifiedCallback)
    {
        modifiedCallback = abi.encodePacked(
            callback[0:(_insertAtByte[identifier] + 4)],
            bytes32(result(identifier)),
            callback[(_insertAtByte[identifier] + 36):callback.length]);
    }

    function _requireValidCallbackData(uint256 identifier, bytes calldata callback) internal view override(ImplementResultWithInsertion) {
        if(!CheckCalldataValidity._isValidCalldata(identifier, callback)){
            revert CheckCalldataValidity.InvalidCalldata();
        }
    }

    function _implementingPermitted(uint256 identifier) internal view override(ImplementingPermitted) returns(bool permitted) {
        if (getStatus(identifier) == uint256(IImplementResult.VotingStatusImplement.awaitcall)){
            permitted = true;
            return permitted;
        }
        bool finishedVoting = _checkCondition(identifier) && getStatus(identifier)==uint256(IImplementResult.VotingStatusImplement.awaitcall) + 1;
        // the overall winner should have non-zero votes        
        permitted = finishedVoting && uint240(bytes30(_state[identifier][_groupLeaders[identifier][0]]<<16)) > 0;
    }

    function _checkCondition(uint256 identifier) internal view override(BaseVotingContract) returns(bool condition) {
        condition = block.timestamp > uint224(bytes28(_deadlineAndDuration[identifier]));
    }

    function getStatus(uint256 identifier) public view 
    override(StatusGetter)
    returns(uint256){
        return uint256(uint8(bytes1(bytes32(_status[identifier])<<(8 * 31))));
    }


    function _handleFailedImplementation(uint256 identifier, bytes memory responseData) internal 
    override(HandleImplementationResponse) 
    returns(IImplementResult.Response responseStatus){
        emit HandleImplementationResponse.NotImplemented(identifier);
        return IImplementResult.Response.failed;
    }


    function _handleNotFailedImplementation(uint256 identifier, bytes memory responseData) 
    internal 
    override(HandleImplementationResponse) 
    returns(IImplementResult.Response responseStatus){
        responseStatus = IImplementResult.Response.successful;
        emit HandleImplementationResponse.Implemented(identifier);
    }

}


contract TournamentTest {
    bytes32 public state;

    function addBitwise(bytes32 a, bytes32 b) external pure returns(bytes32 c){
        return a & b;
    }

    function start(uint8 numberOfOptions) external {
        // can be anywhere between 0 and 255
        state = bytes32(uint256(2**(numberOfOptions) - 1));
    }

    // get the state from the number

    function getStateOf(uint8 option) external view returns(bool up){
        up = (state & bytes32(uint256(2**(option - 1)))) != bytes32(0);
    }

    

    function collectiveVote(bytes32 vote) public {
        state = state & vote;
    }

    function BatchCollectiveVote(bool[] memory vote) external {
        require(vote.length<=getNumberOfOptions(), "must have strictly less than 256 options");
        uint256 result;
        for (uint8 i=0; i<vote.length; i++){
            result += vote[i] ? 2**i: 0;
        }
        collectiveVote(bytes32(result));
    }

    function getNumberOfOptions() public returns(uint8){
        return uint8(255);
    }

    // e.g. 16 participants and 3 rounds
    // 1212121212121212   // e.g. 1001101001010001
    // 1122112211221122   // e.g. 1000001000010001
    // 1111222233334444   // at most one each group of 4
    // 5555555566666666   // at most one each group of 8
    //
    // how to enforce that you cannot vote for opponents
    // first you can vote for anyone who has a 1 entry.
    // second in the final, you dont need to check anything
    // in the semifinals you need to check whether the first
    // any two votes are separated sufficiently. For each vote
    // you need to check whether it is smaller or bigger than
    // half of the bits.
}


