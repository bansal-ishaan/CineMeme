// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Import Chainlink contracts for VRF V2.5
import "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

/**
 * @title CineVault Movie Rental Platform
 * @author [Your Name/Team Name]
 * @notice A full-featured decentralized platform for movie rentals and meme NFTs with playable content via IPFS and a Chainlink VRF-powered spotlight feature.
 */
contract MovieRentalPlatform is VRFConsumerBaseV2Plus {

    // ============ STRUCTS ============

    struct Movie {
        uint256 id;
        address owner;
        string title;
        string genre;
        string description;
        string filmCID;      // ESSENTIAL: The IPFS CID for the full movie file
        string trailerCID;   // For the movie page preview
        string thumbnailCID; // For display cards
        uint256 pricePerDay;
        uint256 rentalCount;
        bool listed;
    }

    struct Rental {
        uint256 rentalId;
        uint256 movieId;
        address renter;
        uint256 rentedAt;
        uint256 expiryTimestamp;
    }

    struct MemeNFT {
        uint256 id;
        address creator;
        string title;
        string imageCID; // Stored on IPFS
        uint256 createdAt;
        bool isSpotlighted;
    }
    
    struct UserProfile {
        string username;
        bool exists;
        bool hasDiscount;
        uint256 discountExpiryTimestamp;
    }
    
    // ============ STATE VARIABLES ============
    
    // Mappings
    mapping(uint256 => Movie) public movies;
    mapping(uint256 => Rental) private _rentals; // Private for controlled access via getter
    mapping(uint256 => MemeNFT) public memes;
    mapping(address => UserProfile) public userProfiles;
    
    mapping(address => uint256[]) public userUploadedMovieIds;
    mapping(address => uint256[]) public userRentalIds;
    mapping(address => uint256[]) public userMemeIds;
    
    // Counters
    uint256 public movieCount;
    uint256 public rentalCount;
    uint256 public memeCount;
    
    // Platform Configuration
    address public platformOwner;
    uint256 public uploadFee;
    uint256 public memeFee;
    uint256 public platformFeePercent = 10; // 10%
    
    // Spotlight Feature
    uint256 public lastSpotlightTimestamp;
    uint256 public spotlightMemeId;
    
    // Chainlink VRF V2.5 variables
    uint256 private s_subscriptionId;
    bytes32 private s_keyHash;
    uint32 private s_callbackGasLimit;
    uint16 private s_requestConfirmations;
    uint32 private s_numWords;
    mapping(uint256 => bool) private s_vrfRequests;
    
    // ============ EVENTS ============
    
    event ProfileCreated(address indexed user, string username);
    event MovieUploaded(uint256 indexed movieId, address indexed owner, string title);
    event MovieRented(uint256 indexed rentalId, uint256 indexed movieId, address indexed user, uint256 expiryTimestamp);
    event MemeMinted(uint256 indexed memeId, address indexed creator, string title);
    event SpotlightWinnerSelected(uint256 indexed memeId, address indexed creator);
    event FeesUpdated(uint256 newUploadFee, uint256 newMemeFee);

    // ============ MODIFIERS ============
    
    modifier onlyPlatformOwner() {
        require(msg.sender == platformOwner, "CineVault: Caller is not the platform owner");
        _;
    }
    
    modifier profileExists() {
        require(userProfiles[msg.sender].exists, "CineVault: User profile does not exist");
        _;
    }
    
    // ============ CONSTRUCTOR ============
    
    constructor(
        uint256 _uploadFee,
        uint256 _memeFee,
        uint256 _subscriptionId,
        address _vrfCoordinator,
        bytes32 _keyHash
    ) VRFConsumerBaseV2Plus(_vrfCoordinator) {
        platformOwner = msg.sender;
        uploadFee = _uploadFee;
        memeFee = _memeFee;
        
        s_subscriptionId = _subscriptionId;
        s_keyHash = _keyHash;
        s_callbackGasLimit = 200000;
        s_requestConfirmations = 3;
        s_numWords = 1;
    }
    
    // ============ USER & MOVIE FUNCTIONS ============

    function createProfile(string memory username) external {
        require(!userProfiles[msg.sender].exists, "CineVault: Profile already exists");
        require(bytes(username).length > 0, "CineVault: Username cannot be empty");
        
        userProfiles[msg.sender] = UserProfile(username, true, false, 0);
        emit ProfileCreated(msg.sender, username);
    }
    
    function uploadMovie(
        string memory title,
        string memory genre,
        string memory description,
        string memory filmCID,
        string memory trailerCID,
        string memory thumbnailCID,
        uint256 pricePerDay
    ) external payable profileExists {
        // Checks
        require(msg.value == uploadFee, "CineVault: Incorrect upload fee provided");
        require(bytes(title).length > 0 && bytes(filmCID).length > 0, "CineVault: Title and Film CID are required");
        require(pricePerDay > 0, "CineVault: Price must be greater than zero");
        
        // Effects
        movieCount++;
        uint256 newMovieId = movieCount;
        
        movies[newMovieId] = Movie(
            newMovieId, msg.sender, title, genre, description,
            filmCID, trailerCID, thumbnailCID,
            pricePerDay, 0, true
        );
        userUploadedMovieIds[msg.sender].push(newMovieId);
        
        emit MovieUploaded(newMovieId, msg.sender, title);
    }
    
    function rentMovie(uint256 movieId, uint256 numDays) external payable {
        // Checks
        require(movieId > 0 && movieId <= movieCount, "CineVault: Invalid movie ID");
        Movie storage movieToRent = movies[movieId];
        require(movieToRent.listed, "CineVault: Movie is not listed for rent");
        require(numDays > 0, "CineVault: Rental must be for at least one day");
        require(msg.sender != movieToRent.owner, "CineVault: Creator cannot rent their own movie");
        
        uint256 totalCost = movieToRent.pricePerDay * numDays;
        
        UserProfile storage renterProfile = userProfiles[msg.sender];
        if (renterProfile.hasDiscount && block.timestamp <= renterProfile.discountExpiryTimestamp) {
            totalCost = (totalCost * 80) / 100; // Apply 20% discount
        }
        
        require(msg.value == totalCost, "CineVault: Incorrect rental price provided");
        
        // Effects
        if (renterProfile.hasDiscount && block.timestamp <= renterProfile.discountExpiryTimestamp) {
            renterProfile.hasDiscount = false; // Consume the discount
        }

        rentalCount++;
        uint256 newRentalId = rentalCount;
        uint256 expiry = block.timestamp + (numDays * 1 days);
        
        _rentals[newRentalId] = Rental(newRentalId, movieId, msg.sender, block.timestamp, expiry);
        userRentalIds[msg.sender].push(newRentalId);
        movieToRent.rentalCount++;
        
        emit MovieRented(newRentalId, movieId, msg.sender, expiry);

        // Interactions (Payment Split)
        uint256 platformFee = (msg.value * platformFeePercent) / 100;
        uint256 ownerShare = msg.value - platformFee;
        
        payable(movieToRent.owner).transfer(ownerShare);
        payable(platformOwner).transfer(platformFee);
    }
    
    // ============ MEME & SPOTLIGHT FUNCTIONS ============
    
    function mintMeme(string memory title, string memory imageCID) external payable profileExists {
        require(msg.value == memeFee, "CineVault: Incorrect meme fee");
        require(bytes(title).length > 0 && bytes(imageCID).length > 0, "CineVault: Title and CID required");
        
        memeCount++;
        uint256 newMemeId = memeCount;
        
        memes[newMemeId] = MemeNFT(newMemeId, msg.sender, title, imageCID, block.timestamp, false);
        userMemeIds[msg.sender].push(newMemeId);
        
        emit MemeMinted(newMemeId, msg.sender, title);
    }
    
    function requestSpotlightWinner() external onlyPlatformOwner returns (uint256 requestId) {
        require(block.timestamp >= lastSpotlightTimestamp + 1 days, "CineVault: Spotlight can be run once daily");
        require(memeCount > 0, "CineVault: No memes have been minted yet");
        
        requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: s_keyHash,
                subId: s_subscriptionId,
                requestConfirmations: s_requestConfirmations,
                callbackGasLimit: s_callbackGasLimit,
                numWords: s_numWords,
                extraArgs: VRFV2PlusClient._argsToBytes(VRFV2PlusClient.ExtraArgsV1({ nativePayment: false }))
            })
        );
        s_vrfRequests[requestId] = true;
        lastSpotlightTimestamp = block.timestamp;
        return requestId;
    }
    
    function fulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) internal override {
        require(s_vrfRequests[requestId], "CineVault: Invalid VRF request");
        delete s_vrfRequests[requestId];
        
        uint256 winningMemeId = (randomWords[0] % memeCount) + 1;
        
        if (spotlightMemeId > 0) {
            memes[spotlightMemeId].isSpotlighted = false;
        }
        
        memes[winningMemeId].isSpotlighted = true;
        spotlightMemeId = winningMemeId;
        
        address winner = memes[winningMemeId].creator;
        userProfiles[winner].hasDiscount = true;
        userProfiles[winner].discountExpiryTimestamp = block.timestamp + 7 days;
        
        emit SpotlightWinnerSelected(winningMemeId, winner);
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @dev Checks if a user has an active (unexpired) rental for a specific movie.
     * Essential for the frontend to determine if the "Watch Now" button should grant access.
     */
    function hasActiveRental(address user, uint256 movieId) external view returns (bool) {
        uint256[] memory rentalIds = userRentalIds[user];
        for(uint i = 0; i < rentalIds.length; i++) {
            Rental storage rental = _rentals[rentalIds[i]];
            if (rental.movieId == movieId && block.timestamp < rental.expiryTimestamp) {
                return true;
            }
        }
        return false;
    }

    function getPaginatedMovies(uint256 cursor, uint256 size) external view returns (Movie[] memory moviesResult, uint256 nextCursor) {
        uint256 length = size;
        if (cursor + size > movieCount) {
            if(movieCount <= cursor) return (new Movie[](0), movieCount);
            length = movieCount - cursor;
        }
        moviesResult = new Movie[](length);
        for (uint i = 0; i < length; i++) {
            moviesResult[i] = movies[cursor + i + 1];
        }
        nextCursor = cursor + length;
        return (moviesResult, nextCursor);
    }
    
    function getUserRentals(address user) external view returns (Rental[] memory) {
        uint256[] memory rentalIds = userRentalIds[user];
        Rental[] memory userHistory = new Rental[](rentalIds.length);
        for (uint i = 0; i < rentalIds.length; i++) {
            userHistory[i] = _rentals[rentalIds[i]];
        }
        return userHistory;
    }
    
    function getSpotlightMeme() external view returns (MemeNFT memory) {
        if (spotlightMemeId > 0) {
            return memes[spotlightMemeId];
        }
        return MemeNFT(0, address(0), "", "", 0, false);
    }

    // ... Other simple view functions can be added as needed (e.g., getMeme, getUserProfile)
    
    // ============ ADMIN FUNCTIONS ============
    
    function setFees(uint256 _uploadFee, uint256 _memeFee) external onlyPlatformOwner {
        uploadFee = _uploadFee;
        memeFee = _memeFee;
        emit FeesUpdated(_uploadFee, _memeFee);
    }
    
    function withdrawBalance() external onlyPlatformOwner {
        (bool success, ) = payable(platformOwner).call{value: address(this).balance}("");
        require(success, "CineVault: Withdrawal failed");
    }
}