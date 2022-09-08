// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";


error NotApprovedContract(address sender);
error TransferNotAllowed(uint256 tokenId);
error OnlyMotherContract(address sender, address _motherContract);

abstract contract CalculateId {
    function calculateId(uint256 index, bytes4 selector, address votingContract, address minter) public pure returns (uint256) {
        return uint256(bytes32(abi.encodePacked(
            uint32(bytes4(bytes32(index) << 224)),
            bytes12(bytes20(minter)),
            selector,
            bytes12(bytes20(votingContract)))));
    }
}

interface IPlaygroundVotingBadge is IERC721{
    function mint(address to, uint256 index, bytes4 selector, address votingContract) external; 
    function exists(uint256 tokenId) external view returns(bool);
    function balanceOfSignature(address owner, bytes4 selector) external returns(uint256);
    function changeEnableTradingThreshold(uint256 newThreshold) external;
    function changeTradingEnabledGlobally(bool enable) external;
    function approveContract(address newContract, bool approval) external returns(bool);
}

contract PlaygroundVotingBadge is 
CalculateId, ERC721 {

    mapping(address=>bool) public isApprovedContract;
    mapping(address=>bool) public tradingEnabled;
    address public motherContract;
    uint256 public enableTradingThreshold;
    bool public tradingEnabledGlobally;

    mapping(address=>mapping(bytes4=>uint256)) private _balanceOfSignature;

    // e.g. name and symbol = "Playground Voting Badge", "VOT"
    constructor(string memory name, string memory symbol) ERC721(name, symbol){
        motherContract = msg.sender;
        isApprovedContract[msg.sender] = true;
    }

    function balanceOfSignature(address owner, bytes4 selector) public view returns(uint256 balance) {
        balance = _balanceOfSignature[owner][selector];
    } 

    event Blaab(uint256 tokenId, address to, bytes4 selector, address votingContract, uint256 index);
    // minting can only happen through approved contracts
    function mint(address to, uint256 index, bytes4 selector, address votingContract) 
    external 
    onlyApprovedContract
    {
        uint256 tokenId = calculateId(index, selector, votingContract, to);
        emit Blaab(tokenId, to, selector, votingContract, index);

        _mint(to, tokenId);
        
    }

    function exists(uint256 tokenId) external view returns (bool) {
        return _exists(tokenId);
    }

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721) {
        bytes4 selector = bytes4(bytes32(tokenId) << 128);
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
        if (!tradingEnabled[msg.sender] && balanceOf(ownerOf(tokenId)) >= enableTradingThreshold){
            // it's sufficient to be above the threshold once.
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


