// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

import {IVotingRegistry} from "../../registration/registry/IVotingRegistry.sol";
import {IGetDeadline} from "../../extensions/interfaces/IGetDeadline.sol";
import {IGetQuorum} from "../../extensions/interfaces/IGetQuorum.sol";
import {IGetToken} from "../../extensions/interfaces/IGetToken.sol";

import {HandleDoubleVotingGuard} from "../../extensions/primitives/NoDoubleVoting.sol";
import {IGetDoubleVotingGuard} from "../../extensions/interfaces/IGetDoubleVotingGuard.sol";


// import {Deployer} from "../../registration/registrar/Deployer.sol";
import {StartVoteAndImplementHybridVotingImplRemoteHooks} from "../../integration/abstracts/StartVoteAndImplementRemote.sol";
import {
    OnlyVoteImplementer,
    AssignedContractPrimitive,
    SecurityThroughAssignmentPrimitive
} from "../../integration/primitives/AssignedContractPrimitive.sol";


error NotApprovedContract(address sender);
error TransferNotAllowed(uint256 tokenId);
error OnlyMotherContract(address sender, address _motherContract);
error BadgeDoesntExist(uint256 mainBadge, uint256 numberOfBadges);

abstract contract CalculateId {
    function calculateId(uint256 index, bytes4 selector, address votingContract) public pure returns (uint256) {
        return uint256(bytes32(abi.encodePacked(
            uint64(bytes8(bytes32(index) << 192)),
            selector,
            bytes20(votingContract))));
    }
}

contract PlaygroundVotingBadge is 
CalculateId, ERC721 {

    mapping(address=>bool) public isApprovedContract;
    mapping(address=>bool) public tradingEnabled;
    address public motherContract;
    uint256 public enableTradingThreshold;
    bool public tradingEnabledGlobally;

    mapping(address=>mapping(bytes4=>uint256)) private _balanceOfSignature;

    // e.g. name and symbol = "Playground Voting Badge", "VOT"
    constructor(string memory name, string memory symbol) ERC721(name, symbol){
        motherContract = msg.sender;
        isApprovedContract[msg.sender] = true;
    }

    function balanceOfSignature(address owner, bytes4 selector) public returns(uint256) {
        _balanceOfSignature[owner][selector];
    } 


    // minting can only happen through approved contracts
    function mint(address to, uint256 index, bytes4 selector, address votingContract) 
    external 
    onlyApprovedContract
    {

        _mint(to, calculateId(index, selector, votingContract));
        
    }

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721) {
        bytes4 selector = bytes4(bytes32(tokenId) << 64);
        if (from==address(0)){
            // minting
            _balanceOfSignature[to][selector] += 1;
        } else {
            // burning or transfer
            uint addAmount = (to==address(0)) ? 0 : 1;
            _balanceOfSignature[to][selector] += addAmount;
            _balanceOfSignature[from][selector] -= 1;
        }
    }
    

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721) {
        if(from!=address(0) && to!=address(0) && !_transferAllowed(tokenId)){
            revert TransferNotAllowed(tokenId);
        }
    }


    function _transferAllowed(uint256 tokenId) internal returns(bool){
        // you need to have at least a certain amount of voting badges
        // transferral must be enabled
        uint256 balance =  balanceOf(ownerOf(tokenId));
        if (!tradingEnabled[msg.sender] && balance >= enableTradingThreshold){
            tradingEnabled[msg.sender] = true;
        }

        return tradingEnabled[msg.sender] && tradingEnabledGlobally;
    }

    
    function changeEnableTradingThreshold(uint256 newThreshold) 
    external 
    onlyByCallFromMotherContract
    returns(bool)
    {
        enableTradingThreshold = newThreshold;
    }

    function changeTradingEnabledGlobally(bool enable)
    external
    onlyByCallFromMotherContract
    returns(bool)
    {
        tradingEnabledGlobally = enable;
    }

    function approveContract(address newContract, bool approval) 
    external
    onlyByCallFromMotherContract 
    returns(bool)
    {
        isApprovedContract[newContract] = approval;
    }

    
    modifier onlyByCallFromMotherContract {
        if(msg.sender!=motherContract) {
            revert OnlyMotherContract(msg.sender, motherContract);
        }
        _;
    }


    modifier onlyApprovedContract {
        if(!isApprovedContract[msg.sender]) {
            revert NotApprovedContract(msg.sender);
        }
        _;
    }
}


interface IPlaygroundVotingBadge is IERC721{
    function mint(address to, uint256 index, bytes4 selector, address votingContract) external; 
    function balanceOfSignature(address owner, bytes4 selector) external returns(uint256);
    function changeEnableTradingThreshold(uint256 newThreshold) external;
    function changeTradingEnabledGlobally(bool enable) external;
    function approveContract(address newContract, bool approval) external returns(bool);
}

struct VotingMetaParams {
    uint256 minDuration;
    uint256 minQuorumInPercentmille;
    address token;
}

struct Analytics {
        uint256 numberOfInstances;
        uint256 numberOfVotes;
        uint256 numberOfImplementations;
        uint24 numberOfSimpleVotingContracts;
    }

struct Counter {
    uint256 counter;
    Operation operation;
}

struct DeploymentHelpers {
    address deployer;
    uint8 oneExtraTransaction;
}

struct NFTsAndBadgesInfo {
    uint256 mainBadge;
    bool acceptingNFTs;
}

enum Operation {add, subtract, divide, multiply, modulo, exponentiate}
enum ApprovalTypes {limitedApproval, unapproveAll, approveAll}

contract VotingPlayground is 
AssignedContractPrimitive,
SecurityThroughAssignmentPrimitive,
CalculateId,
StartVoteAndImplementHybridVotingImplRemoteHooks {

    // Badges and contracts
    IPlaygroundVotingBadge[] public badges;
    address[] public deployedContracts;

    // Meta Parameters for Voting
    uint256 public minXpToStartAnything; // Experience RequiredForStart
    mapping(bytes4=>uint256) public minXpToStartThisFunction;
    NFTsAndBadgesInfo public nftAndBadgesInfo;

    // Change the Counter
    Counter public counter;

    struct Incumbent {
        address incumbent;
        uint256 indexPlusOne;
    }
    // Change people
    string[] public offices;
    mapping(string=>Incumbent) internal _incumbents;
    mapping(address=>uint256) internal _numberOfOffices;
    mapping(uint256=>bytes4) internal _selectorOfThisVote;

    mapping(string=>uint256) public _rolesIndexPlusOne;
    mapping(bytes4=>VotingMetaParams) public votingMetaParams;
    address public deployer;
    IVotingRegistry public immutable VOTING_CONTRACT_REGISTRY;
    mapping(address=>uint256) public donationsBy;
    Analytics public analytics;
    mapping(uint24=>address) public simpleVotingContract;
    mapping(bytes4=>bool) public fixedVotingContract;
    // setting parameters



    constructor(
        address votingContractRegistry,
        bytes5[] memory flagAndSelectors,
        address[] memory votingContracts,
        uint256[] memory minDurations,
        uint256[] memory minQuorumInPercentmilles,
        bool[] memory badgeWeightedVote,
        bytes32 badgeSalt,
        bytes memory badgeBytecode
        )
    {
        // set deployer
        deployer = msg.sender;
        // set the registry;
        VOTING_CONTRACT_REGISTRY = IVotingRegistry(votingContractRegistry);
        // set a few voting contracts
        // assign the voting contract the increment function.
        address badgeToken = _deployNewBadge(badgeSalt, badgeBytecode, msg.sender) ;
        for (uint8 j; j<votingContracts.length; j++){
            bytes4 selector = bytes4(flagAndSelectors[j] << 8);
            fixedVotingContract[selector] = bytes1(flagAndSelectors[j])!=bytes1(0x00);
            votingMetaParams[selector] = VotingMetaParams({
                minDuration: minDurations[j],
                minQuorumInPercentmille: minQuorumInPercentmilles[j],
                token: badgeWeightedVote[j] ? badgeToken : address(0)
            });
            assignedContract[selector] = votingContracts[j];
        }
    }

    function addSimpleVotingContract(address votingContract) external {
        // check whether it is Registered
        require(VOTING_CONTRACT_REGISTRY.isRegistered(votingContract));
        simpleVotingContract[uint24(analytics.numberOfSimpleVotingContracts)] = votingContract;
        analytics.numberOfSimpleVotingContracts += 1;
    }

    // change the contract for certain functions
    function changeAssignedContract(bytes4 selector, address newVotingContract) 
    external 
    OnlyByVote
    {
        // check whether it is Registered
        require(VOTING_CONTRACT_REGISTRY.isRegistered(newVotingContract));
        require(!fixedVotingContract[selector]);
        assignedContract[selector] = newVotingContract;
    }


    // change the metaParameters for those functions
    function changeMetaParameters(
        bytes4 selector,
        uint256 minDuration,
        uint256 minQuorumInPercentmille,
        address token
    )
    external
    OnlyByVote
    {
        require(!fixedVotingContract[selector]);
        votingMetaParams[selector] = VotingMetaParams({
            minDuration: minDuration,
            minQuorumInPercentmille: minQuorumInPercentmille,
            token: token
        });
    }
        

    //////////////////////////////////////////////
    // PARAMETER SETTINGS                       //
    //////////////////////////////////////////////

    function setMainBadge(uint256 newMainBadge) 
    external 
    OnlyByVote
    {
        if(newMainBadge>=badges.length) revert BadgeDoesntExist(newMainBadge, badges.length);
        nftAndBadgesInfo.mainBadge = newMainBadge;
    }

    function setMinXpToStartAnything(uint256 newXP) external
    OnlyByVote
    {
        require(newXP>0, "Needs to be at least 1");
        minXpToStartAnything = newXP;
    }

    function setMinXpToStartThisFunction(bytes4 selector, uint256 newXP) external
    OnlyByVote
    {
        minXpToStartThisFunction[selector] = newXP;
    }

    function setEnableTradingThreshold(uint256 newThreshold)
    external 
    OnlyByVote
    {
        badges[nftAndBadgesInfo.mainBadge].changeEnableTradingThreshold(newThreshold);
    }

    function setTradingEnabledGlobally(bool enable)
    external 
    OnlyByVote
    {
        badges[nftAndBadgesInfo.mainBadge].changeTradingEnabledGlobally(enable);
    }

    function setAcceptingNFTs(bool accept) 
    external 
    OnlyByVote
    {
        nftAndBadgesInfo.acceptingNFTs = accept;
    }

    

    //////////////////////////////////////////////
    // DO INTERACTIVE STUFF                     //
    //////////////////////////////////////////////

    function changeCounter(uint256 by) 
    external 
    OnlyByVote
    {
        if (counter.operation==Operation.add){
            counter.counter += by;
        } else if (counter.operation==Operation.subtract) {
            counter.counter -= by;
        } else if (counter.operation==Operation.multiply) {
            counter.counter *= by;
        } else if (counter.operation==Operation.divide) {
            counter.counter = counter.counter / by;
        } else if (counter.operation==Operation.modulo) {
            counter.counter = counter.counter % by;
        } else if (counter.operation==Operation.exponentiate) {
            counter.counter = counter.counter ** by;
        } 
        
    }

    function changeOperation(Operation newOperation)
    external
    OnlyByVote
    {
        counter.operation = newOperation;
    }

    function changeIncumbent(string memory office, address newIncumbent)
    external
    OnlyByVote 
    {
        // no empty incumbents
        require(newIncumbent!=address(0));
        // check whether we should add a new office
        if (_incumbents[office].indexPlusOne==0){
            offices.push(office);
            _incumbents[office].indexPlusOne = offices.length;
        } else {
            _numberOfOffices[_incumbents[office].incumbent] -= 1;
        }
        // set the new _incumbents and office
        _incumbents[office].incumbent = newIncumbent;
        _numberOfOffices[newIncumbent] += 1;
    }

    function getIncumbentFromOffice(string memory office) external view returns(address incumbent) {
        incumbent = _incumbents[office].incumbent;
    }

    function getOfficesFromAddress(address incumbent) external view returns(string[] memory _offices) {
        uint256 j;
        for(uint256 i=0; i<offices.length; i++){
            if (_incumbents[offices[i]].incumbent == incumbent){
                _offices[j] = offices[i];
                j += 1;
            }
        }
    }

    //////////////////////////////////////////////
    // CREATE CONTRACTS                         //
    //////////////////////////////////////////////

    function deployNewBadge(bytes32 salt, bytes memory bytecode, address badger) 
    external
    OnlyByVote
    returns(address deployedContract){
        deployedContract = _deployNewBadge(salt, bytecode, badger);
    }

    function _deployNewBadge(bytes32 salt, bytes memory bytecode, address badger) 
    internal returns(address deployedContract)
    {
        deployedContract = _deployContract(salt, bytecode);
        IPlaygroundVotingBadge newBadge = IPlaygroundVotingBadge(deployedContract);
        badges.push(newBadge);
        // mint one badge to initiator;
        newBadge.mint(
            badger,
            0,
            msg.sig,
            msg.sender);
    }




    function deployNewContract(bytes32 salt, bytes memory bytecode) 
    external
    OnlyByVote 
    returns(address deployedContract){
        deployedContract = _deployContract(salt, bytecode);
        deployedContracts.push(deployedContract);
    }



    //////////////////////////////////////////////
    // SENDING THINGS                           //
    //////////////////////////////////////////////

    function sendNFT(address token, address to, uint256 tokenId) 
    external 
    OnlyByVote
    {
        IERC721(token).safeTransferFrom(address(this), to, tokenId);
    }

    function sendERC20Token(address token, address to, uint256 amount) 
    external 
    OnlyByVote
    {
        IERC20(token).transfer(to, amount);
    }

    function approveNFT(address token, address spender, uint256 tokenId, ApprovalTypes approvalType)
    external 
    OnlyByVote
    {
        // check whether NFT or ERC20
        
        (approvalType==ApprovalTypes.limitedApproval)?
        IERC721(token).approve(spender, tokenId):
        IERC721(token).setApprovalForAll(spender, approvalType==ApprovalTypes.approveAll);
    }


    function approveERC20Token(address token, address spender, uint256 amount)
    external 
    OnlyByVote
    {
        IERC20(token).approve(spender, amount);
    }

    function wildCard(address contractAddress, bytes calldata data, uint256 value) 
    external 
    OnlyByVote
    {
        require(address(this).balance>=value, "not enough funds");
        (bool success, bytes memory response) = contractAddress.call{value: value}(data);
        require(success, "not successful");
    }

    //////////////////////////////////////////////
    // HELPER FUNCTIONS                         //
    //////////////////////////////////////////////

    function _deployContract(bytes32 salt, bytes memory bytecode) internal returns(address deployedContract) {
        assembly {
            deployedContract := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
        }
    }
    

    function _beforeStart(bytes memory votingParams, bytes calldata callback) internal view
    override(StartVoteAndImplementHybridVotingImplRemoteHooks) 
    {
        uint256 callSpecificXp = (callback.length>=4) ? minXpToStartThisFunction[bytes4(callback[0:4])] : 0;
        uint256 balance = badges[nftAndBadgesInfo.mainBadge].balanceOf(msg.sender);
        // Only allow to start a vote when you have at least one badge
        require(
            balance >= minXpToStartAnything && balance >= callSpecificXp,
            "Not enough badges");
    }

    function _afterStart(uint256 identifier, bytes memory votingParams, bytes calldata callback)
    internal override(StartVoteAndImplementHybridVotingImplRemoteHooks)
    {
        // check whether conditions are met
        uint256 index = instances[identifier].identifier;
        address votingContract = instances[identifier].votingContract;
        if (callback.length>=4){
            bytes4 selector = bytes4(callback[0:4]);
            // set the selector of this voting instance. If there there is none, then it's just bytes4(0)
            _selectorOfThisVote[identifier] = selector;
            // check whether specs are met
            bool goodSpecs = true;
            bool success;
            bytes memory response;
            if (votingMetaParams[selector].minDuration!=0){
                (success, response) = votingContract.call(abi.encodeWithSelector(IGetDeadline.getDeadline.selector, index));
                if (success) goodSpecs = goodSpecs && votingMetaParams[selector].minDuration + block.timestamp <= abi.decode(response, (uint256));
            }    
            if (votingMetaParams[selector].token!=address(0)){
                (success, response) = votingContract.call(abi.encodeWithSelector(IGetToken.getToken.selector, index));
                if (success) goodSpecs = goodSpecs && abi.decode(response, (address)) == votingMetaParams[selector].token;
            }
            if (votingMetaParams[selector].minQuorumInPercentmille!=0){
                (success, response) = votingContract.call(abi.encodeWithSelector(IGetQuorum.getQuorum.selector, index));
                (uint256 _quorum, uint256 inUnitsOf) = abi.decode(response, (uint256, uint256));
                // when inUnitsOf is zero (i.e. the quorum is measured in absolute terms, then the condition is true irrespective of what _quroum is).
                goodSpecs = goodSpecs && (votingMetaParams[selector].minQuorumInPercentmille * inUnitsOf) <= (_quorum * 1e5);                
            }
            require(goodSpecs, "Invalid Parameters");
        }
        
        badges[nftAndBadgesInfo.mainBadge].mint(
            msg.sender,
            index,
            msg.sig,
            votingContract);

        analytics.numberOfInstances += 1;
    }

    function _beforeVote(uint256 identifier, bytes calldata votingData) 
    internal override(StartVoteAndImplementHybridVotingImplRemoteHooks)
    {
        // if the voting instance requires the voter to be an incumbent of an office, then we should check here
        bytes4 selector = _selectorOfThisVote[identifier];
        if(selector!=bytes4(0) && votingMetaParams[selector].token==address(0)){
            require(_numberOfOffices[msg.sender]>0);
        }
        uint256 index = instances[identifier].identifier;
        address votingContract = instances[identifier].votingContract;
        if (badges[nftAndBadgesInfo.mainBadge].ownerOf(calculateId(index, msg.sig, votingContract))==address(0)){
            // e.g. in tournament this might be interesting
            badges[nftAndBadgesInfo.mainBadge].mint(
                msg.sender,
                index,
                msg.sig,
                votingContract);
        }
    }

    function _afterVote(uint256 identifier, uint256 status, bytes calldata votingData) 
    internal override(StartVoteAndImplementHybridVotingImplRemoteHooks) 
    {
        analytics.numberOfVotes += 1;
    }



    function _beforeImplement(uint256 identifier) 
    internal override(StartVoteAndImplementHybridVotingImplRemoteHooks)
    {
        badges[nftAndBadgesInfo.mainBadge].mint(
                msg.sender,
                instances[identifier].identifier,
                msg.sig,
                instances[identifier].votingContract);

        analytics.numberOfImplementations += 1;
    }

    function _modifyVotingData(uint256 identifier, bytes calldata votingData) virtual internal 
    override(StartVoteAndImplementHybridVotingImplRemoteHooks)
    returns(bytes memory newVotingData)
    { 
        (bool success, bytes memory response) = instances[identifier].votingContract.call(abi.encodeWithSelector(
            IGetDoubleVotingGuard.getDoubleVotingGuard.selector,
            instances[identifier].identifier));
        if (success){
            bool onVotingDataCondition = abi.decode(response, (HandleDoubleVotingGuard.VotingGuard)) == HandleDoubleVotingGuard.VotingGuard.onVotingData;
            if (onVotingDataCondition) return abi.encodePacked(msg.sender, votingData);
        }
        return votingData;
        
    }


    receive() external payable {
        donationsBy[msg.sender] += msg.value;
    }


    // interface IERC721Receiver {
    /**
     * @dev Whenever an {IERC721} `tokenId` token is transferred to this contract via {IERC721-safeTransferFrom}
     * by `operator` from `from`, this function is called.
     *
     * It must return its Solidity selector to confirm the token transfer.
     * If any other value is returned or the interface is not implemented by the recipient, the transfer will be reverted.
     *
     * The selector can be obtained in Solidity with `IERC721Receiver.onERC721Received.selector`.
     */
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external returns (bytes4) {

        return nftAndBadgesInfo.acceptingNFTs ? msg.sig: bytes4(0);
    }


    
    modifier OnlyByVote {
        if(!_isImplementer()) revert OnlyVoteImplementer(msg.sender);
        _;
    }



    
    
}