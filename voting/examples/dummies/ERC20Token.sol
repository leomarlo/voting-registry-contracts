// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract DummyToken is ERC20 {

    address public immutable croesus;
    uint256 public constant MAX_DUMMY_MINT = 10_000 * 1e18;
    
    constructor() ERC20("DummyToken", "DUMMY"){
        croesus = msg.sender;
    }

    function mint(uint256 amount) external {
        require(amount<=MAX_DUMMY_MINT || msg.sender==croesus, "Exceeded maximal mint");
        _mint(msg.sender, amount);
    }
}
