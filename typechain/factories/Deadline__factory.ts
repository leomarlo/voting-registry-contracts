/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { Deadline, DeadlineInterface } from "../Deadline";

const _abi = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "identifier",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "deadline",
        type: "uint256",
      },
    ],
    name: "DeadlineHasNotPassed",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "identifier",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "deadline",
        type: "uint256",
      },
    ],
    name: "DeadlineHasPassed",
    type: "error",
  },
];

const _bytecode =
  "0x6080604052348015600f57600080fd5b50603f80601d6000396000f3fe6080604052600080fdfea264697066735822122050b37d8cadddd7efbafc23c2ef9139ac077581d8d0931e03c064b1816c8cd41f64736f6c63430008040033";

export class Deadline__factory extends ContractFactory {
  constructor(
    ...args: [signer: Signer] | ConstructorParameters<typeof ContractFactory>
  ) {
    if (args.length === 1) {
      super(_abi, _bytecode, args[0]);
    } else {
      super(...args);
    }
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<Deadline> {
    return super.deploy(overrides || {}) as Promise<Deadline>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): Deadline {
    return super.attach(address) as Deadline;
  }
  connect(signer: Signer): Deadline__factory {
    return super.connect(signer) as Deadline__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): DeadlineInterface {
    return new utils.Interface(_abi) as DeadlineInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): Deadline {
    return new Contract(address, _abi, signerOrProvider) as Deadline;
  }
}
