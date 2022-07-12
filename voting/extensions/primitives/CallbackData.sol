// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.13;

import {IGetCallbackData} from "../interfaces/IGetCallbackData.sol";


abstract contract CallbackData {
    mapping(uint256=>bytes) internal _callbackData;
}


abstract contract CallbackDataGetter is IGetCallbackData, CallbackData{

    function getCallbackData(uint256 identifier) public view virtual override(IGetCallbackData) returns(bytes memory) {
        return _callbackData[identifier];
    }
}

