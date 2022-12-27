// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

import {IVotingRegistry} from "../../registration/registry/IVotingRegistry.sol";
import {IGetDeadline} from "../../extensions/interfaces/IGetDeadline.sol";
import {IGetQuorum} from "../../extensions/interfaces/IGetQuorum.sol";
import {IGetToken} from "../../extensions/interfaces/IGetToken.sol";
import {IImplementResult} from "../../extensions/interfaces/IImplementResult.sol";
import { IPlaygroundVotingBadge, CalculateId} from "./VotingBadge.sol";

import {HandleDoubleVotingGuard} from "../../extensions/primitives/NoDoubleVoting.sol";
import {IGetDoubleVotingGuard} from "../../extensions/interfaces/IGetDoubleVotingGuard.sol";

// import {Deployer} from "../../registration/registrar/Deployer.sol";
import {StartVoteAndImplementHybridVotingImplRemoteHooks} from "../../integration/abstracts/StartVoteAndImplementRemote.sol";
import {
    OnlyVoteImplementer,
    AssignedContractPrimitive,
    LegitInstanceHash,
    SecurityThroughAssignmentPrimitive
} from "../../integration/primitives/AssignedContractPrimitive.sol";

error BadgeDoesntExist(uint256 mainBadge, uint256 numberOfBadges);

struct VotingMetaParams {
    uint256 minDuration;
    uint256 minQuorum;
    address token;
}

struct Analytics {
        uint256 numberOfInstances;
        uint256 numberOfVotes;
        uint256 numberOfImplementations;
        uint24 numberOfSimpleVotingContracts;
    }

struct Counter {
    uint256 counter;
    Operation operation;
}


struct NFTsAndBadgesInfo {
    uint256 mainBadge;
    bool acceptingNFTs;
}

struct Incumbent {
    address incumbent;
    uint256 indexPlusOne;
}

struct ImmutableAddresses {
    address deployer;
    address REGISTRY;
}

enum Operation {add, subtract, divide, multiply, modulo, exponentiate}
enum ApprovalTypes {limitedApproval, unapproveAll, approveAll}

contract VotingPlayground is 
IERC721Receiver,
LegitInstanceHash,
AssignedContractPrimitive,
SecurityThroughAssignmentPrimitive,
CalculateId,
StartVoteAndImplementHybridVotingImplRemoteHooks {

    // Badges and contracts
    IPlaygroundVotingBadge[] public badges;
    address[] public deployedContracts;

    // Meta Parameters for Voting
    uint256 public minXpToStartAnything; // Experience RequiredForStart
    mapping(bytes4=>uint256) public minXpToStartThisFunction;
    NFTsAndBadgesInfo public nftAndBadgesInfo;

    // Change the Counter
    Counter public counter;

    // Change people
    string[] public offices;
    mapping(string=>Incumbent) internal _incumbents;
    mapping(address=>uint256) internal _numberOfOffices;
    mapping(uint256=>bytes4) internal _selectorOfThisVote;

    mapping(bytes4=>VotingMetaParams) public votingMetaParams;
    address public immutable VOTING_REGISTRY;
    mapping(address=>uint256) public donationsBy;
    Analytics public analytics;
    mapping(uint24=>address) public simpleVotingContract;
    mapping(bytes4=>bool) public fixedVotingContract;
    // setting parameters



    constructor(
        address votingContractRegistry,
        bytes5[] memory flagAndSelectors,
        address[] memory votingContracts,
        uint256[] memory minDurations,
        uint256[] memory minQuorums,
        bool[] memory badgeWeightedVote,
        bytes32 hashedBadgeBytecode
        )
    {
        // set the registry;
        VOTING_REGISTRY = votingContractRegistry;

        // // set a few voting contracts
        // // assign the voting contract the increment function.
        address badgeToken = _computeDeploymentAddress(hashedBadgeBytecode);
        // badges.push(IPlaygroundVotingBadge(badgeToken));
        nftAndBadgesInfo.mainBadge = uint256(uint160(badgeToken));
        for (uint8 j; j<votingContracts.length; j++){
            bytes4 selector = bytes4(flagAndSelectors[j] << 8);
            fixedVotingContract[selector] = bytes1(flagAndSelectors[j])!=bytes1(0x00);
            votingMetaParams[selector] = VotingMetaParams({
                minDuration: minDurations[j],
                minQuorum: minQuorums[j],
                token: badgeWeightedVote[j] ? badgeToken : address(0)
            });
            assignedContract[selector] = votingContracts[j];
        }
    }

    function addSimpleVotingContract(address votingContract) external {
        // check whether it is Registered
        require(IVotingRegistry(VOTING_REGISTRY).isRegistered(votingContract));
        simpleVotingContract[uint24(analytics.numberOfSimpleVotingContracts)] = votingContract;
        analytics.numberOfSimpleVotingContracts += 1;
    }

    // change the contract for certain functions
    function changeAssignedContract(bytes4 selector, address newVotingContract) 
    external 
    OnlyByVote(true)
    {
        // check whether it is Registered
        require(IVotingRegistry(VOTING_REGISTRY).isRegistered(newVotingContract));
        require(!fixedVotingContract[selector]);
        assignedContract[selector] = newVotingContract;
    }

    function _computeDeploymentAddress(bytes32 _hashedByteCode) internal view returns(address) {
        return address(uint160(uint256(keccak256(abi.encodePacked(bytes1(0xff),address(this),bytes32(0),_hashedByteCode)))));
    }

    // change the metaParameters for those functions
    function changeMetaParameters(
        bytes4 selector,
        uint256 minDuration,
        uint256 minQuorum,
        address token
    )
    external
    OnlyByVote(true)
    {
        require(!fixedVotingContract[selector]);
        votingMetaParams[selector] = VotingMetaParams({
            minDuration: minDuration,
            minQuorum: minQuorum,
            token: token
        });
    }
        

    //////////////////////////////////////////////
    // PARAMETER SETTINGS                       //
    //////////////////////////////////////////////

    function setMainBadge(uint256 newMainBadge) 
    external 
    OnlyByVote(true)
    {
        if(newMainBadge>=badges.length) revert BadgeDoesntExist(newMainBadge, badges.length);
        nftAndBadgesInfo.mainBadge = newMainBadge;
    }

    function setMinXpToStartAnything(uint256 newXP) external
    OnlyByVote(true)
    {
        require(newXP>0 && newXP<30, "Must be within bounds");
        minXpToStartAnything = newXP;
    }

    function setMinXpToStartThisFunction(bytes4 selector, uint256 newXP) external
    OnlyByVote(true)
    {
        require(newXP<40, "Must be within bounds");
        minXpToStartThisFunction[selector] = newXP;
    }

    function setEnableTradingThreshold(uint256 newThreshold)
    external 
    OnlyByVote(true)
    {
        badges[nftAndBadgesInfo.mainBadge].changeEnableTradingThreshold(newThreshold);
    }

    function setTradingEnabledGlobally(bool enable)
    external 
    OnlyByVote(true)
    {
        badges[nftAndBadgesInfo.mainBadge].changeTradingEnabledGlobally(enable);
    }

    function setAcceptingNFTs(bool accept) 
    external 
    OnlyByVote(true)
    {
        nftAndBadgesInfo.acceptingNFTs = accept;
    }

    

    //////////////////////////////////////////////
    // DO INTERACTIVE STUFF                     //
    //////////////////////////////////////////////

    function changeCounter(uint256 by) 
    external 
    returns (bool)
    {
        require((_numberOfOffices[msg.sender]>0) || _isImplementer(true), "not allowed");
        if (counter.operation==Operation.add){
            counter.counter += by;
        } else if (counter.operation==Operation.subtract) {
            counter.counter -= by;
        } else if (counter.operation==Operation.multiply) {
            counter.counter *= by;
        }
        // } else if (counter.operation==Operation.divide) {
        //     counter.counter = counter.counter / by;
        // } else if (counter.operation==Operation.modulo) {
        //     counter.counter = counter.counter % by;
        // } else if (counter.operation==Operation.exponentiate) {
        //     counter.counter = counter.counter ** by;
        // } 
        
    }

    function changeOperation(Operation newOperation)
    external
    returns (bool)
    {
        require(donationsBy[msg.sender]>1e18 || _isImplementer(true), "not allowed");
        counter.operation = newOperation;
    }

    function newIncumbent(string memory office, address _newIncumbent)
    external
    OnlyByVote(true) 
    returns (bool)
    {
        // no empty incumbents
        require(_newIncumbent!=address(0));
        // check whether we should add a new office
        if (_incumbents[office].indexPlusOne==0){
            offices.push(office);
            _incumbents[office].indexPlusOne = offices.length;
        } else {
            _numberOfOffices[_incumbents[office].incumbent] -= 1;
        }
        // set the new _incumbents and office
        _incumbents[office].incumbent = _newIncumbent;
        _numberOfOffices[_newIncumbent] += 1;
    }

    function getAssignedContract(bytes4 selector) external view returns(address _assignedContract) {
        _assignedContract = assignedContract[selector];
    }

    function getIncumbentFromOffice(string memory office) external view returns(address incumbent) {
        incumbent = _incumbents[office].incumbent;
    }

    // function getOfficesFromAddress(address incumbent) external view returns(string[] memory) {
    //     uint256[] memory indices;
    //     uint256 j;
    //     for(uint256 i=0; i<offices.length; i++){
    //         if (_incumbents[offices[i]].incumbent == incumbent) {
    //             indices[j] = i;
    //             j ++;
    //         }
    //     }
    //     string[] memory _offices = new string[](indices.length);
    //     for (uint256 k=0; k<indices.length; k++){
    //         _offices[k] = offices[indices[k]];
    //     }
    //     return _offices;
        
    // }

    //////////////////////////////////////////////
    // CREATE CONTRACTS                         //
    //////////////////////////////////////////////

    function deployNewBadge(bytes32 salt, bytes memory bytecode, address badger) 
    external
    returns(address deployedContract){
        if(badges.length==0){
            require(_computeDeploymentAddress(keccak256(bytecode))==address(uint160(nftAndBadgesInfo.mainBadge)), "Wrong ByteCode");
            salt = bytes32(0);
            nftAndBadgesInfo.mainBadge = 0;
            // return deployedContract;IPlaygroundVotingBadge
        } else {
            if(!_isImplementer(true)) revert OnlyVoteImplementer(msg.sender);
        }
        deployedContract = _deployContract(salt, bytecode);
        badges.push(IPlaygroundVotingBadge(deployedContract));
        
        badges[badges.length - 1].mint(
            badger,
            0,
            msg.sig,
            msg.sender);
    }


    function deployNewContract(bytes32 salt, bytes memory bytecode) 
    external
    OnlyByVote(true) 
    returns(address deployedContract){
        deployedContract = _deployContract(salt, bytecode);
        deployedContracts.push(deployedContract);
    }



    //////////////////////////////////////////////
    // SENDING THINGS                           //
    //////////////////////////////////////////////

    function sendNFT(address token, address from, address to, uint256 tokenId) 
    external 
    OnlyByVote(true)
    {
        IERC721(token).safeTransferFrom(from, to, tokenId);
    }


    function sendNativeToken(address payable to, uint256 amount) 
    external 
    OnlyByVote(true)
    {
        (bool sent, ) = to.call{value: amount}("");
        require(sent, "Failed to send");
    }

    function sendERC20Token(address token, address from, address to, uint256 amount) 
    external 
    OnlyByVote(true)
    {
        (from==address(this)) ? IERC20(token).transfer(to, amount) : IERC20(token).transferFrom(from,to, amount); 
    }

    function approveNFT(address token, address spender, uint256 tokenId, ApprovalTypes approvalType)
    external 
    OnlyByVote(true)
    {
        // check whether NFT or ERC20
        
        (approvalType==ApprovalTypes.limitedApproval)?
        IERC721(token).approve(spender, tokenId):
        IERC721(token).setApprovalForAll(spender, approvalType==ApprovalTypes.approveAll);
    }


    function approveERC20Token(address token, address spender, uint256 amount)
    external 
    OnlyByVote(true)
    {
        IERC20(token).approve(spender, amount);
    }

    function wildCard(address contractAddress, bytes calldata data, uint256 value) 
    external 
    payable
    OnlyByVote(true)
    {
        require(address(this).balance>=value, "not enough funds");
        (bool success, ) = contractAddress.call{value: value}(data);
        require(success, "not successful");
    }

    //////////////////////////////////////////////
    // HELPER FUNCTIONS                         //
    //////////////////////////////////////////////

    function _deployContract(bytes32 salt, bytes memory bytecode) internal returns(address deployedContract) {
        assembly {
            deployedContract := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
        }
    }
    

    function _beforeStart(bytes memory votingParams, bytes calldata callback) internal view
    override(StartVoteAndImplementHybridVotingImplRemoteHooks) 
    {
        uint256 callSpecificXp = (callback.length>=4) ? minXpToStartThisFunction[bytes4(callback[0:4])] : 0;
        uint256 balance = badges[nftAndBadgesInfo.mainBadge].balanceOf(msg.sender);
        // Only allow to start a vote when you have at least one badge
        require(
            balance >= minXpToStartAnything && balance >= callSpecificXp,
            "Not enough badges");
    }

    // event Blaab2(uint256 playgroundIdentifier, bytes4 selector, address votingContract);
    // error Blaab2DurationError(uint256 deadline, bytes response, uint256 minDuration, uint256 timestamp, address votingContract);
    // error Blaab2Error(uint256 deadline, bytes response);
    // error Blaab2DurationError(uint256 deadline, bytes response);

    function _afterStart(uint256 identifier, bytes memory votingParams, bytes calldata callback)
    internal override(StartVoteAndImplementHybridVotingImplRemoteHooks)
    {
        // check whether conditions are met
        uint256 index = instances[identifier].identifier;
        address votingContract = instances[identifier].votingContract;
        if (callback.length>=4){
            bytes4 selector = bytes4(callback[0:4]);
            // set the selector of this voting instance. If there there is none, then it's just bytes4(0)
            _selectorOfThisVote[identifier] = selector;
            // check whether specs are met
            bool goodSpecs = true;
            bool success;
            bytes memory response;
            
            if (votingMetaParams[selector].minDuration!=0){
                (success, response) = votingContract.call(abi.encodeWithSelector(IGetDeadline.getDeadline.selector, index));
                if (success) goodSpecs = goodSpecs && votingMetaParams[selector].minDuration + block.timestamp <= abi.decode(response, (uint256));
                // if(!goodSpecs) revert Blaab2DurationError(abi.decode(response, (uint256)), response, votingMetaParams[selector].minDuration, block.timestamp, instances[identifier].votingContract);
            }    
            if (votingMetaParams[selector].token!=address(0)){
                (success, response) = votingContract.call(abi.encodeWithSelector(IGetToken.getToken.selector, index));
                if (success) goodSpecs = goodSpecs && abi.decode(response, (address)) == votingMetaParams[selector].token;
            }
            if (votingMetaParams[selector].minQuorum!=0){
                (success, response) = votingContract.call(abi.encodeWithSelector(IGetQuorum.getQuorum.selector, index));
                (uint256 _quorum, uint256 inUnitsOf) = abi.decode(response, (uint256, uint256));
                // when inUnitsOf is zero (i.e. the quorum is measured in absolute terms, then the absolute values are compared).
                goodSpecs = goodSpecs && (votingMetaParams[selector].minQuorum <= ((inUnitsOf==0) ? _quorum : ((_quorum * 1e5) / inUnitsOf)));                
            }
            require(goodSpecs, "Invalid Parameters");
        }
        

        badges[nftAndBadgesInfo.mainBadge].mint(
            msg.sender,
            index,
            msg.sig,
            votingContract);

        analytics.numberOfInstances += 1;
    }

    
    function _beforeVote(uint256 identifier, bytes calldata votingData) 
    internal override(StartVoteAndImplementHybridVotingImplRemoteHooks)
    {
        // if the voting instance requires the voter to be an incumbent of an office, then we should check here
        bytes4 selector = _selectorOfThisVote[identifier];
        if(selector!=bytes4(0) && votingMetaParams[selector].token==address(0)){
            require(_numberOfOffices[msg.sender]>0);
        }
        uint256 index = instances[identifier].identifier;
        address votingContract = instances[identifier].votingContract;
        if (!badges[nftAndBadgesInfo.mainBadge].exists(calculateId(index, msg.sig, votingContract, msg.sender))){
            // e.g. in tournament this might be interesting
            badges[nftAndBadgesInfo.mainBadge].mint(
                msg.sender,
                index,
                msg.sig,
                votingContract);
        }
    }

    function _afterVote(uint256 identifier, uint256 status, bytes calldata votingData) 
    internal override(StartVoteAndImplementHybridVotingImplRemoteHooks) 
    {
        analytics.numberOfVotes += 1;
    }



    // function _beforeImplement(uint256 identifier) 
    // internal override(StartVoteAndImplementHybridVotingImplRemoteHooks)
    // {
    //     analytics.numberOfImplementations += 1;
    // }

    function _afterImplement(uint256 identifier, bool responseFlag)
    internal override(StartVoteAndImplementHybridVotingImplRemoteHooks) 
    {
        if (responseFlag){
            badges[nftAndBadgesInfo.mainBadge].mint(
                msg.sender,
                instances[identifier].identifier,
                msg.sig,
                instances[identifier].votingContract);
        }
        
        analytics.numberOfImplementations += 1;
    }

    function _modifyVotingData(uint256 identifier, bytes calldata votingData) virtual internal 
    override(StartVoteAndImplementHybridVotingImplRemoteHooks)
    returns(bytes memory newVotingData)
    { 
        (bool success, bytes memory response) = instances[identifier].votingContract.call(abi.encodeWithSelector(
            IGetDoubleVotingGuard.getDoubleVotingGuard.selector,
            instances[identifier].identifier));
        if (success){
            bool onVotingDataCondition = abi.decode(response, (HandleDoubleVotingGuard.VotingGuard)) == HandleDoubleVotingGuard.VotingGuard.onVotingData;
            if (onVotingDataCondition) return abi.encodePacked(msg.sender, votingData);
        }
        return votingData;
        
    }


    receive() external payable {
        donationsBy[msg.sender] += msg.value;
    }


    // interface IERC721Receiver {
    /**
     * @dev Whenever an {IERC721} `tokenId` token is transferred to this contract via {IERC721-safeTransferFrom}
     * by `operator` from `from`, this function is called.
     *
     * It must return its Solidity selector to confirm the token transfer.
     * If any other value is returned or the interface is not implemented by the recipient, the transfer will be reverted.
     *
     * The selector can be obtained in Solidity with `IERC721Receiver.onERC721Received.selector`.
     */
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) 
    external 
    view
    override(IERC721Receiver)
    returns(bytes4)
    {
        data;
        return nftAndBadgesInfo.acceptingNFTs ? msg.sig: bytes4(0);
    }


    
    modifier OnlyByVote(bool checkIdentifier) {
        if(!_isImplementer(checkIdentifier)) revert OnlyVoteImplementer(msg.sender);
        _;
    }



    
    
}