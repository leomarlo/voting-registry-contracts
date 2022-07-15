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

The start function should create a new voting instance. Two arguments should be passed to it, namely `bytes memory votingParams` and `bytes calldata callback`. The `uint256 identifier` of the instance should be returned:
```js
function start(bytes memory votingParams, bytes calldata callback) external returns(uint256 identifier); 
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

This standard is really meant for voting with on-chain consequences, but it can also be used like snapshot. The `implement` function executes the `bytes calldata callback` directly on the calling contract. As arguments it takes the `uint256 identifier` and the `bytes calldata callback`. It returns a response that can be either `successful` or `unsuccessful`. Calls that have not yet been made get the state `precall`.

```js
enum Response {precall, successful, failed}

function implement(uint256 identifier, bytes calldata callback) external returns(Response response); 
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
1. A security layer that (dis-)allows certain function selectors and voting contracts.
2. An interface that connects to the voting contract

### 1. Function Selectors and Imposter Voting Contracts

One `SHOULD` add another layer of control and security by providing guards against undesired external calls and by specifying which functions may be acted upon through a vote in the first place, in particular from which voting contract. 

To mitigate undesired calls the developer `SHOULD` implement a function that checks whether the alleged voting contract is allowed to call the function with selector `msg.sig`. In other words one needs to check whether the calling address `msg.sender` is approved.
```js
function _isImplementer() internal returns(bool);
```
This could then also be wrapped into a customized `modifier` that reverts the call when it is not originating from an approved address or has some other customized rights that allows a call. 

It is `RECOMMENDED` to create a mapping from the `bytes4` function selector to the `address` of the assigned voting contract. Approval would need to be handled through the implementing contract's internal logic. The mapping could be called:

```js
mapping(bytes4=>address) assignedContract; 
```
When starting a new voting instance with `bytes votingParams` and `bytes callback`, the voting contract is already specified via `assignedContract[bytes4(callback[0:4])]`. This mapping could then also be used to define
```js
function _isImplementer() internal view returns(bool) {
    return assignedContract[msg.sig]==msg.sender;
}
``` 
To prevent votes to affect sensitive external functions one can check whether the function selector of the callback data has an assigned voting contract:

```js
function _isVotableFunction(bytes4 selector) internal view returns(bool votable){
        return assignedContract[selector]!=address(0);
    }
```
Typically before starting a new instance one shoud check whether the first four bytes of the callback point to a votable function. If that is not the case a revert message `CAN` be implemented. 

In general the `assignedContract`-mapping gives a high degree of control. In a hypothetical scenario one could use for example a `simple token-weighted majority` for a function `foo` that decides how to allocate funds and for example an `m-out-of-n` for a function `bar` that changes a contract-specific role.

### 2. Interface for the Voting Contract 

The interface `SHOULD` contain a `start` function, `MAY` contain a `vote` function and `MAY` contain an `implement` function.  The `start` function calls the standardized start function of a voting contract under the hood and uses customized logic for its return value, the *identifier* of the voting instance so that the *caller* can point to the instance and may track its journey as votes are coming in.

```js
function start(bytes memory votingParams, bytes calldata callback) external;
```

The suggested pattern for this function is to first check whether the callback data is secure and then to call the voting contract's start function. If this framework is used as a substitute for snapshot to record votes on the chain without triggering on-chain consequences, then empty calldata can be passed and there is no need to check whether a votable function is targeted. Otherwise one may use the security pattern to check whether the selector of the callback data has an assigned voting contract, e.g. `_isVotableFunction(bytes4(callback[0:4]))`. One may integrate snapshot-type votes or votes with on-chain consequences or both, all in one calling contract. In case that all voting instances are supposed to trigger function calls, then it is recommended to recover the voting contracts from the `assignedContract` mapping discussed in the security pattern. In case only snapshot-type votes are cast without on-chain consequences -- it would be a bit of an anti-pattern but nevertheless possible -- then it might make sense to just store the address of the voting contract in a state variable. In either case one can call the voting contract's start function like so:

```js
function start(bytes memory votingParams, bytes calldata callback) external{
    // security guards and custom logic
    uint256 newIdentifier = IVotingContract(votingContract).start(votingParams, callback);
    // custom logic with identifier
}
```

The new voting instance can be uniquely identified through the address of the voting contract and its identifier. There are now two options of how to proceed:
1. Cast votes on the voting contract.
2. Cast votes on the calling contract. 

If the voting contract is the place where votes are cast and potentially implemented depending on the developers' choice, then there are no more functions that are required for the interface. In that case the calling contract needs to somehow make the identifier and voting contract's address publicly accessible either through a public state variable or by reference to an emitted event. The voting contract should ideally emit one, but it's not set in the standard. We maintain one integration with this pattern.

If the calling contract is the place where votes are cast and potentially implemented depending on the developers'choice, then one requires at least a `vote` function. It allows users not only to call the voting contract's vote function but also to execute custom logic. The *status* of the voting instance is returned and can also be subjected to customized logic on the caller contract. One could for for instance immediately implement the outcome of the vote when the returned status is *complete* or *awaitcall*. In this case it would be helpful to have the value of the callback data stored in cache and trigger an implement routine that is either intrinsic to the caller contract or the one on the voting contract, if it exists. The instance needs to be uniquely defined throught an *identifier*, which must be able to disambiguate between voting instances from different voting contracts and may thus not be the same as the one issued by the voting contract for that instance. The recommended interface is:

```js
function vote(uint256 identifier, bytes memory votingData) external;
```

We maintain five integration patterns that use the vote interface. The first one is intended for a snapshot-like scenario, where a globally stored voting contract is used (one to rule them all) and the identifier coincides with that instance's identifier on that voting contract. A second and third one call the vote function, but also implement the outcome depending on its returned status flag. In one case it's implemented in the caller, in the other it calls the implement function of the voting contract. The fourth and fifth ones only calls vote function and instead of implementing the outcome directly, they have separate `implement` functions that respectively implement in the caller or call the voting contract's implement function:

```js
function implement(uint256 identifier, bytes calldata callback) external;
```

These five patterns come in a minimal version, which just implements the basic functionality and a swiss-army knife version with hooks. Users may come up with their own integration and are encouraged to draw inspiration from these integration patterns or mix-n-match. 


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

### Integration

If you would like to integrate with the voting contract or the registry please import the package `@leomarlo/voting-registry-contracts` via your preferred package manager.

### Testing

Developers may consult the extensive documentation inside the solidity files. Compilation of the contracts is done via the [`solc` package](https://www.npmjs.com/package/solc-js). The following command bundles the compilation up and copies the output into the `compiler-output` folder, which is created if it doesn't exist:
```
npm run compile
``` 


## Contact

Leonhard Horstmeyer <leonhard.horstmeyer@gmail.com> 
