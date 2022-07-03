/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { ICallerGetter, ICallerGetterInterface } from "../ICallerGetter";

const _abi = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "identifier",
        type: "uint256",
      },
    ],
    name: "getCaller",
    outputs: [
      {
        internalType: "address",
        name: "caller",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export class ICallerGetter__factory {
  static readonly abi = _abi;
  static createInterface(): ICallerGetterInterface {
    return new utils.Interface(_abi) as ICallerGetterInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): ICallerGetter {
    return new Contract(address, _abi, signerOrProvider) as ICallerGetter;
  }
}
