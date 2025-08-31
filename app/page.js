// app/page.jsx
"use client";

import { useState, useEffect, useMemo, use } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useContractRead, useWriteContract, useWaitForTransactionReceipt, useReadContracts, useBalance } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import axios from 'axios';

export const contractABI = [
	{
		"inputs": [],
		"name": "acceptOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "username",
				"type": "string"
			}
		],
		"name": "createProfile",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "title",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "imageCID",
				"type": "string"
			}
		],
		"name": "mintMeme",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_uploadFee",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_memeFee",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_subscriptionId",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "_vrfCoordinator",
				"type": "address"
			},
			{
				"internalType": "bytes32",
				"name": "_keyHash",
				"type": "bytes32"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "have",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "want",
				"type": "address"
			}
		],
		"name": "OnlyCoordinatorCanFulfill",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "have",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "coordinator",
				"type": "address"
			}
		],
		"name": "OnlyOwnerOrCoordinator",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "ZeroAddress",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "address",
				"name": "vrfCoordinator",
				"type": "address"
			}
		],
		"name": "CoordinatorSet",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "newUploadFee",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "newMemeFee",
				"type": "uint256"
			}
		],
		"name": "FeesUpdated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "memeId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "creator",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "title",
				"type": "string"
			}
		],
		"name": "MemeMinted",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "rentalId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "movieId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "expiryTimestamp",
				"type": "uint256"
			}
		],
		"name": "MovieRented",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "movieId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "title",
				"type": "string"
			}
		],
		"name": "MovieUploaded",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "to",
				"type": "address"
			}
		],
		"name": "OwnershipTransferRequested",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "to",
				"type": "address"
			}
		],
		"name": "OwnershipTransferred",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "username",
				"type": "string"
			}
		],
		"name": "ProfileCreated",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "requestId",
				"type": "uint256"
			},
			{
				"internalType": "uint256[]",
				"name": "randomWords",
				"type": "uint256[]"
			}
		],
		"name": "rawFulfillRandomWords",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "movieId",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "numDays",
				"type": "uint256"
			}
		],
		"name": "rentMovie",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "requestSpotlightWinner",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "requestId",
				"type": "uint256"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_vrfCoordinator",
				"type": "address"
			}
		],
		"name": "setCoordinator",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_uploadFee",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_memeFee",
				"type": "uint256"
			}
		],
		"name": "setFees",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "memeId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "creator",
				"type": "address"
			}
		],
		"name": "SpotlightWinnerSelected",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			}
		],
		"name": "transferOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "title",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "genre",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "description",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "filmCID",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "trailerCID",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "thumbnailCID",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "pricePerDay",
				"type": "uint256"
			}
		],
		"name": "uploadMovie",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "withdrawBalance",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "cursor",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "size",
				"type": "uint256"
			}
		],
		"name": "getPaginatedMovies",
		"outputs": [
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "id",
						"type": "uint256"
					},
					{
						"internalType": "address",
						"name": "owner",
						"type": "address"
					},
					{
						"internalType": "string",
						"name": "title",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "genre",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "description",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "filmCID",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "trailerCID",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "thumbnailCID",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "pricePerDay",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "rentalCount",
						"type": "uint256"
					},
					{
						"internalType": "bool",
						"name": "listed",
						"type": "bool"
					}
				],
				"internalType": "struct MovieRentalPlatform.Movie[]",
				"name": "moviesResult",
				"type": "tuple[]"
			},
			{
				"internalType": "uint256",
				"name": "nextCursor",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getSpotlightMeme",
		"outputs": [
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "id",
						"type": "uint256"
					},
					{
						"internalType": "address",
						"name": "creator",
						"type": "address"
					},
					{
						"internalType": "string",
						"name": "title",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "imageCID",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "createdAt",
						"type": "uint256"
					},
					{
						"internalType": "bool",
						"name": "isSpotlighted",
						"type": "bool"
					}
				],
				"internalType": "struct MovieRentalPlatform.MemeNFT",
				"name": "",
				"type": "tuple"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "user",
				"type": "address"
			}
		],
		"name": "getUserRentals",
		"outputs": [
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "rentalId",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "movieId",
						"type": "uint256"
					},
					{
						"internalType": "address",
						"name": "renter",
						"type": "address"
					},
					{
						"internalType": "uint256",
						"name": "rentedAt",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "expiryTimestamp",
						"type": "uint256"
					}
				],
				"internalType": "struct MovieRentalPlatform.Rental[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "movieId",
				"type": "uint256"
			}
		],
		"name": "hasActiveRental",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "lastSpotlightTimestamp",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "memeCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "memeFee",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "memes",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "creator",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "title",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "imageCID",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "createdAt",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "isSpotlighted",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "movieCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "movies",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "title",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "genre",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "description",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "filmCID",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "trailerCID",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "thumbnailCID",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "pricePerDay",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "rentalCount",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "listed",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "platformFeePercent",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "platformOwner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "rentalCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "s_vrfCoordinator",
		"outputs": [
			{
				"internalType": "contract IVRFCoordinatorV2Plus",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "spotlightMemeId",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "uploadFee",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "userMemeIds",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "userProfiles",
		"outputs": [
			{
				"internalType": "string",
				"name": "username",
				"type": "string"
			},
			{
				"internalType": "bool",
				"name": "exists",
				"type": "bool"
			},
			{
				"internalType": "bool",
				"name": "hasDiscount",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "discountExpiryTimestamp",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "userRentalIds",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "userUploadedMovieIds",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]
// =================================================================================================
// MAIN CONFIGURATION
// =================================================================================================
const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const pinataApiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
const pinataApiSecret = process.env.NEXT_PUBLIC_PINATA_API_SECRET;
const pinataGateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY;

// =================================================================================================
// ROOT APPLICATION COMPONENT
// =================================================================================================
export default function CineVaultApp() {
    const { address, isConnected } = useAccount();
    const [activeTab, setActiveTab] = useState('home');
    const [userProfile, setUserProfile] = useState(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [viewingMovie, setViewingMovie] = useState(null); // New state for detailed movie view

    // Read platform owner to conditionally show Admin tab
    const { data: platformOwner } = useContractRead({ address: contractAddress, abi: contractABI, functionName: 'platformOwner' });
    const isAdmin = isConnected && address === platformOwner;

    // Fetch user profile data
    const { data: profileData, refetch: refetchUserProfile } = useContractRead({ address: contractAddress, abi: contractABI, functionName: 'userProfiles', args: [address], enabled: isConnected });

    useEffect(() => {
        if (isConnected && profileData) {
            if (profileData[1]) {
                setUserProfile({ username: profileData[0], exists: profileData[1], hasDiscount: profileData[2], discountExpiryTimestamp: Number(profileData[3]) });
            } else {
                setUserProfile(null);
            }
        } else {
            setUserProfile(null);
        }
        setIsLoadingProfile(false);
    }, [isConnected, address, profileData]);
    
    // Reset view when changing tabs
    const handleTabClick = (tab) => {
        setViewingMovie(null); // Go back to list view when clicking any tab
        setActiveTab(tab);
    }

    return (
        <div className="bg-gray-900 text-white min-h-screen font-sans">
            <header className="bg-gray-800 p-4 flex justify-between items-center border-b border-indigo-500 sticky top-0 z-40">
                <h1 className="text-3xl font-bold text-indigo-400 cursor-pointer" onClick={() => handleTabClick('home')}>CineVault</h1>
                <nav className="flex items-center space-x-6">
                    <button onClick={() => handleTabClick('home')} className={`text-lg hover:text-indigo-300 ${activeTab === 'home' && 'text-indigo-400 font-semibold'}`}>Home</button>
                    <button onClick={() => handleTabClick('memes')} className={`text-lg hover:text-indigo-300 ${activeTab === 'memes' && 'text-indigo-400 font-semibold'}`}>Meme Gallery</button>
                    {userProfile && <button onClick={() => handleTabClick('upload')} className={`text-lg hover:text-indigo-300 ${activeTab === 'upload' && 'text-indigo-400 font-semibold'}`}>Upload</button>}
                    {userProfile && <button onClick={() => handleTabClick('profile')} className={`text-lg hover:text-indigo-300 ${activeTab === 'profile' && 'text-indigo-400 font-semibold'}`}>My Profile</button>}
                    {isAdmin && <button onClick={() => handleTabClick('admin')} className={`text-lg hover:text-yellow-300 ${activeTab === 'admin' && 'text-yellow-400 font-semibold'}`}>Admin</button>}
                    <div className="ml-auto"><ConnectButton /></div>
                </nav>
            </header>
            <main className="p-8">
                {!isConnected ? (
                    <div className="text-center bg-gray-800 p-10 rounded-lg"><h2 className="text-4xl font-bold mb-4">Welcome to CineVault</h2><p className="text-xl text-gray-400">Connect your wallet to get started.</p></div>
                ) : isLoadingProfile ? (
                    <p>Loading user profile...</p>
                ) : userProfile ? (
                    <>
                        <div className="text-right mb-4 text-indigo-300">Welcome back, <strong>{userProfile.username}</strong>!</div>
                        {activeTab === 'home' && (viewingMovie ? <MovieDetailView movie={viewingMovie} onBack={() => setViewingMovie(null)} /> : <MovieList onMovieSelect={setViewingMovie} />)}
                        {activeTab === 'memes' && <MemeGallery />}
                        {activeTab === 'upload' && <UploadContent />}
                        {activeTab === 'profile' && <MyProfile />}
                        {activeTab === 'admin' && isAdmin && <AdminPanel />}
                    </>
                ) : (
                    <CreateProfile onSuccess={refetchUserProfile} />
                )}
            </main>
        </div>
    );
}

// =================================================================================================
// HELPER: IpfsUploader (Unchanged)
// =================================================================================================
const IpfsUploader = ({ label, onUploadSuccess, fileType = "image/*" }) => {
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');

    const handleFileChange = (e) => setFile(e.target.files[0]);

    const handleUpload = async () => {
        if (!file) { setUploadStatus('Please select a file first.'); return; }
        setIsUploading(true);
        setUploadStatus('Uploading to IPFS...');
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, { headers: { 'pinata_api_key': pinataApiKey, 'pinata_secret_api_key': pinataApiSecret } });
            const cid = res.data.IpfsHash;
            setUploadStatus(`Success! CID: ${cid}`);
            onUploadSuccess(cid);
        } catch (error) { console.error("IPFS Upload Error:", error); setUploadStatus('Upload failed.'); } 
        finally { setIsUploading(false); }
    };
    return (
        <div className="mb-4">
            <label className="block text-gray-300 mb-2">{label}</label>
            <div className="flex items-center space-x-4">
                <input type="file" onChange={handleFileChange} accept={fileType} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                <button onClick={handleUpload} disabled={isUploading || !file} className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-500 px-4 py-2 rounded-md transition-colors">{isUploading ? 'Uploading...' : 'Upload'}</button>
            </div>
            {uploadStatus && <p className="text-sm mt-2 text-gray-400">{uploadStatus}</p>}
        </div>
    );
};

// =================================================================================================
// CreateProfile Component (Unchanged)
// =================================================================================================
function CreateProfile({ onSuccess }) {
    const [username, setUsername] = useState('');
    const { data: hash, isPending, writeContract } = useWriteContract();
    function submit() { if (username.length > 0) writeContract({ address: contractAddress, abi: contractABI, functionName: 'createProfile', args: [username] }); }
    const { status } = useWaitForTransactionReceipt({ hash });
    useEffect(() => { if (status === 'success') onSuccess(); }, [status, onSuccess]);
    return (
        <div className="max-w-md mx-auto bg-gray-800 p-8 rounded-lg"><h2 className="text-2xl font-bold mb-4">Create Your Profile</h2><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username" className="w-full bg-gray-700 p-3 rounded-md mb-4"/><button onClick={submit} disabled={!username || isPending} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-500 p-3 rounded-md font-bold">{isPending ? 'Confirming...' : 'Create Profile'}</button>{status === 'success' && <p className="text-green-400 mt-4">Profile created!</p>}</div>
    );
}

// =================================================================================================
// Movie Components (UPDATED LOGIC)
// =================================================================================================
function MovieCard({ movie, onMovieSelect }) {
    const [isHovering, setIsHovering] = useState(false);
    return (
        <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg transform hover:-translate-y-2 transition-transform duration-300 cursor-pointer" onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)} onClick={() => onMovieSelect(movie)}>
            <div className="relative h-64"><div className="absolute inset-0 bg-black opacity-0 hover:opacity-50 transition-opacity flex items-center justify-center"><h3 className="text-white text-2xl font-bold">View Details</h3></div>{isHovering && movie.trailerCID ? (<video src={`${pinataGateway}/ipfs/${movie.trailerCID}`} className="w-full h-full object-cover" autoPlay loop muted playsInline />) : (<img src={`${pinataGateway}/ipfs/${movie.thumbnailCID}`} alt={movie.title} className="w-full h-full object-cover" />)}</div>
            <div className="p-4"><h3 className="text-xl font-bold truncate">{movie.title}</h3><p className="text-lg font-semibold text-indigo-400">{formatEther(movie.pricePerDay)} ETH/day</p></div>
        </div>
    );
}

function MovieList({ onMovieSelect }) {
    const { data: movieCountData, isLoading: isLoadingMovieCount } = useContractRead({ address: contractAddress, abi: contractABI, functionName: 'movieCount', watch: true });
    const movieCount = movieCountData ? Number(movieCountData) : 0;
    const { data: moviesData, isLoading: isLoadingMovies } = useContractRead({ address: contractAddress, abi: contractABI, functionName: 'getPaginatedMovies', args: [0, movieCount], enabled: movieCount > 0 });
    const movies = moviesData ? moviesData[0] : [];

    if (isLoadingMovieCount || isLoadingMovies) {
        return <div className="text-center"><div className="spinner"></div><p>Loading Movies...</p></div>;
    }

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">Available Movies</h2>
            {movies.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {movies.filter(movie => movie.listed).map(movie => <MovieCard key={Number(movie.id)} movie={movie} onMovieSelect={onMovieSelect} />)}
                </div>
            ) : (
                <p>No movies available at the moment.</p>
            )}
        </div>
    );
}

function MovieDetailView({ movie, onBack }) {
    const { address } = useAccount();
    const [showRentModal, setShowRentModal] = useState(false);
    const [watchMovie, setWatchMovie] = useState(null);
    const { data: hasActiveRental, isLoading } = useContractRead({ address: contractAddress, abi: contractABI, functionName: 'hasActiveRental', args: [address, movie.id], enabled: !!address, watch: true });
    
    return (
        <div>
            <button onClick={onBack} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-md mb-6 transition-colors">← Back to All Movies</button>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2"><video src={`${pinataGateway}/ipfs/${movie.trailerCID}`} className="w-full rounded-lg shadow-lg" controls autoPlay loop muted /></div>
                <div><div className="bg-gray-800 p-6 rounded-lg">
                    <h1 className="text-4xl font-bold mb-2">{movie.title}</h1>
                    <p className="text-lg text-indigo-400 mb-4">{movie.genre}</p>
                    <p className="text-gray-300 mb-6">{movie.description}</p>
                    <div className="space-y-4">
                        <button onClick={() => setShowRentModal(true)} disabled={hasActiveRental || isLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed p-3 rounded-md font-bold text-lg transition-colors">
                            {isLoading ? 'Checking status...' : hasActiveRental ? 'Already Rented' : `Rent for ${formatEther(movie.pricePerDay)} ETH/day`}
                        </button>
                        {hasActiveRental && <button onClick={() => setWatchMovie(movie)} className="w-full bg-green-600 hover:bg-green-700 p-3 rounded-md font-bold text-lg">Watch Now</button>}
                    </div>
                </div></div>
            </div>
            {showRentModal && <RentMovieModal movie={movie} onClose={() => setShowRentModal(false)} />}
            {watchMovie && <WatchMovieModal movie={watchMovie} onClose={() => setWatchMovie(null)} />}
        </div>
    );
}

// =================================================================================================
// RentMovieModal, MemeGallery, and Upload Components (Mostly Unchanged)
// =================================================================================================
function RentMovieModal({ movie, onClose }) {
    const [numDays, setNumDays] = useState(1);
    const { address } = useAccount();
    const { data: hash, isPending, writeContract } = useWriteContract();
    const { data: userProfile } = useContractRead({ address: contractAddress, abi: contractABI, functionName: 'userProfiles', args: [address], enabled: !!address });
    const hasDiscount = userProfile ? userProfile[2] && (Number(userProfile[3]) > Date.now() / 1000) : false;
    const baseCost = BigInt(movie.pricePerDay) * BigInt(numDays);
    const totalCost = hasDiscount ? (baseCost * 80n) / 100n : baseCost;
    function submit() { writeContract({ address: contractAddress, abi: contractABI, functionName: 'rentMovie', args: [movie.id, numDays], value: totalCost }); }
    const { status } = useWaitForTransactionReceipt({ hash });
    useEffect(() => { if (status === 'success') onClose(); }, [status, onClose]);
    
    return ( <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50"><div className="bg-gray-800 p-8 rounded-lg max-w-lg w-full"><h2 className="text-2xl font-bold mb-4">Rent "{movie.title}"</h2><div className="mb-4"><label>Number of Days</label><input type="number" min="1" value={numDays} onChange={(e) => setNumDays(Number(e.target.value) || 1)} className="w-full bg-gray-700 p-3 rounded-md"/></div><div className="text-lg mb-4">{hasDiscount && <p className="text-green-400 font-bold">20% Spotlight Discount Applied!</p>}<p className="font-bold mt-2">Total Cost: {formatEther(totalCost)} ETH</p></div><div className="flex justify-end space-x-4"><button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-md">Cancel</button><button onClick={submit} disabled={isPending} className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-500 px-4 py-2 rounded-md">{isPending ? 'Confirming...' : 'Rent Now'}</button></div></div></div> );
}

// =================================================================================================
// MemeGallery Component (REVISED FOR SPOTLIGHT DEBUGGING & UI)
// =================================================================================================
// =================================================================================================
// MemeGallery Component (CORRECTED & FINAL)
// =================================================================================================
function MemeGallery() {
  const { data: memeCountData, isLoading: isLoadingMemeCount } = useContractRead({
    address: contractAddress,
    abi: contractABI,
    functionName: "memeCount",
    watch: true,
  });
  const memeCount = memeCountData ? Number(memeCountData) : 0;

  const { data: spotlightMeme, isLoading: isLoadingSpotlight } = useContractRead({
    address: contractAddress,
    abi: contractABI,
    functionName: "getSpotlightMeme",
    watch: true,
  });
 useEffect(() => { console.log("Spotlight Meme Data:", spotlightMeme); }, [spotlightMeme]);
  const memeContracts = useMemo(
    () =>
      Array.from({ length: memeCount }, (_, i) => ({
        address: contractAddress,
        abi: contractABI,
        functionName: "memes",
        args: [i + 1],
      })),
    [memeCount]
  );

  const { data: memesData, isLoading: isLoadingMemes } = useReadContracts({
    contracts: memeContracts,
    query: { enabled: memeCount > 0 },
  });

  const memes = useMemo(
    () =>
      memesData
        ? memesData
            .map((res) => (res.status === "success" ? res.result : null))
            .filter(Boolean)
        : [],
    [memesData]
  );

  return (
    <div>
      {/* Spotlight Section */}
      {isLoadingSpotlight ? (
        <div className="mb-10 p-8 bg-gray-700 rounded-lg text-center shadow-lg">
          <h2 className="text-2xl font-bold text-gray-300">
            Loading Spotlight Winner...
          </h2>
        </div>
      ) : // =============================================================
        // THE FIX IS HERE: Added Array.isArray(spotlightMeme) check
        // This prevents the "not iterable" error.
        // =============================================================
      Array.isArray(spotlightMeme) && Number(spotlightMeme[0]) !== 0 ? (
        (() => {
          const [id, creator, title, imageCID] = spotlightMeme;
          return (
            <div className="mb-10 p-8 bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 rounded-lg text-center shadow-2xl">
              <h2 className="text-4xl font-bold text-gray-900 mb-2">
                🏆 DAILY SPOTLIGHT 🏆
              </h2>
              <img
                src={`${pinataGateway}/ipfs/${imageCID}`}
                alt={title}
                className="max-w-lg w-full mx-auto rounded-lg my-4 border-4 border-white shadow-xl"
              />
              <h3 className="text-3xl font-semibold text-gray-800">{title}</h3>
              <p className="text-sm text-gray-700 mt-2">Creator: {creator}</p>
            </div>
          );
        })()
      ) : (
        <div className="mb-10 p-8 bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg text-center">
          <h2 className="text-2xl font-bold text-gray-400">
            No Spotlight Winner Selected Yet
          </h2>
          <p className="text-gray-500 mt-2">
            The platform owner can select a winner in the Admin Panel.
          </p>
        </div>
      )}

      {/* Meme Gallery */}
      <h2 className="text-3xl font-bold mb-6">Meme Gallery</h2>
      {isLoadingMemeCount || isLoadingMemes ? (
        <div className="text-center">
          <p>Loading memes...</p>
        </div>
      ) : memes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {memes.map((meme, idx) => {
            if (!meme) return null;
            const [id, creator, title, imageCID] = meme;
            return (
              <div
                key={Number(id) || idx}
                className="bg-gray-800 rounded-lg overflow-hidden shadow-lg transform hover:-translate-y-1 transition-transform duration-200"
              >
                <img
                  src={`${pinataGateway}/ipfs/${imageCID}`}
                  alt={title}
                  className="w-full h-auto object-cover aspect-square"
                />
                <div className="p-3">
                  <p className="font-bold truncate">{title}</p>
                  <p className="text-xs text-gray-400 truncate">
                    Creator: {creator}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p>No memes have been minted yet.</p>
      )}
    </div>
  );
}

function UploadContent() { return (<div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto"><UploadMovieForm /><MintMemeForm /></div>); }
function UploadMovieForm() { const [form, setForm] = useState({ title: '', genre: '', description: '', pricePerDay: '' }); const [cids, setCids] = useState({ film: '', trailer: '', thumbnail: '' }); const { data: hash, isPending, writeContract } = useWriteContract(); const { data: uploadFee } = useContractRead({ address: contractAddress, abi: contractABI, functionName: 'uploadFee' }); const canSubmit = useMemo(() => form.title && form.pricePerDay && cids.film && cids.trailer && cids.thumbnail && uploadFee !== undefined, [form, cids, uploadFee]); function submit() { if (!canSubmit) return; writeContract({ address: contractAddress, abi: contractABI, functionName: 'uploadMovie', args: [form.title, form.genre, form.description, cids.film, cids.trailer, cids.thumbnail, parseEther(form.pricePerDay)], value: uploadFee, }); } const { status } = useWaitForTransactionReceipt({ hash }); return (<div className="bg-gray-800 p-6 rounded-lg"><h3 className="text-2xl font-bold mb-4">Upload a New Movie</h3><input type="text" placeholder="Movie Title" onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-gray-700 p-2 rounded mb-2" /><input type="text" placeholder="Genre" onChange={e => setForm({...form, genre: e.target.value})} className="w-full bg-gray-700 p-2 rounded mb-2" /><textarea placeholder="Description" onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-gray-700 p-2 rounded mb-2" /><input type="number" placeholder="Price per Day (ETH)" onChange={e => setForm({...form, pricePerDay: e.target.value})} className="w-full bg-gray-700 p-2 rounded mb-4" /><IpfsUploader label="1. Upload Thumbnail" onUploadSuccess={cid => setCids(prev => ({...prev, thumbnail: cid}))} fileType="image/*" /><IpfsUploader label="2. Upload Trailer" onUploadSuccess={cid => setCids(prev => ({...prev, trailer: cid}))} fileType="video/*" /><IpfsUploader label="3. Upload Full Movie" onUploadSuccess={cid => setCids(prev => ({...prev, film: cid}))} fileType="video/*" /><button onClick={submit} disabled={!canSubmit || isPending} className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-500 p-3 rounded-md font-bold transition-colors">{isPending ? 'Uploading...' : `Upload Movie (Fee: ${uploadFee ? formatEther(uploadFee) : '...'} ETH)`}</button>{status === 'success' && <p className="text-green-400 mt-2">Movie uploaded successfully!</p>}</div>); }
function MintMemeForm() { const [title, setTitle] = useState(''); const [imageCID, setImageCID] = useState(''); const { data: hash, isPending, writeContract } = useWriteContract(); const { data: memeFee } = useContractRead({ address: contractAddress, abi: contractABI, functionName: 'memeFee' }); const canSubmit = useMemo(() => title && imageCID && memeFee !== undefined, [title, imageCID, memeFee]); function submit() { if (!canSubmit) return; writeContract({ address: contractAddress, abi: contractABI, functionName: 'mintMeme', args: [title, imageCID], value: memeFee }); } const { status } = useWaitForTransactionReceipt({ hash }); return (<div className="bg-gray-800 p-6 rounded-lg"><h3 className="text-2xl font-bold mb-4">Mint a New Meme</h3><input type="text" placeholder="Meme Title" onChange={e => setTitle(e.target.value)} className="w-full bg-gray-700 p-2 rounded mb-4" /><IpfsUploader label="Upload Meme Image" onUploadSuccess={setImageCID} fileType="image/*" /><button onClick={submit} disabled={!canSubmit || isPending} className="w-full mt-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-500 p-3 rounded-md font-bold transition-colors">{isPending ? 'Minting...' : `Mint Meme (Fee: ${memeFee ? formatEther(memeFee) : '...'} ETH)`}</button>{status === 'success' && <p className="text-green-400 mt-2">Meme minted successfully!</p>}</div>); }

// =================================================================================================
// COMPONENT: My Profile (NEW AND EXPANDED)
// =================================================================================================
function MyProfile() {
    const [profileTab, setProfileTab] = useState('rentals');
    return (
        <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-3xl font-bold mb-6">My Profile</h2>
            <div className="flex space-x-4 border-b border-gray-700 mb-6">
                <button onClick={() => setProfileTab('rentals')} className={`p-2 ${profileTab === 'rentals' ? 'border-b-2 border-indigo-500' : ''}`}>My Rentals</button>
                <button onClick={() => setProfileTab('uploads')} className={`p-2 ${profileTab === 'uploads' ? 'border-b-2 border-indigo-500' : ''}`}>My Uploaded Movies</button>
                <button onClick={() => setProfileTab('memes')} className={`p-2 ${profileTab === 'memes' ? 'border-b-2 border-indigo-500' : ''}`}>My Memes</button>
            </div>
            {profileTab === 'rentals' && <MyRentalsSection />}
            {profileTab === 'uploads' && <MyUploadsSection />}
            {profileTab === 'memes' && <MyMemesSection />}
        </div>
    );
}

function MyRentalsSection() {
    const { address } = useAccount();
    const [watchMovie, setWatchMovie] = useState(null); 
    const { data: rentalsData, isLoading: isLoadingRentals } = useContractRead({ address: contractAddress, abi: contractABI, functionName: 'getUserRentals', args: [address], enabled: !!address, watch: true });
    const rentals = useMemo(() => rentalsData || [], [rentalsData]);
    const uniqueMovieIds = useMemo(() => [...new Set(rentals.map(r => Number(r.movieId)))], [rentals]);
    const movieDetailContracts = useMemo(() => uniqueMovieIds.map(id => ({ address: contractAddress, abi: contractABI, functionName: 'movies', args: [id] })), [uniqueMovieIds]);
    const { data: movieDetailsData, isLoading: isLoadingMovieDetails } = useReadContracts({ contracts: movieDetailContracts, query: { enabled: uniqueMovieIds.length > 0 } });
    const movieDetails = useMemo(() => {
        if (!movieDetailsData) return {};
        return movieDetailsData.reduce((acc, result, index) => {
            if (result.status === 'success') { const movieId = uniqueMovieIds[index]; acc[movieId] = { id: result.result[0], owner: result.result[1], title: result.result[2], genre: result.result[3], description: result.result[4], filmCID: result.result[5], trailerCID: result.result[6], thumbnailCID: result.result[7], pricePerDay: result.result[8], rentalCount: result.result[9], listed: result.result[10] }; } return acc;
        }, {});
    }, [movieDetailsData, uniqueMovieIds]);

    if (isLoadingRentals || isLoadingMovieDetails) {
        return <div className="text-center"><div className="spinner"></div><p>Loading Your Rentals...</p></div>;
    }

    if (watchMovie) return <WatchMovieModal movie={watchMovie} onClose={() => setWatchMovie(null)} />;
    return (
        <div className="space-y-4">{rentals.length === 0 && <p>You haven't rented any movies yet.</p>}{rentals.map(rental => { const movie = movieDetails[Number(rental.movieId)]; if (!movie) return <div key={Number(rental.rentalId)} className="bg-gray-700 p-4 rounded-lg animate-pulse">Loading movie details...</div>; const isExpired = Date.now() / 1000 > Number(rental.expiryTimestamp); return (<div key={Number(rental.rentalId)} className="flex items-center justify-between bg-gray-700 p-4 rounded-lg"><div className="flex items-center space-x-4"><img src={`${pinataGateway}/ipfs/${movie.thumbnailCID}`} alt={movie.title} className="w-24 h-16 object-cover rounded"/><div><p className="font-bold text-lg">{movie.title}</p><p className={`text-sm ${isExpired ? 'text-red-400' : 'text-green-400'}`}>{isExpired ? 'Expired' : `Expires: ${new Date(Number(rental.expiryTimestamp) * 1000).toLocaleString()}`}</p></div></div>{!isExpired && <button onClick={() => setWatchMovie(movie)} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md font-bold">Watch Now</button>}</div>); })}</div>
    );
}

function MyUploadsSection() {
    const { address } = useAccount();
    const { data: movieIds, isLoading: isLoadingIds } = useContractRead({ address: contractAddress, abi: contractABI, functionName: 'userUploadedMovieIds', args: [address], enabled: !!address, watch: true });
    const movieContracts = useMemo(() => (movieIds || []).map(id => ({ address: contractAddress, abi: contractABI, functionName: 'movies', args: [id] })), [movieIds]);
    const { data: moviesData, isLoading: isLoadingMovies } = useReadContracts({ contracts: movieContracts, query: { enabled: (movieIds || []).length > 0 } });
    const movies = useMemo(() => moviesData?.map(res => res.status === 'success' ? res.result : null).filter(Boolean) || [], [moviesData]);

    if (isLoadingIds || isLoadingMovies) {
        return <div className="text-center"><div className="spinner"></div><p>Loading Your Uploads...</p></div>;
    }

    if (movies.length === 0) return <p>You haven't uploaded any movies yet.</p>;
    return ( <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4"> {movies.map(movie => <div key={Number(movie[0])} className="bg-gray-700 rounded-lg p-2"><img src={`${pinataGateway}/ipfs/${movie[7]}`} alt={movie[2]} className="w-full h-auto object-cover rounded aspect-video"/><p className="font-bold truncate mt-2">{movie[2]}</p></div>)}</div> );
}

function MyMemesSection() {
    const { address } = useAccount();
    const { data: memeIds, isLoading: isLoadingIds } = useContractRead({ address: contractAddress, abi: contractABI, functionName: 'userMemeIds', args: [address], enabled: !!address, watch: true });
    const memeContracts = useMemo(() => (memeIds || []).map(id => ({ address: contractAddress, abi: contractABI, functionName: 'memes', args: [id] })), [memeIds]);
    const { data: memesData, isLoading: isLoadingMemes } = useReadContracts({ contracts: memeContracts, query: { enabled: (memeIds || []).length > 0 } });
    const memes = useMemo(() => memesData?.map(res => res.status === 'success' ? res.result : null).filter(Boolean) || [], [memesData]);

    if (isLoadingIds || isLoadingMemes) {
        return <div className="text-center"><div className="spinner"></div><p>Loading Your Memes...</p></div>;
    }

    if (memes.length === 0) return <p>You haven't minted any memes yet.</p>;
    return ( <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"> {memes.map(meme => <div key={Number(meme[0])} className="bg-gray-700 rounded-lg p-2"><img src={`${pinataGateway}/ipfs/${meme[3]}`} alt={meme[2]} className="w-full h-auto object-cover rounded aspect-square"/><p className="font-bold truncate mt-2">{meme[2]}</p></div>)}</div> );
}

function WatchMovieModal({ movie, onClose }) {
    return ( <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col justify-center items-center z-50 p-4"><div className="w-full max-w-6xl"><div className="flex justify-between items-center mb-4"><h2 className="text-2xl font-bold">{movie.title}</h2><button onClick={onClose} className="bg-red-600 hover:bg-red-700 w-10 h-10 rounded-full font-bold text-lg flex items-center justify-center">&times;</button></div><video src={`${pinataGateway}/ipfs/${movie.filmCID}`} className="w-full h-auto max-h-[80vh] rounded-lg" controls autoPlay>Your browser does not support the video tag.</video></div></div> );
}

// =================================================================================================
// COMPONENT: Admin Panel (NEW)
// =================================================================================================
function AdminPanel() {
    const { data: currentUploadFee } = useContractRead({ address: contractAddress, abi: contractABI, functionName: 'uploadFee' });
    const { data: currentMemeFee } = useContractRead({ address: contractAddress, abi: contractABI, functionName: 'memeFee' });
    const [uploadFee, setUploadFee] = useState('');
    const [memeFee, setMemeFee] = useState('');
    const { writeContract: writeSetFees, data: setFeesHash, isPending: isSettingFees } = useWriteContract();
    const { status: setFeesStatus } = useWaitForTransactionReceipt({ hash: setFeesHash });

    const { data: lastSpotlightTimestamp } = useContractRead({ address: contractAddress, abi: contractABI, functionName: 'lastSpotlightTimestamp', watch: true });
    const canRequestSpotlight = useMemo(() => {
        if (typeof lastSpotlightTimestamp === 'undefined') return false;
        const twentyFourHours = 24 * 60 * 60;
        const nextAvailableTime = Number(lastSpotlightTimestamp) + twentyFourHours;
        return Date.now() / 1000 > nextAvailableTime;
    }, [lastSpotlightTimestamp]);

    const { writeContract: requestSpotlight, data: requestSpotlightHash, isPending: isRequestingSpotlight } = useWriteContract();
    const { status: requestSpotlightStatus } = useWaitForTransactionReceipt({ hash: requestSpotlightHash });

    const { data: balanceResult } = useBalance({ address: contractAddress });
    const { writeContract: withdraw, data: withdrawHash, isPending: isWithdrawing } = useWriteContract();
    const { status: withdrawStatus } = useWaitForTransactionReceipt({ hash: withdrawHash });
    
    return (
        <div className="bg-gray-800 border border-yellow-500 p-6 rounded-lg max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-yellow-400">Admin Panel</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Set Fees */}
                <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-xl font-semibold mb-2">Manage Platform Fees</h3>
                    <div className="mb-2">Current Upload Fee: <strong>{currentUploadFee ? formatEther(currentUploadFee) : '...'} ETH</strong></div>
                    <input type="number" placeholder="New Upload Fee (ETH)" onChange={e => setUploadFee(e.target.value)} className="w-full bg-gray-600 p-2 rounded mb-2" />
                    <div className="mb-2">Current Meme Fee: <strong>{currentMemeFee ? formatEther(currentMemeFee) : '...'} ETH</strong></div>
                    <input type="number" placeholder="New Meme Fee (ETH)" onChange={e => setMemeFee(e.target.value)} className="w-full bg-gray-600 p-2 rounded mb-4" />
                    <button onClick={() => writeSetFees({ address: contractAddress, abi: contractABI, functionName: 'setFees', args: [parseEther(uploadFee), parseEther(memeFee)] })} disabled={(!uploadFee && !memeFee) || isSettingFees} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 p-2 rounded font-bold">
                        {isSettingFees ? 'Updating...' : 'Set New Fees'}
                    </button>
                    {setFeesStatus === 'success' && <p className="text-green-400 mt-2">Fees updated!</p>}
                </div>
                {/* Spotlight & Withdrawal */}
                <div className="space-y-4">
                    <div className="bg-gray-700 p-4 rounded-lg">
                        <h3 className="text-xl font-semibold mb-2">Daily Meme Spotlight</h3>
                        <p className="text-sm text-gray-400 mb-4">Select a new random meme for the spotlight. This can be done once per day.</p>
                        <button onClick={() => requestSpotlight({ address: contractAddress, abi: contractABI, functionName: 'requestSpotlightWinner'})} disabled={isRequestingSpotlight || !canRequestSpotlight} className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-500 p-2 rounded font-bold">
                            {isRequestingSpotlight ? 'Requesting...' : (canRequestSpotlight ? 'Request New Spotlight Winner' : 'Winner Already Selected Today')}
                        </button>
                         {requestSpotlightStatus === 'success' && <p className="text-green-400 mt-2">New winner selected!</p>}
                    </div>
                    <div className="bg-gray-700 p-4 rounded-lg">
                        <h3 className="text-xl font-semibold mb-2">Withdraw Platform Balance</h3>
                        <p className="text-lg mb-4">Contract Balance: <strong>{balanceResult?.formatted || '0.0'} {balanceResult?.symbol}</strong></p>
                        <button onClick={() => withdraw({ address: contractAddress, abi: contractABI, functionName: 'withdrawBalance'})} disabled={isWithdrawing || balanceResult?.value === 0n} className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-500 p-2 rounded font-bold">
                            {isWithdrawing ? 'Withdrawing...' : 'Withdraw All Funds'}
                        </button>
                        {withdrawStatus === 'success' && <p className="text-green-400 mt-2">Withdrawal successful!</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
