/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { Snapshot, SnapshotInterface } from "../Snapshot";

const _abi = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "identifier",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "voter",
        type: "address",
      },
    ],
    name: "AlreadyVoted",
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
  {
    inputs: [
      {
        internalType: "uint256",
        name: "identifier",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "status",
        type: "uint256",
      },
    ],
    name: "StatusError",
    type: "error",
  },
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
        internalType: "address",
        name: "caller",
        type: "address",
      },
    ],
    name: "VotingInstanceStarted",
    type: "event",
  },
  {
    inputs: [],
    name: "VOTING_DURATION",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "identifier",
        type: "uint256",
      },
    ],
    name: "conclude",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
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
  {
    inputs: [],
    name: "getCurrentIndex",
    outputs: [
      {
        internalType: "uint256",
        name: "currentIndex",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "identifier",
        type: "uint256",
      },
    ],
    name: "getStatus",
    outputs: [
      {
        internalType: "uint256",
        name: "status",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "identifier",
        type: "uint256",
      },
    ],
    name: "result",
    outputs: [
      {
        internalType: "bytes",
        name: "resultData",
        type: "bytes",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "votingParams",
        type: "bytes",
      },
      {
        internalType: "bytes",
        name: "callback",
        type: "bytes",
      },
    ],
    name: "start",
    outputs: [
      {
        internalType: "uint256",
        name: "identifier",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "interfaceId",
        type: "bytes4",
      },
    ],
    name: "supportsInterface",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "pure",
    type: "function",
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
        name: "votingData",
        type: "bytes",
      },
    ],
    name: "vote",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b50610fc7806100206000396000f3fe608060405234801561001057600080fd5b50600436106100935760003560e01c80633c594059116100665780633c594059146101325780635c622a0e14610162578063a438d20814610192578063a8b0b3ed146101b0578063b88b82ba146101e057610093565b806301ffc9a7146100985780630d9005ae146100c85780631080156e146100e65780633487b25614610116575b600080fd5b6100b260048036038101906100ad9190610a29565b610210565b6040516100bf9190610bcb565b60405180910390f35b6100d06102e2565b6040516100dd9190610c23565b60405180910390f35b61010060048036038101906100fb9190610a52565b6102ec565b60405161010d9190610c23565b60405180910390f35b610130600480360381019061012b9190610abe565b61040d565b005b61014c60048036038101906101479190610abe565b61051c565b6040516101599190610be6565b60405180910390f35b61017c60048036038101906101779190610abe565b61054d565b6040516101899190610c23565b60405180910390f35b61019a61056a565b6040516101a79190610c23565b60405180910390f35b6101ca60048036038101906101c59190610abe565b610571565b6040516101d79190610bb0565b60405180910390f35b6101fa60048036038101906101f59190610ae7565b6105ae565b6040516102079190610c23565b60405180910390f35b60007f01ffc9a7000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916827bffffffffffffffffffffffffffffffffffffffffffffffffffffffff191614806102db57507f9452d78d000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916827bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916145b9050919050565b6000600554905090565b60006102fb60055484846107fc565b61030760055484610801565b3360036000600554815260200190815260200160002060006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550600380811115610394577f4e487b7100000000000000000000000000000000000000000000000000000000600052602160045260246000fd5b600460006005548152602001908152602001600020819055507f8e967d6054e2a51c6c0b65a326c2c53edf07f50d4a854e102eed777cfb591378600554336040516103e0929190610c3e565b60405180910390a16001600560008282546103fb9190610d96565b92505081905550600554905092915050565b600380811115610446577f4e487b7100000000000000000000000000000000000000000000000000000000600052602160045260246000fd5b6004600083815260200190815260200160002054146104b1578060046000838152602001908152602001600020546040517f42ffc0970000000000000000000000000000000000000000000000000000000081526004016104a8929190610c67565b60405180910390fd5b6104ba81610812565b610510578060026000838152602001908152602001600020546040517fa2030cfc000000000000000000000000000000000000000000000000000000008152600401610507929190610c67565b60405180910390fd5b61051981610824565b50565b6060610527826108c8565b6040516020016105379190610c08565b6040516020818303038152906040529050919050565b600060046000838152602001908152602001600020549050919050565b6206978081565b60006003600083815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050919050565b60006003808111156105e9577f4e487b7100000000000000000000000000000000000000000000000000000000600052602160045260246000fd5b600460008581526020019081526020016000205414610654578260046000858152602001908152602001600020546040517f42ffc09700000000000000000000000000000000000000000000000000000000815260040161064b929190610c67565b60405180910390fd5b61065d83610812565b156106865761066b83610824565b600460008481526020019081526020016000205490506107f6565b60008084815260200190815260200160002060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900460ff16156107275782336040517f04f9da6300000000000000000000000000000000000000000000000000000000815260040161071e929190610c3e565b60405180910390fd5b600160008085815260200190815260200160002060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548160ff0219169083151502179055506000828060200190518101906107a59190610a00565b90506107de84826107d6577fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff6107d9565b60015b6108e5565b60046000858152602001908152602001600020549150505b92915050565b505050565b61080e8262069780610913565b5050565b600061081d8261093a565b9050919050565b600061082f826108c8565b14610873576001600381111561086e577f4e487b7100000000000000000000000000000000000000000000000000000000600052602160045260246000fd5b6108ae565b600260038111156108ad577f4e487b7100000000000000000000000000000000000000000000000000000000600052602160045260246000fd5b5b600460008381526020019081526020016000208190555050565b600060016000838152602001908152602001600020549050919050565b806001600084815260200190815260200160002060008282546109089190610d02565b925050819055505050565b804261091f9190610d96565b60026000848152602001908152602001600020819055505050565b6000600260008381526020019081526020016000205442119050919050565b600061096c61096784610cb5565b610c90565b90508281526020810184848401111561098457600080fd5b61098f848285610e6a565b509392505050565b6000815190506109a681610f4c565b92915050565b6000813590506109bb81610f63565b92915050565b600082601f8301126109d257600080fd5b81356109e2848260208601610959565b91505092915050565b6000813590506109fa81610f7a565b92915050565b600060208284031215610a1257600080fd5b6000610a2084828501610997565b91505092915050565b600060208284031215610a3b57600080fd5b6000610a49848285016109ac565b91505092915050565b60008060408385031215610a6557600080fd5b600083013567ffffffffffffffff811115610a7f57600080fd5b610a8b858286016109c1565b925050602083013567ffffffffffffffff811115610aa857600080fd5b610ab4858286016109c1565b9150509250929050565b600060208284031215610ad057600080fd5b6000610ade848285016109eb565b91505092915050565b60008060408385031215610afa57600080fd5b6000610b08858286016109eb565b925050602083013567ffffffffffffffff811115610b2557600080fd5b610b31858286016109c1565b9150509250929050565b610b4481610dec565b82525050565b610b5381610dfe565b82525050565b6000610b6482610ce6565b610b6e8185610cf1565b9350610b7e818560208601610e79565b610b8781610f3b565b840191505092915050565b610b9b81610e36565b82525050565b610baa81610e60565b82525050565b6000602082019050610bc56000830184610b3b565b92915050565b6000602082019050610be06000830184610b4a565b92915050565b60006020820190508181036000830152610c008184610b59565b905092915050565b6000602082019050610c1d6000830184610b92565b92915050565b6000602082019050610c386000830184610ba1565b92915050565b6000604082019050610c536000830185610ba1565b610c606020830184610b3b565b9392505050565b6000604082019050610c7c6000830185610ba1565b610c896020830184610ba1565b9392505050565b6000610c9a610cab565b9050610ca68282610eac565b919050565b6000604051905090565b600067ffffffffffffffff821115610cd057610ccf610f0c565b5b610cd982610f3b565b9050602081019050919050565b600081519050919050565b600082825260208201905092915050565b6000610d0d82610e36565b9150610d1883610e36565b9250817f7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff03831360008312151615610d5357610d52610edd565b5b817f8000000000000000000000000000000000000000000000000000000000000000038312600083121615610d8b57610d8a610edd565b5b828201905092915050565b6000610da182610e60565b9150610dac83610e60565b9250827fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff03821115610de157610de0610edd565b5b828201905092915050565b6000610df782610e40565b9050919050565b60008115159050919050565b60007fffffffff0000000000000000000000000000000000000000000000000000000082169050919050565b6000819050919050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000819050919050565b82818337600083830152505050565b60005b83811015610e97578082015181840152602081019050610e7c565b83811115610ea6576000848401525b50505050565b610eb582610f3b565b810181811067ffffffffffffffff82111715610ed457610ed3610f0c565b5b80604052505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b6000601f19601f8301169050919050565b610f5581610dfe565b8114610f6057600080fd5b50565b610f6c81610e0a565b8114610f7757600080fd5b50565b610f8381610e60565b8114610f8e57600080fd5b5056fea26469706673582212208b3d4acd4d73e476a65bb9046dab6008594fda9623556c7f0d5ae872c2554c6664736f6c63430008040033";

export class Snapshot__factory extends ContractFactory {
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
  ): Promise<Snapshot> {
    return super.deploy(overrides || {}) as Promise<Snapshot>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): Snapshot {
    return super.attach(address) as Snapshot;
  }
  connect(signer: Signer): Snapshot__factory {
    return super.connect(signer) as Snapshot__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): SnapshotInterface {
    return new utils.Interface(_abi) as SnapshotInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): Snapshot {
    return new Contract(address, _abi, signerOrProvider) as Snapshot;
  }
}
