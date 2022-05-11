//SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;

import { Whitelisting, VoteInfo} from "./CanVoteUtils.sol";

/// @title Can Vote Primitive Abstract Contract
/// @dev handles just the core functionalities of the integration interface
abstract contract CanVotePrimitive is Whitelisting {

    //////////////////////////////////////////////////
    // STATE VARIABLES                              //
    //////////////////////////////////////////////////

    mapping(uint256=>VoteInfo) internal voteInfo;
    uint256 internal totalVotesStarted;

    //////////////////////////////////////////////////
    // GETTER FUNCTIONS                             //
    //////////////////////////////////////////////////

    /// @dev get the total number of votes that have been started by the inheriting contract
    function getTotalVotesStarted() external view returns(uint256) {
        return totalVotesStarted;
    }

    /// @dev get information about the current voting instance. Namely the address of the vote contract and the index of the current vote.
    /// @param voteIndex the index of the current voting instance.
    /// @return voteContract the address of the vote contract for the current voting instance.
    /// @return index the index of this voting instance inside the vote contract.
    function getVoteInfo(uint256 voteIndex) external view returns(address voteContract, uint256 index) {
        voteContract = voteInfo[voteIndex].voteContract;
        index = voteInfo[voteIndex].index;
    }


    //////////////////////////////////////////////////
    // INTERNAL HELPER FUNCTIONS                    //
    //////////////////////////////////////////////////


    /// @dev handles voting at basic level. It calls the vote function of the voting contract.
    /// @param voteIndex the index of the voting instance where one would like to cast a vote.
    /// @param option the option that one wishes to vote on.
    function _vote(uint256 voteIndex, uint256 option)
    internal
    permitsVoting(voteIndex)
    {
        IVoteContract(voteInfo[voteIndex].voteContract).vote(
            voteInfo[voteIndex].index,
            msg.sender,
            option
        );
    }

    //////////////////////////////////////////////////
    // GUARD MODIFIERS                              //
    //////////////////////////////////////////////////

    /// @dev a modifier that checks whether this particular vote allows for more voting or not.
    /// @param voteIndex the vote index for the voting instance.
    modifier permitsVoting(uint256 voteIndex){
        bool permitted = IVoteContract(voteInfo[voteIndex].voteContract).statusPermitsVoting(voteInfo[voteIndex].index);
        if(! permitted){
            revert DoesNotPermitVoting(voteIndex);
        }
        _;
    }
    
}

/// @title Can Vote Without Starting - An abstract contract.
/// @dev this auxilliary contract can be inherited. It handles the initialization of a voting instance.
abstract contract CanVoteWithoutStarting is CanVotePrimitive {

    //////////////////////////////////////////////////
    // INTERNAL HELPER FUNCTIONS                    //
    //////////////////////////////////////////////////

    /// @dev internal function that initiates a new voting instance.
    /// @param selector the function selector that this voting instance is targeting
    /// @param votingParams the bytes-encoded voting parameters that are received by the voteContract. 
    function _start(bytes4 selector, bytes memory votingParams) 
    internal
    isVotable(selector)
    isWhitelisted(voteContract[selector])
    returns(uint256)
    {
        totalVotesStarted += 1;
        VoteInfo memory _voteInfo;
        _voteInfo.voteContract = voteContract[selector];
        _voteInfo.index = IVoteContract(_voteInfo.voteContract).start(votingParams);
        voteInfo[totalVotesStarted] = _voteInfo;
        return totalVotesStarted;
    }
}