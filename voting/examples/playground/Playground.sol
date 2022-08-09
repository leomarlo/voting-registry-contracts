// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

// import {Deployer} from "../../registration/registrar/Deployer.sol";
import {StartVoteAndImplementHybridVotingImplRemoteHooks} from "../../integration/abstracts/StartVoteAndImplementRemote.sol";
import {
    OnlyVoteImplementer,
    AssignedContractPrimitive,
    SecurityThroughAssignmentPrimitive
} from "../../integration/primitives/AssignedContractPrimitive.sol";


error NotApprovedContract(address sender);
error TransferNotAllowed(uint256 tokenId);
error OnlyMotherContract(address sender, address _motherContract);
error BadgeDoesntExist(uint256 mainBadge, uint256 numberOfBadges);

abstract contract CalculateId {
    function calculateId(uint256 index, bytes4 selector, address votingContract) public pure returns (uint256) {
        return uint256(bytes32(abi.encodePacked(
            uint64(bytes8(bytes32(index) << 192)),
            selector,
            bytes20(votingContract))));
    }
}

contract PlaygroundVotingBadge is 
CalculateId, ERC721 {

    mapping(address=>bool) public isApprovedContract;
    mapping(address=>bool) public tradingEnabled;
    address private _deployer;
    address public motherContract;
    uint256 public enableTradingThreshold;
    bool public tradingEnabledGlobally;

    mapping(address=>mapping(bytes4=>uint256)) private _balanceOfSignature;

    // e.g. name and symbol = "Playground Voting Badge", "VOT"
    constructor(string memory name, string memory symbol) ERC721(name, symbol){
        motherContract = msg.sender;
        isApprovedContract[msg.sender] = true;
    }

    function balanceOfSignature(address owner, bytes4 selector) public returns(uint256) {
        _balanceOfSignature[owner][selector];
    } 


    // minting can only happen through approved contracts
    function mint(address to, uint256 index, bytes4 selector, address votingContract) 
    external 
    onlyApprovedContract
    {

        _mint(to, calculateId(index, selector, votingContract));
        
    }

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721) {
        bytes4 selector = bytes4(bytes32(tokenId) << 64);
        if (from==address(0)){
            // minting
            _balanceOfSignature[to][selector] += 1;
        } else {
            // burning or transfer
            uint addAmount = (to==address(0)) ? 0 : 1;
            _balanceOfSignature[to][selector] += addAmount;
            _balanceOfSignature[from][selector] -= 1;
        }
    }
    

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721) {
        if(from!=address(0) && to!=address(0) && !_transferAllowed(tokenId)){
            revert TransferNotAllowed(tokenId);
        }
    }


    function _transferAllowed(uint256 tokenId) internal returns(bool){
        // you need to have at least a certain amount of voting badges
        // transferral must be enabled
        uint256 balance =  balanceOf(ownerOf(tokenId));
        if (!tradingEnabled[msg.sender] && balance >= enableTradingThreshold){
            tradingEnabled[msg.sender] = true;
        }

        return tradingEnabled[msg.sender] && tradingEnabledGlobally;
    }

    
    function changeEnableTradingThreshold(uint256 newThreshold) 
    external 
    onlyByCallFromMotherContract
    returns(bool)
    {
        enableTradingThreshold = newThreshold;
    }

    function changeTradingEnabledGlobally(bool enable)
    external
    onlyByCallFromMotherContract
    returns(bool)
    {
        tradingEnabledGlobally = enable;
    }

    function approveContract(address newContract, bool approval) 
    external
    onlyByCallFromMotherContract 
    returns(bool)
    {
        isApprovedContract[newContract] = approval;
    }

    
    modifier onlyByCallFromMotherContract {
        if(msg.sender!=motherContract) {
            revert OnlyMotherContract(msg.sender, motherContract);
        }
        _;
    }


    modifier onlyApprovedContract {
        if(!isApprovedContract[msg.sender]) {
            revert NotApprovedContract(msg.sender);
        }
        _;
    }
}


interface IPlaygroundVotingBadge is IERC721{
    function mint(address to, uint256 index, bytes4 selector, address votingContract) external; 
    function balanceOfSignature(address owner, bytes4 selector) external returns(uint256);
    function changeEnableTradingThreshold(uint256 newThreshold) external;
    function changeTradingEnabledGlobally(bool enable) external;
}


contract VotingPlayground is 
AssignedContractPrimitive,
SecurityThroughAssignmentPrimitive,
CalculateId,
StartVoteAndImplementHybridVotingImplRemoteHooks {

    // Badges and contracts
    IPlaygroundVotingBadge[] public badges;
    uint256 public mainBadge;
    address[] public deployedContracts;

    // Meta Parameters for Voting
    uint256 public minXpToStartAnything; // Experience RequiredForStart
    mapping(bytes4=>uint256) public minXpToStartThisFunction;
    bool public acceptingNFTs;

    event Received(address caller, uint amount);

    // setting parameters
    constructor() {
        // set a few voting contracts
    }

    //////////////////////////////////////////////
    // PARAMETER SETTINGS                       //
    //////////////////////////////////////////////

    function setMainBadge(uint256 newMainBadge) 
    external 
    OnlyByVote
    {
        if(newMainBadge>=badges.length) revert BadgeDoesntExist(newMainBadge, badges.length);
        mainBadge = newMainBadge;
    }

    function setMinXpToStartAnything(uint256 newXP) external
    OnlyByVote
    {
        require(newXP>0, "Needs to be at least 1");
        minXpToStartAnything = newXP;
    }

    function setMinXpToStartThisFunction(bytes4 selector, uint256 newXP) external
    OnlyByVote
    {
        minXpToStartThisFunction[selector] = newXP;
    }

    function setEnableTradingThreshold(uint256 newThreshold)
    external 
    OnlyByVote
    {
        badges[mainBadge].changeEnableTradingThreshold(newThreshold);
    }

    function setTradingEnabledGlobally(bool enable)
    external 
    OnlyByVote
    {
        badges[mainBadge].changeTradingEnabledGlobally(enable);
    }

    function setAcceptingNFTs(bool accept) 
    external 
    OnlyByVote
    {
        acceptingNFTs = accept;
    }

    

    //////////////////////////////////////////////
    // DO INTERACTIVE STUFF                     //
    //////////////////////////////////////////////

    function deployNewBadge(bytes32 salt, bytes memory bytecode, address badger) 
    external
    OnlyByVote
    returns(address deployedContract){
        deployedContract = _deployContract(salt, bytecode);
        IPlaygroundVotingBadge newBadge = IPlaygroundVotingBadge(deployedContract);
        badges.push(newBadge);
        // mint one badge to initiator;
        newBadge.mint(
            badger,
            0,
            msg.sig,
            msg.sender);
    }


    function deployNewContract(bytes32 salt, bytes memory bytecode) 
    external
    OnlyByVote 
    returns(address deployedContract){
        deployedContract = _deployContract(salt, bytecode);
        deployedContracts.push(deployedContract);
    }

    //////////////////////////////////////////////
    // SENDING THINGS                           //
    //////////////////////////////////////////////

    function sendToken(address token, address to, uint256 amount) 
    external 
    OnlyByVote
    {

    }

    enum ApprovalTypes {limitedApproval, unapproveAll, approveAll}

    function approveNFT(address token, address spender, uint256 tokenId, ApprovalTypes approvalType)
    external 
    OnlyByVote
    {
        // check whether NFT or ERC20
        
        (approvalType==ApprovalTypes.limitedApproval)?
        IERC721(token).approve(spender, tokenId):
        IERC721(token).setApprovalForAll(spender, approvalType==ApprovalTypes.approveAll);

        
    }


    function approveERC20Token(address token, address spender, uint256 amount)
    external 
    OnlyByVote
    {
        IERC20(token).approve(spender, amount);
    }

    function wildCard(address contractAddress, bytes calldata data, uint256 value) 
    external 
    OnlyByVote
    {
        require(address(this).balance>=value, "not enough funds");
        (bool success, bytes memory response) = contractAddress.call{value: value}(data);
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
        uint256 balance = badges[mainBadge].balanceOf(msg.sender);
        // Only allow to start a vote when you have at least one badge
        require(
            balance >= minXpToStartAnything && balance >= callSpecificXp,
            "Not enough badges");
    }

    function _afterStart(uint256 identifier, bytes memory votingParams, bytes calldata callback)
    internal override(StartVoteAndImplementHybridVotingImplRemoteHooks)
    {
        badges[mainBadge].mint(
            msg.sender,
            instances[identifier].identifier,
            msg.sig,
            instances[identifier].votingContract);
    }

    function _beforeVote(uint256 identifier, bytes memory votingData) 
    internal override(StartVoteAndImplementHybridVotingImplRemoteHooks)
    {
        uint256 index = instances[identifier].identifier;
        address votingContract = instances[identifier].votingContract;
        if (badges[mainBadge].ownerOf(calculateId(index, msg.sig, votingContract))==address(0)){
            // e.g. in tournament this might be interesting
            badges[mainBadge].mint(
                msg.sender,
                index,
                msg.sig,
                votingContract);
        }
    }

    function _beforeImplement(uint256 identifier) 
    internal override(StartVoteAndImplementHybridVotingImplRemoteHooks)
    {
        badges[mainBadge].mint(
                msg.sender,
                instances[identifier].identifier,
                msg.sig,
                instances[identifier].votingContract);
    }

    fallback() external payable {
        emit Received(msg.sender, msg.value);
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
    ) external returns (bytes4) {

        return acceptingNFTs ? msg.sig: bytes4(0);
    }
// }

    
    modifier OnlyByVote {
        if(!_isImplementer()){
            revert OnlyVoteImplementer(msg.sender);
        }
        _;
    }
    
}