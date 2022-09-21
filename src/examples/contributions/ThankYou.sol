// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

error OnlyMinter(address caller);
error UnmatchingInputs();

interface IThankYou {
    function mint(address contributor, uint256 contribution) external; 
    function batchMint(address[] memory contributors,uint256[] memory contributions) external; 
    function getContribution(address contributor) external returns(uint256 contribution);
}

contract ThankYou is IThankYou, ERC721 {
    

    ////////////////////////////////////////////////////////////
    // STATE VARIABLES                                        //
    ////////////////////////////////////////////////////////////


    address private immutable _minter;
    uint256 public numberOfContributions;
    mapping(address=>uint256) public contributionInEthWei; 


    ////////////////////////////////////////////////////////////
    // CONSTRUCTOR                                            //
    ////////////////////////////////////////////////////////////


    constructor() ERC721("Thanks for your contribution. Let's start voting!", "THX"){
        _minter = msg.sender;
    }


    ////////////////////////////////////////////////////////////
    // MINTING                                                //
    ////////////////////////////////////////////////////////////


    function mint(
        address contributor,
        uint256 contribution
    ) 
    public 
    onlyMinter
    override(IThankYou) 
    {
        numberOfContributions ++;
        contributionInEthWei[contributor] += contribution;
        _mint(contributor, numberOfContributions);
    }


    function batchMint(
        address[] memory contributors,
        uint256[] memory contributions
    ) 
    external 
    onlyMinter 
    override(IThankYou) 
    {
        if(contributions.length!=contributors.length) revert UnmatchingInputs();
        for(uint16 i=0; i<contributors.length; i++){
            mint(contributors[i], contributions[i]);
        }
    }


    ////////////////////////////////////////////////////////////
    // GETTERS                                                //
    ////////////////////////////////////////////////////////////


    function getContribution(
        address contributor
    )
    external
    view
    override(IThankYou)  
    returns(uint256 contribution)
    {
        contribution = contributionInEthWei[contributor];
    }



    ////////////////////////////////////////////////////////////
    // MODIFIERS                                              //
    ////////////////////////////////////////////////////////////


    modifier onlyMinter {
        if(msg.sender!=_minter) revert OnlyMinter(msg.sender);
        _;
    }
    
}