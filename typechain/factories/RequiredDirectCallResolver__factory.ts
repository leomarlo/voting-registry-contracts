/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  RequiredDirectCallResolver,
  RequiredDirectCallResolverInterface,
} from "../RequiredDirectCallResolver";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "requiredDirectCall",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b50610173806100206000396000f3fe608060405234801561001057600080fd5b506004361061002b5760003560e01c8063e850909d14610030575b600080fd5b61004a60048036038101906100459190610095565b610060565b60405161005791906100cd565b60405180910390f35b60006020528060005260406000206000915054906101000a900460ff1681565b60008135905061008f81610126565b92915050565b6000602082840312156100a757600080fd5b60006100b584828501610080565b91505092915050565b6100c7816100fa565b82525050565b60006020820190506100e260008301846100be565b92915050565b60006100f382610106565b9050919050565b60008115159050919050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b61012f816100e8565b811461013a57600080fd5b5056fea26469706673582212205f5600795eb11736adde88f3bc514e2b693cb8e145809cd4bbb94bbe1a41352064736f6c63430008040033";

export class RequiredDirectCallResolver__factory extends ContractFactory {
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
  ): Promise<RequiredDirectCallResolver> {
    return super.deploy(overrides || {}) as Promise<RequiredDirectCallResolver>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): RequiredDirectCallResolver {
    return super.attach(address) as RequiredDirectCallResolver;
  }
  connect(signer: Signer): RequiredDirectCallResolver__factory {
    return super.connect(signer) as RequiredDirectCallResolver__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): RequiredDirectCallResolverInterface {
    return new utils.Interface(_abi) as RequiredDirectCallResolverInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): RequiredDirectCallResolver {
    return new Contract(
      address,
      _abi,
      signerOrProvider
    ) as RequiredDirectCallResolver;
  }
}
