// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract DummyNFT is ERC721 {
    uint256 public issuedNFTs;

    constructor() ERC721("DummyNFT", "DUMMY"){}

    function freeMint() external {
        _mint(msg.sender, issuedNFTs);
        issuedNFTs ++;
    }
}