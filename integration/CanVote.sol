//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;
import {REGISTRY} from "../registry/RegistryAddress.sol";
import {IVotingRegistry} from "../registry/IVotingRegistry.sol";
import {IVoteContract} from "../voteContract/IVoteContract.sol";

error NotRegisteredVoteContract(address voteContract);
error IsNotWhitelistedVoteContract(address voteContract);
error FunctionDoesntPermitVoting(bytes4 selector);
error NotPermissibleVoteContractOrSelector(bytes4 selector, address voteContract);
error DoesNotPermitVoting(uint256 voteIndex);
error MayNotCallFunction(address caller);


abstract contract FunctionGuard {
    
    function _customFunctionGuard(bytes4 selector) 
    internal 
    view 
    virtual
    returns(bool)
    {
        selector;  // silence warnings
        return false;
    }

    function _functionGuard(bytes4 selector) 
    internal 
    view 
    virtual
    returns(bool)
    {
        selector;  // silence warnings
        return true;
    }

    modifier votingGuard(bytes4 selector) {

        // TODO: Can one get the selector from the msg.data ? 

        bool mayCallFunction = _functionGuard(selector) || _customFunctionGuard(selector);
        if (!mayCallFunction) {
            revert MayNotCallFunction(msg.sender);
        }
        _;
    }

}

abstract contract Whitelisting {

    mapping(bytes4 => bool) internal votable;
    mapping(address => bool) internal whitelistedVoteContract;
    mapping(bytes4 => address) internal voteContract;
    
    // constructor () {
    //     // whitelistedVoteContract[address(0)] = false;
    // }

    function _selectorApproval(bytes4 selector, bool approval) internal {
        votable[selector] = approval;
    }

    function _supportsAdditionalInterfaces(address _voteContract)
    internal 
    virtual 
    view 
    returns(bool)
    {
        _voteContract;  // silence warnings
        return true;
    }

    function _setVoteContractForSelector(bytes4 selector, address _voteContract) 
    internal 
    isWhitelisted(_voteContract)
    isVotable(selector)
    {
        voteContract[selector] = _voteContract;
    }

    function _whitelistContractAndSetSelector(bytes4 selector, address _voteContract) 
    internal 
    {
        _whitelistVoteContract(_voteContract, true);
        _setVoteContractForSelector(selector, _voteContract);
    }

    function _whitelistVoteContract(address _voteContract, bool approve) 
    internal
    isLegitimateVoteContract(_voteContract)
    {
        whitelistedVoteContract[_voteContract] = approve;
    }

    modifier isLegitimateVoteContract(address _voteContract) {
        bool legitimate = _supportsAdditionalInterfaces(_voteContract) && IVotingRegistry(REGISTRY).isRegistered(_voteContract);
        if (!legitimate) {
            revert NotRegisteredVoteContract(_voteContract);
        }
        _;
    }

    modifier isWhitelisted(address _voteContract) {
        if (!whitelistedVoteContract[_voteContract]) {
            revert IsNotWhitelistedVoteContract(_voteContract);
        }
        _;
    }

    modifier isVotable(bytes4 selector) {
        if (!votable[selector]) {
            revert FunctionDoesntPermitVoting(selector);
        }
        _;
    }
    
}

struct VoteInfo {
    address voteContract;
    uint256 index;
}

abstract contract CanVotePrimitive is Whitelisting {

    mapping(uint256=>VoteInfo) internal voteInfo;
    uint256 internal totalVotesStarted;

    // constructor() Whitelisting(){}

    function getTotalVotesStarted() external view returns(uint256) {
        return totalVotesStarted;
    }

    function getVoteInfo(uint256 voteIndex) external view returns(address, uint256) {
        return (voteInfo[voteIndex].voteContract, voteInfo[voteIndex].index);
    }

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

  
    modifier permitsVoting(uint256 voteIndex){
        bool permitted = IVoteContract(voteInfo[voteIndex].voteContract).statusPermitsVoting(voteInfo[voteIndex].index);
        if(! permitted){
            revert DoesNotPermitVoting(voteIndex);
        }
        _;
    }
    
}


abstract contract CanVoteWithoutStarting is CanVotePrimitive {

    // TODO: Actually this function doesnt need a selector, since no function is called upon completion.
    // TODO: Maybe change the Whitelisting abstract contract to allow for function-unspecific whitelisting of contracts.

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


abstract contract CanVote is CanVoteWithoutStarting {

    function vote(uint256 voteIndex, uint256 option) public virtual;

    function start(bytes4 selector, bytes memory votingParams) public virtual;

}
