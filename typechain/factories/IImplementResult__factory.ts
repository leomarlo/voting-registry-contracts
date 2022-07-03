/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import { Provider } from "@ethersproject/providers";
import type {
  IImplementResult,
  IImplementResultInterface,
} from "../IImplementResult";

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "identifier",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "callbackData",
        type: "bytes",
      },
    ],
    name: "Implemented",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "identifier",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "callbackData",
        type: "bytes",
      },
    ],
    name: "implement",
    outputs: [
      {
        internalType: "enum IImplementResult.Response",
        name: "response",
        type: "uint8",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export class IImplementResult__factory {
  static readonly abi = _abi;
  static createInterface(): IImplementResultInterface {
    return new utils.Interface(_abi) as IImplementResultInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): IImplementResult {
    return new Contract(address, _abi, signerOrProvider) as IImplementResult;
  }
}
