---
eip: 
title: Configurable voting contract
description: Defines an interface for configurable voting contracts.
author: Leonhard Horstmeyer (@leomarlo)
discussions-to: 
status: Draft
type: Standards Track
category (*only required for Standards Track): ERC
created: 2022-09-08
requires (*optional): 165
---


## Abstract
We argue that there are many benefits to encapsulate the logic and life-cycle of on-chain voting into standalone contracts, in much the same way that token contracts encapsulate the logic of asset transfer. We denote them as *voting contracts* and define a standard for them or rather for their interfaces. Any such contract allows callers to create voting instances and to cast votes on and query the result of the respective instances. The interface allows for the implementation of a wide range of voting types, including for example token-weighted voting, quadratic voting or delegate voting. 

## Motivation
Encapsulating the logic and life-cycle of voting mechanisms into voting contracts has several advantages: Any contract can simply plug into existing, i.e., deployed voting implementations, instead of hard-coding yet another version of a given voting mechanism into a contract in an externally inaccessible way. A contract could also plug out or exchange the reference from one voting contract to another. For this to be possible it is crucial to have a standard that is obeyed by all voting contracts, which is the objective of this EIP. Voting contracts could be called from externally owned accounts and used for plain polls, but they are really meant to be called from other contracts that outsource their voting functionality to them. One of the upsides of on-chain voting apart from recording an immutable record of a vote is to effect a state change through the outcome of the vote. With this standard one can easily pass the calldata for the state change as an argument to a new voting instance. That makes it unmistakably clear what is being voted on. With this standard we want to bring pluggability, flexibility and modularity to on-chain voting.

A voting standard that has recently been suggested is [EIP-1202](/EIPS/eip-1202). The main difference lies in the design choice. Here we suggest a standard for configurable standalone voting contracts. It is *NOT* intended as a standard for inheritable voting functionality. The reason for this design choice is to make voting more modular, more pluggable, more flexible and more diverse. Consider some typical voting use cases such as the admission of new members, upgrading a contract or changing a parameter. One could point the respective state-changing functions to a voting contract that outsources the voting process. An inherited voting contract would need to implement a rather complicated internal logic to account for the qualitatively different voting scenarios. 


The vision for this standard is to have voting contracts flying around the ethereum ecosystem as [ERC-20 tokens](/EIPS/eip-20) or [ERC-721 tokens](/EIPS/eip-20) do. 


## Specification

### Overview

The key words `“MUST”`, `“MUST NOT”`, `“REQUIRED”`, `“SHALL”`, `“SHALL NOT”`, `“SHOULD”`, `“SHOULD NOT”`, `“RECOMMENDED”`, `“MAY”`, and `“OPTIONAL”` in this document are to be interpreted as described in RFC 2119.

The voting contract `MUST` implement [EIP-165](/EIPS/eip-165) and furthermore `MUST` implement at least three functions:
 1. `start`
 2. `vote`
 3. `result` (view)

This yields a bare-bone implementation of this standard. In order to conduct a vote or an election with on-chain consequences one needs to have a function that implements the voting outcome. Thus the voting contract `MAY` implement a function:

 4. `implement` 

We specify them in turn.

### Start &ndash; Starting a new voting instance

The start function should create a new voting instance, namely something that can receive votes, that can have a result and that can later be uniquely referenced by an *identifier*. The abi for this function is:

```json
"name": "start",
"type": "function",
"stateMutability": "nonpayable",
"inputs": [
  {
    "name": "votingParams",
    "type": "bytes"
  },
  {
    "name": "callback",
    "type": "bytes"
  }
],
"outputs": [
  {
    "name": "identifier",
    "type": "uint256"
  }
]
```

Two arguments `MUST` be passed to the `start`-function, namely `bytes memory votingParams` and `bytes calldata callback`. The `uint256 identifier` of the instance `MUST` be returned. We discuss them in turn. Each voting instance can be configured through `votingParams`, for instance by the token address that determines the voting weights, by the duration of the vote or by the quorum required for a successful conclusion. What the configurable quantities are and how they are encoded in the `votingParams` argument is up to the choice of implementation (see [Extensions](#Extensions)). 

The second argument indicates what is being voted on. In general this contains the calldata that gets executed when voting is finished and the conditions set out in the voting contract implementation are met. It is left to the implementer to choose whether the calldata is stored or whether its hash is stored to minimize storage space. In the latter case a call-triggering function needs to be implemented to which the correct calldata is passed and comparing their hashes ensures that what is being executed coincides with what has been voted on. The above-mentioned `implement` function `MAY` be used for that. 

As a new voting instance has been started an event `MUST` be emitted:
```json
"name": "VotingInstanceStarted",
"type": "event",
"anonymous": false,
"inputs": [
  {
    "name": "identifier",
    "type": "uint256"
  },
  {
    "name": "caller",
    "type": "address"
  }
]
```
This standard does not specify where the data pertaining to the new voting instance ought to be stored. One `MAY` choose to store the votes, the configuration, the results, possibly the calldata and any other data in the voting contract itself or spawn a dedicated contract for it. If a new contract is created for each voting instance (probably through a proxy factory to reduce costs) then the address of the instance is a good choice for the identifier, otherwise simple enumeration is a good option. 
 

In `solidity 0.8.13` the `start` function and the `VotingInstanceStarted` event would take the following form:
```js
function start(bytes memory votingParams, bytes calldata callback) external returns(uint256 identifier); 

event VotingInstanceStarted(uint256 identifier, address caller);
```

### Vote &ndash; Casting a vote

The vote function should record a vote with respect to a voting instance that is referenced through the identifier. The abi for this function is: 

```json
"name": "vote",
"type": "function",
"stateMutability": "nonpayable",
"inputs": [
  {
    "name": "identifier",
    "type": "uint256"
  },
  {
    "name": "votingData",
    "type": "bytes"
  }
],
"outputs": [
  {
    "name": "status",
    "type": "uint256"
  }
]
```

The `vote` function `MUST` receive the `uint256 identifier` as its first argument and information about the vote via its second argument `bytes calldata votingData` (see information in the next paragraph). The calling contract should be notified about status changes via the return value `uint256 status`. In order to allow for greater flexibility the status `MUST` be of type `uint256`. The first three numbers are reserved: A status of 0 corresponds to an inactive voting instance (the default for any instance and in particular those that have not been started yet). A status of 1 corresponds to a completed vote and a status of 2 corresponds to a failed vote. It is strongly `RECOMMENDED` to stick to this mapping for the first three numbers. The higher numbers can be allocated for purposes that are particular to the logic of the voting contract at hand.

The `votingData` would typically contain the chosen option encoded as bytes. For instance in solidity the encoding could be, say, `bytes memory votingData = abi.encode(uint256(1))` if `1` would be the option voted upon. Internally the function could then decode the `votingData` like `uint256 option = abi.decode(votingData, (uint256))`. The triad `approve`, `disapprove` and `abstain` would be a typical set of options to be encoded. Depending on the logic and configuration of the voting contract one might as well want to pass an address to the `votingData` instead of a number. Having a `bytes` argument allows for this flexibility and the encoding (resp. decoding) would work similarly to the abovementioned example, except that `uint256` would be exchanged for `address`.

In `solidity 0.8.13` the `vote` function and a `status`-enum take the following form:

```js
enum VotingStatus {inactive, completed, failed}

function vote(uint256 identifier, bytes calldata votingData) external returns(uint256 status);
```



### Result &ndash; Query the outcome

There `MUST` be a `result` function that anyone can call to query about the outcome of the vote. The abi for this function is: 

```json
"name": "result",
"type": "function",
"stateMutability": "view",
"inputs": [
  {
    "name": "identifier",
    "type": "uint256"
  }
],
"outputs": [
  {
    "name": "resultData",
    "type": "bytes"
  }
]
```

The function `MUST` have a `view` state mutability. Its single argument `MUST` be `uint256 identifier`, thus retrieving the location where the voting instance keeps its data. The output `bytes memory resultData` value `MUST` be bytes and could be anything that provides information about the result of the vote. It could be the bytes-encoded address of a winner or the bytes-encoded integer of the winning option. It could be an empty data if no result exists yet or it could be the currently leading option. One could also aggregate information, such as the status together with the number of votes for the respective options. 

### Supports Interface

The ERC-165 identifier for this interface is `0x9452d78d`:
```js
0x9452d78d ===
    bytes4(keccak256('start(bytes,bytes)')) ^
    bytes4(keccak256('vote(uint256,bytes)')) ^
    bytes4(keccak256('result(uint256)'));
```    

### Implement &ndash; Trigger an implementation call

An extension to this standard that has a particular role is the `implement` function that `MAY` be implemented. If it is implemented it is `RECOMMENDED` to have the following abi:

```json
"name": "implement",
"type": "function",
"stateMutability": "payable",
"inputs": [
  {
    "name": "identifier",
    "type": "uint256"
  },
  {
    "name": "callback",
    "type": "bytes"
  }
],
"outputs": [
  {
    "name": "response",
    "type": "uint8"
  }
]
```

This function executes the calldata that is passed as its second argument, if the state of the voting instance referenced by the `identifier` allows it. The function `SHOULD` be payable to allow for more use-cases. Under the hood of this function two things need to happen. First, there should be some sort of guard that prevents arbitrary calldata to be passed. If the calldata has been stored already in the voting instance, then one doesn't need to pass any calldata at all, but simply retrieve it from the `identifier`. If the hash of the calldata has been stored instead, then one may require that the hash of the incoming calldata equals to the stored hash. Second, a low-level call should be made. Depending on the type of vote and the configuration the target contract address for the call, i.e. `targetAddress`, can be set during the initialization (the start) of the voting instance or it might be the calling contract itself (again depending on the configuration). In solidity this call would look like this:
```js
(bool success, bytes memory errorMessage) = targetAddress.call{value: msg.value}(callback);
```


### Extensions

The `implement` function extends the bare-bone voting contract interface. There are several ways how to extend the contract. Here we mention a few ways:

One `MAY` implement two functions that respectively have a `pure` mutability and are called `encodeVotingParams` and `decodeVotingParams`. They would help anyone interacting with the voting contract to pass the correct votingParams into the construction of a voting instance. We do not provide the abi here, since these functions are implementation-specific.

One `MAY` implement several getter functions, such as `getStatus`, `getDeadline`, `getQuorum`, `getToken` etc. These functions `MUST` have a `view` mutability and `MUST` have the `uint256 identifier` as their single argument in order to retrieve the respective value. This would help a caller of the voting contract to retrieve crucial information about the voting instance. It also provides security, since a calling contract could revert the instantiation, when the instance has been provided with a wrong token or a wrong deadline.

## Rationale

The two observations that directly lead to this specification were:

1. It seems redundant, error-prone and wasteful to implement, say, a token-weighted vote with deadline for the hundred's time inside some contract. The same holds for any other type of vote that is frequently used. No other contract can use a hard-coded version of that voting implementation. Having one contract that handles a certain type of voting and then pointing to that voting contract is less error-prone, more resourceful and less redundant.

2. The internal logic of a contract becomes unwieldy if multiple things require voting, because each of them might require a different kind of voting mechanism. Replacing this overhead with pointers to voting contracts seems like the most economic and least error-prone solution.

Generally speaking the design choice made in this specification is to separate the voting logic from the main contract. This has many advantages. Updating and upgrading becomes as simple as changing a pointer. Bugs or other issues that pertain to the voting do not corrupt the main contract.



## Backwards Compatibility
There are no backwards compatibility issues.

## Test Cases
This EIP does not affect consensus changes. A successful implementation of the standard has to implement the `EIP-165` function `supportsInterface` and that should return true whenever the interface id for the ERC-165 interface `0x01ffc9a7 = bytes4(keccak256('supportsInterface(bytes4)'))` is passed as an argument or the interface id for the voting contract `0x9452d78d`.  


## Security Considerations
The main security concern of implementers of this standard regards the low-level call. It is a risk that does not necessarily directly pertain to the voting contract itself, but the the contract that sits at the target end of the call. 


## Copyright
Copyright and related rights waived via [CC0](../LICENSE.md).