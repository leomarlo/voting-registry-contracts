// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;

import {IGetCallbackData} from "../interfaces/IGetCallbackData.sol";


abstract contract CallbackDataGetterAndSetter is IGetCallbackData{

    mapping(uint256=>bytes) internal _callbackData;

    function getCallbackData(uint256 identifier) public view virtual override(IGetCallbackData) returns(bytes memory) {
        return _callbackData[identifier];
    }

    function _setCallbackData(uint256 identifier, bytes memory callbackData) internal virtual {
        _callbackData[identifier] = callbackData;
    }
}

