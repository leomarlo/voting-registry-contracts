// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.13;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IVotingRegistry} from "../registry/IVotingRegistry.sol";

error OnlyController(address caller, address votingContract);


abstract contract RegistrarPrimitive is ERC721 {

    address immutable internal REGISTRY;

    constructor(address _registry, string memory name_, string memory symbol_)
    ERC721(name_, symbol_) {
        REGISTRY = _registry;
    }

    function _register(address votingContract, address resolver) internal {
        IVotingRegistry(REGISTRY).register(votingContract, resolver);
    }

    function _setController(address votingContract, address controller) internal {
        uint256 tokenId = uint256(uint160(votingContract));
        _mint(controller, tokenId);
    }

    function getController(address votingContract) public view returns(address controller) {
        uint256 tokenId = uint256(uint160(votingContract));
        controller = ownerOf(tokenId);
    }

    function register(address votingContract, address resolver, address controller) virtual public {
        _register(votingContract, resolver);
        _setController(votingContract, controller);
    }
}

abstract contract ChangeResolver is RegistrarPrimitive {


    function changeResolver(address votingContract, address newResolver) external {
        if(msg.sender!=RegistrarPrimitive.getController(votingContract)) {
            revert OnlyController(msg.sender, votingContract);
        }

        IVotingRegistry(REGISTRY).changeResolver(votingContract, newResolver);
    }
}