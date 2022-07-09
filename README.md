# Design of the Voting Standard and Voting Registry

## Voting Standard

The objective of a voting contract standard is to facilitate usage across diverse applications, to allow adoption and inter-operatability and to increase trust.

The voting contract should implement at least three function:
 1. `start`
 2. `vote`
 3. `result` (view)

We `RECOMMEND` that it also implement these functions:

 4. `implement` (optional)
 5. `encodeVotingParams` (view, optional)
 6. `decodeVotingParams` (view, optional)

and any set of extensions.

### **Start a Voting Instance**

The start function should create a new voting instance. Two arguments should be passed to it, namely `bytes memory votingParams` and `bytes memory callback`. The `uint256 identifier` of the instance should be returned:
```js
function start(bytes memory votingParams, bytes memory callback) external returns(uint256 identifier); 
```

The configuration of the voting instance should be passed through the `votingParams`. Parameters could for instance be the duration of the vote, a quorum threshold, a majority threshold and in many cases a token address for token-weighted votes. The choice of parameter serialization is left as a matter of the contract's internal logic. Typically the configuration is stored at least for the duration of the voting. 

On-chain votes should have on-chain consequences. Those are encoded in the `callback` argument. It contains the calldata for the low-level call triggering the outcome. However, this voting interface could just aswell be written without on-chain consequences, simply by ignoring that argument and allowing it to be set to `""`. The callback data could either be stored entirely and retrieved once the outcome has been determined or it could be hashed and later used as a key to trigger the low-level call. (see **Implement the Voting Result**)

Once the voting instance has been configured and created a pointer to that instance should be returned. This could be a hash that uniquely identifies a voting instance or an index of sorts.


### **Casting a Vote**

The vote function should be called to cast a vote. It needs to receive the `uint256 identifier` as one argument and information about the vote via `bytes memory votingData`. The current status `uint256 status` should be returned, so that a calling contract could immediately act upon a status-change. To allow for greater flexibility the status is of type `uint256`. We recommend that the first four are reserved to `inactive`, `completed`, `failed` and `active`.

```js
function vote(uint256 identifier, bytes memory votingData) external returns(uint256 status);
```

Typically one would encode the voter's choice in the `votingData`. The options `approve`, `disapprove` and `abstain` could be encoded. Depending on the typ of vote one might also choose to leave it blank and consider the bare vote as sufficient indication of preference. When the `vote`-function is called via a contract rather than directly, the voter's address should be encoded in the `votingData`. When it is called directly the voter is the `msg.sender`. One might also encode data that can be inserted into the callback. For instance, if the vote is about choosing between several candidates, then the candidate address could be passed into the `votingData`. Care must be taken in the `callback` argument when defining the bytes range where the option can be inserted.  

In order to follow the recommendation of fixing the first four status categories one `MAY` define an `enum` data-type
```js
enum VotingStatus {inactive, completed, failed, active}
```
that enforces them.

### **Querying the Result of the Voting Instance**

There must be a method that can query the result of a voting instance. 
```js
function result(uint256 identifier) external view returns(bytes memory resultData);
```

The function should be a `view` function whose single argument is the `uint256 identifier` of the voting instance. The output `bytes memory resultData` could be the current status of the vote. Apart from the status one could add some information about the aggregated votes, such as the number of approvals, disapprovals and abstentions.

### Implement the Voting Result

This standard is really meant for voting with on-chain consequences, but it can also be used like snapshot. The `implement` function executes the `bytes memory callbackData` directly on the calling contract. As arguments it takes the `uint256 identifier` and the `bytes memory callbackData`. It returns a response that can be either `successful` or `unsuccessful`. Calls that have not yet been made get the state `precall`.

```js
enum Response {precall, successful, failed}

function implement(uint256 identifier, bytes memory callbackData) external returns(Response response); 
```
The `implement` function `MAY` be implemented. Having another contract make low-level calls with calldata that it could potentially temper with requires a high level of trust. The voting contract `SHOULD NOT` be a proxy contract, which would open possible attack vectors. The target contract, that calls the `implement` function `SHOULD` be able to block calls from a voting instance that implements this function. (see **Voting Integration**). These concerns lead to the suggestion of having the `implement` function as an optional but recommended extension of the minimal voting standard.





## Implementations

We maintain a selection of basic implementations of the proposed voting contract standard inside the `implementations`-folder. There is a great amount of flexibility in the implementation. The most trivial one being a snapshot vote. The general idea is to mix and match certain features. Here we provide a non-exhaustive list of possible features, some of which can be found in the `extensions`-folder:

- majority vote (MV)
- first-past-the-post (FPTP)
- token-weighted vote (TWV)
- duration (DUR)
- quorum (QR)
- threshold (THR)
- delegation (DLG)
- implemented (IMP)
- one-account-one-vote (OAOV)
- one-person-one-vote (OPOV)
- only-proponents (!YES)
- yes-or-no (YN)
- yes-no-or-abstain (YNA)
- non-binary-options (NBO)
- ...

A list of maintained implementations (contract testing is outsourced to [voting-registry](https://github.com/leomarlo/voting-registry)):

1. snapshot vote (YN/DUR)
2. majority vote with implementation (YN/DUR/IMP)

**1. Snapshot Vote**: The snapshot vote is an implementation of the off-chain voting that simply records votes with two options (Yes or No) and has a non-adjustable deadline of 5 days.

**2. Majority vote with implementation**: This is a simple majority vote. The implementation calldata is passed into the creation of the voting instance and stored as a hash. After a deadline of 5 days has passed and the majority voted in favor of implementation, anyone can trigger the implement function using the correct calldata as a key.


## Integration

It is `RECOMMENDED` to access the voting contracts through a proxy contract, the *caller*. Ideally this is the contract affected by the outcome of the voting. It `SHOULD` contain two components:
1. An interface that connects to the voting contract
2. A security layer that (dis-)allows certain function selectors and voting contracts.

### Interface for the Voting Contract 

The interface `SHOULD` contain a `start` function, which calls the standardized `start` function of the voting contract under the hood and uses customized logic for its return value, the *identifier* of the voting instance so that the *caller* may track the journey of that instance as votes are coming in.

```js
function start(bytes memory votingParams, bytes memory callback) external {
    // customized logic
    IVotingContract()
};
```

If one is not using this framework as a substitute for snapshot to record votes for ever on the chain without triggering on-chain consequences, then one may implement a simple `vote` function that calls the standardized vote function under the hood:

```js
function vote(uint256 identifier, bytes memory votingData) external;
```


Regarding the integration of the `voting` and `implement` there are bascially three options:

1. 

The implementation of the vote is then either left to the voting contractt or to internal logic of the *caller*.

### Function Selectors and Voting Contracts

One might want to add another layer of control and security by specifying those functions that can be acted upon through a vote. Moreover one could specify which voting contract should be responsible for voting on a given function. A mapping from the `bytes4` function selector to the `address` of the voting contract would achieve this:

```js
mapping(bytes4=>address) assignedContract; 
```

When starting a new voting instance with `bytes votingParams` and `bytes callback`, the voting contract is already specified via `assignedContract[bytes4(callback)]`. This gives a high degree of control. In a hypothetical scenario one could use for example a `simple token-weighted majority` for a function `foo` that decides how to allocate funds and for example an `m-out-of-n` for a function `bar` that changes a contract-specific role.


## Voting Registry Contract System

The voting registry contract system consists of three components. In its design it is a stripped down version of the ENS system:
 1. registry
 2. registrar
 3. resolver

 The registry stores all the records of voting implementations and a pointer to the metadata. This pointer is the address of a resolver contract and the metadata is stored in that resolver contract allowing for more flexibility regarding the structure of the metadata and its mutability. The registrar handles the registration. 

### **Voting Registry**

The voting registry is a place where voting contracts `MAY` register their voting implementation, if they satisfy the `voting contract interface`. We propose that registration consists of only two steps:
 1. Check the interface of the voting contract that seeks registration.
 2. Create an entry in the registry. 
 
In order to check the interface, we suggest that the voting contract needs to implement the ERC165 standard with a function `supportsInterface`. The voting contract must have completed deployment before registration can take place. If the registration were to be called during the construction of the contract, the registry would not be able to call any external functions and therefore couldn't complete the registration. The function that checks the interface would look like this:
```js
bytes4 constant VOTING_CONTRACT_STANDARD_INTERFACE = 0x12345678;

function checkInterface(address contractAddress) internal returns(bool) {
    return IERC165(contractAddress).supportsInterface(VOTING_CONTRACT_STANDARD_INTERFACE);
}
```
An entry in the registry consists of a mapping from the voting contract address (`contractAddress`) to a tuple containing the address of the registrar that may also be an externally owned account (`registrar`) and the address of a resolver contract that resolves any metadata (`resolver`). Setting the resolver is optional. We propose to store this with a struct data type and a mapping:
```js
struct Record {
    address registrar,
    address resolver
}

mapping(address=>Record) records;
```
The registration would then be as simple as calling the `register` function which triggers a `Registered` event:
```js
event Registered(address contractAddress, address registrar, address resolver);

function register(
    address contractAddress,
    address resolver)
external
returns(bytes32 votingContractId)
{
    require(records[contractAddress].registrar == address(0));
    require(checkInterface(contractAddress));
    records[contractAddress] = Record({
        registrar: msg.sender,
        resolver: resolver
    });
    emit Registered(contractAddress, msg.sender, resolver);
}
```

The registrar is somewhat like an owner of the record. So we propose to allow for the resolver to be changed by the registrar:
```js
event ResolverUpdated(address newResolver);

function changeResolver(
    address contractAddress,
    address resolver)
external
{
    require(msg.sender==records[contractAddress].registrar);
    records[contractAddress].resolver = resolver;
    emit ResolverUpdated(resolver);
}
```


### **Registrar**

The registrar is the msg.sender for the registration. Although an externally owned account could perfectly register a new voting contract, there are many advantages of having a contract doing the job. The main ones being visibility, reliability, governance and maintenance.

The core function of the registrar is obviously to register on the registry:
```js
address constant REGISTRY = 0x0123456789012345678901234567890123456789;

function _register(address votingContract, address resolver) internal {
    IRegistry(REGISTRY).register(votingContract, resolver);
}
```

The rights to that registry record may conferred to a controller, who may transfer the rights if desired. The registrar is then simply the executer of any logic regarding the records. One convenient way to handle the issuance of controller rights as well as their transferral would be through an implementation of a `ERC721` interface. However, other implementations are equally possible. 
```js
function _setController(address votingContract, address controller) internal {
    uint256 tokenId = uint256(uint160(votingContract));
    ERC721._mint(controller, tokenId);
}

function getController(address votingContract) public view returns(address controller) {
    uint256 tokenId = uint256(uint160(votingContract));
    controller = ERC721.ownerOf(tokenId);
}
```
The registration would then not only register the voting contract to the registry, but also confer rights to a designated controller:
```js
function register(address votingContract, address resolver, address controller) external {
    _register(votingContract, resolver);
    _setController(votingContract, controller);
}
```

The registrar contract `MAY` also have an interface for the owner to set a new resolver. 
```js
function changeResolver(address votingContract, address newResolver) external {
    require(msg.sender==_getController(votingContract));
    IRegistry(REGISTRY).changeResolver(votingContract, newResolver);
}
```

### **Resolver**

The resolver is any contract that adds metadata to the registered record. The following list provides suggestions regarding the information that `MAY` be recorded:
 1. Are new voting instances created directly through the voting contract?
 2. Does the voting contract have an `implement` external function?
 3. Is the voting contract an upgradable proxy contract?
 4. What kind of voting methods are available?
 5. How often has the voting instance been created?

 ```js
 mapping(address=>bool) public requiredDirectCall;
 mapping(address=>bool) public isImplementer;
 mapping(address=>bool) public isProxy;
 mapping(address=>bytes32[]) public methods;
 mapping(address=>uint256) public usage;
 ```
One may append this set of mappings and also add reverse lookups to obtain the implementers of a certain voting method with the highest usage etc. The mappings can of course be combined into one mapping to a struct. One should also implement setters and if the values ought to be accessible from other contracts one should implement getters, too. 
```js
function _setIsImplementer(address votingContract, bool _isImplementer) internal {
    isImplementer[votingContract] = _isImplementer;
}

function getIsImplementer(address votingContract) external view returns(bool) {
    return isImplementer[votingContract];
}
```

Resolvers could be administrated by the token-holders of the registrar. To achieve that the resolver needs to know about the registrar. It might have some modifiers in place to allow only tokenholders to make changes to the metadata, depending on the type of metadata of course.

```js
IRegistrar registrar;

function setIsImplementer(address votingContract, bool _isImplementer) external {
    require(registrar.getController(votingContract)==msg.sender);
    _setIsImplementer(votingContract, _isImplementer)
}

```

Certain information ought to stay unaltered and others could be changed only by a community vote. One might for instance allow only the community of token holders to change a certain value. The information of whether the voting contract is a proxy contract is important for users to decide whether they trust it. Setting that value by the entire community increases trust.


## For Developers

Developers may consult the extensive documentation inside the solidity files. Compilation of the contracts is done via the [`solc` package](https://www.npmjs.com/package/solc-js). The following command bundles the compilation up and copies the output into the `compiler-output` folder, which is created if it doesn't exist:
```
npm run compile
``` 

## Contact

Leonhard Horstmeyer <leonhard.horstmeyer@gmail.com> 
