// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Dependency: @openzeppelin/contracts 5.0.2
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @notice Fixed initial supply. No function can mint additional tokens.
contract KaboomToken is ERC20, ERC20Burnable {
    address public immutable developmentAndOperationsWallet;
    address public immutable wifeAndIWallet;
    address public immutable strategicPartnershipsWallet;
    address public immutable ecosystemTreasuryWallet;
    address public immutable liquidityReserveWallet;

    constructor(
        address developmentAndOperations,
        address wifeAndI,
        address strategicPartnerships,
        address ecosystemTreasury,
        address liquidityReserve
    ) ERC20("KABOOM", "KABOOM") {
        require(
            developmentAndOperations != address(0) && wifeAndI != address(0)
                && strategicPartnerships != address(0) && ecosystemTreasury != address(0)
                && liquidityReserve != address(0),
            "Zero wallet"
        );
        developmentAndOperationsWallet = developmentAndOperations;
        wifeAndIWallet = wifeAndI;
        strategicPartnershipsWallet = strategicPartnerships;
        ecosystemTreasuryWallet = ecosystemTreasury;
        liquidityReserveWallet = liquidityReserve;

        _mint(developmentAndOperations, 20_000_000 ether);
        _mint(wifeAndI, 20_000_000 ether);
        _mint(strategicPartnerships, 20_000_000 ether);
        _mint(ecosystemTreasury, 120_000_000 ether);
        // Allocation only: adding liquidity requires a separate DEX transaction.
        _mint(liquidityReserve, 820_000_000 ether);
    }
}

/// @notice 1,200 NFTs; each mint burns 50,000 KABOOM and rewards 50,000 KABOOM from a funded budget.
contract AgentX84 is ERC721, Ownable2Step, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant MAX_SUPPLY = 1_200;
    uint256 public constant BURN_PER_NFT = 50_000 ether;
    uint256 public constant REWARD_PER_NFT = 50_000 ether;
    uint256 public constant TOTAL_PER_MINT = BURN_PER_NFT + REWARD_PER_NFT; // 100,000 ether
    uint256 public constant FULL_COLLECTION_BUDGET = MAX_SUPPLY * TOTAL_PER_MINT; // 120,000,000 ether

    KaboomToken public immutable kaboom;
    address public immutable developmentAndOperationsWallet;
    uint256 public nftMintPrice = 500_000 ether;
    uint256 public totalMinted;
    uint256 public totalBurned;
    uint256 public totalRewarded;
    string private _metadataBaseURI;

    event EcosystemBudgetFunded(address indexed funder, uint256 amount);
    event AgentMinted(address indexed recipient, uint256 indexed tokenId, uint256 price);
    event MintBurnExecuted(uint256 indexed tokenId, uint256 amount);
    event MintRewardExecuted(uint256 indexed tokenId, address indexed recipient, uint256 amount);
    event MintPriceUpdated(uint256 previousPrice, uint256 newPrice);
    event BaseURIUpdated(string newBaseURI);

    constructor(KaboomToken token, address initialOwner, string memory metadataBaseURI)
        ERC721("Agent X-84", "X84")
        Ownable(initialOwner)
    {
        require(address(token).code.length > 0, "Invalid token");
        kaboom = token;
        developmentAndOperationsWallet = token.developmentAndOperationsWallet();
        _metadataBaseURI = metadataBaseURI;
    }

    /// @notice Approve this contract on KABOOM first to fund the 120M vault budget.
    function fundEcosystemBudget(uint256 amount) external nonReentrant {
        require(amount > 0, "Zero funding");
        uint256 remaining = FULL_COLLECTION_BUDGET - (totalBurned + totalRewarded);
        uint256 balance = kaboom.balanceOf(address(this));
        require(balance < remaining && amount <= remaining - balance, "Excess funding");
        IERC20(address(kaboom)).safeTransferFrom(msg.sender, address(this), amount);
        emit EcosystemBudgetFunded(msg.sender, amount);
    }

    function availableBudget() external view returns (uint256) {
        return kaboom.balanceOf(address(this));
    }

    /// @notice IDs are 1 through 1,200. Approve nftMintPrice before minting.
    /// @dev Mint payment goes to Development & Operations; vault contract burns 50k and rewards minter 50k.
    function mintWithKaboom() external nonReentrant returns (uint256 tokenId) {
        require(totalMinted < MAX_SUPPLY, "Sold out");
        require(kaboom.balanceOf(address(this)) >= TOTAL_PER_MINT, "Vault budget insufficient");
        
        tokenId = ++totalMinted;
        uint256 price = nftMintPrice;
        
        totalBurned += BURN_PER_NFT;
        totalRewarded += REWARD_PER_NFT;

        // 1. User pays mint price to Development & Operations wallet
        IERC20(address(kaboom)).safeTransferFrom(msg.sender, developmentAndOperationsWallet, price);
        
        // 2. Permanently burn 50,000 KABOOM from the vault contract
        kaboom.burn(BURN_PER_NFT);
        
        // 3. Reward 50,000 KABOOM back to the minter from the vault contract
        IERC20(address(kaboom)).safeTransfer(msg.sender, REWARD_PER_NFT);
        
        emit MintBurnExecuted(tokenId, BURN_PER_NFT);
        emit MintRewardExecuted(tokenId, msg.sender, REWARD_PER_NFT);
        emit AgentMinted(msg.sender, tokenId, price);
        
        _safeMint(msg.sender, tokenId);
    }

    /// @notice Whole tokens: pass 500000 for 500,000 KABOOM.
    function setNftMintPrice(uint256 newPriceInWholeTokens) external onlyOwner {
        require(newPriceInWholeTokens > 0, "Zero mint price");
        uint256 newPrice = newPriceInWholeTokens * 1 ether;
        emit MintPriceUpdated(nftMintPrice, newPrice);
        nftMintPrice = newPrice;
    }

    /// @notice Owner-editable metadata. Use a base URI ending in '/'.
    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        _metadataBaseURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    function _baseURI() internal view override returns (string memory) {
        return _metadataBaseURI;
    }
}