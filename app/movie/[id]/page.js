"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { BackgroundAnimation } from "@/components/BackgroundAnimation"
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, Star, User, Loader2, CheckCircle, Info, Video, Wallet, XCircle } from "lucide-react"
import { CONTRACT_ADDRESS, CONTRACT_ABI, handleContractError } from "@/lib/contract"
import { useToast } from "@/hooks/use-toast"
import { formatEther } from "viem" // NEW: Import formatEther for safe price formatting

// NEW: Define the IPFS Gateway in a central place, preferably from an environment variable
const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://gateway.pinata.cloud/ipfs/"

const Loader = () => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center">
    <Loader2 className="h-12 w-12 animate-spin text-teal-400" />
  </div>
)

export default function MoviePage() {
  const [isMounted, setIsMounted] = useState(false)
  const { id } = useParams()
  const { address, isConnected } = useAccount()
  const { toast } = useToast()
  const [selectedDuration, setSelectedDuration] = useState("48h") // '48h' | '72h' | '1w'
  const [movie, setMovie] = useState(null)
  
  // NEW: State to hold the validated, numeric ID
  const [movieId, setMovieId] = useState(null)

  const [playerState, setPlayerState] = useState("trailer") // 'trailer' | 'rented_overlay' | 'playing_full_movie'

  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  // NEW: Safely parse the ID from the URL. This prevents the app from crashing.
  useEffect(() => {
    if (isMounted && id) {
      try {
        const parsedId = BigInt(id)
        setMovieId(parsedId)
      } catch (err) {
        console.error("Invalid movie ID in URL:", id)
        setMovieId(null) // Ensure hooks are disabled if ID is invalid
        setMovie(undefined) // Use undefined to explicitly show "Not Found" state
      }
    }
  }, [isMounted, id])

  const { data: movieData, isLoading: isLoadingMovie } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "movies",
    // CHANGED: Use the validated movieId. The hook is disabled until movieId is valid.
    args: [movieId],
    enabled: isMounted && !!movieId,
  })

  const { data: hasRental, refetch: refetchHasRental } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "hasActiveRental",
    // CHANGED: Use the validated movieId and ensure address is connected.
    args: [address, movieId],
    enabled: isMounted && !!address && !!movieId,
  })

  useEffect(() => {
    // A returned ID of 0 from the contract means it was not found.
    // We check `movieData` to ensure we don't try to read properties of undefined.
    if (movieData && movieData.id > 0n) {
        setMovie(movieData);
    } else if (!isLoadingMovie && movieData) {
        // Handle the case where the ID was valid but not found in the contract
        setMovie(undefined)
    }
  }, [movieData, isLoadingMovie])
  
  useEffect(() => {
    setPlayerState(hasRental ? "rented_overlay" : "trailer")
  }, [hasRental])

  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })
  
  useEffect(() => {
    if (isSuccess) {
      toast({ title: "Rental Successful!", description: "You now have access to watch this movie." })
      refetchHasRental()
    }
  }, [isSuccess, toast, refetchHasRental])
  
  // CHANGED: Cleaner and safer price formatting using formatEther from viem/ethers.
  const displayPrice = (perDay, days) => {
    if (!perDay) return "0.0000";
    const totalCostWei = BigInt(perDay) * BigInt(days);
    return parseFloat(formatEther(totalCostWei)).toFixed(4);
  }

  const rentalDays = { "48h": 2, "72h": 3, "1w": 7 }

  const handleRent = async () => {
    if (!isConnected || !movie || !movieId) return
    const days = rentalDays[selectedDuration]
    try {
      const value = movie.pricePerDay * BigInt(days)
      writeContract({ // No need for await here, use hooks for loading states
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "rentMovie",
        args: [movieId, BigInt(days)],
        value,
      })
    } catch (err) {
      toast({ title: "Rental Failed", description: handleContractError(err), variant: "destructive" })
    }
  }

  const handleWatchNow = () => {
    if (movie && movie.filmCID) {
      setPlayerState("playing_full_movie")
    } else {
      toast({ title: "Playback Error", description: "The full movie file could not be found.", variant: "destructive" })
    }
  }

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.15 } } }
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }

  if (!isMounted || (isLoadingMovie && movieId !== null)) return <Loader />

  // CHANGED: Simplified and more robust "Not Found" logic.
  // This now catches both invalid IDs from the URL and valid IDs not found on the contract.
  if (!movie) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Card className="bg-gray-800 border-gray-700 max-w-md text-center">
          <CardHeader>
            <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <CardTitle className="text-white text-2xl font-bold">Movie Not Found</CardTitle>
            <CardDescription className="text-gray-400">Could not find a movie with the specified ID or the ID in the URL is invalid.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white py-12 pt-24 md:py-16 md:pt-28">
      <BackgroundAnimation />
      <motion.div className="max-w-7xl mx-auto px-4" initial="hidden" animate="visible" variants={containerVariants}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div className="lg:col-span-2 space-y-8" variants={itemVariants}>
            <Card className="bg-gray-800 border-gray-700 overflow-hidden">
              <div className="aspect-video bg-black flex items-center justify-center relative">
                {(() => {
                  switch (playerState) {
                    case "playing_full_movie":
                      return (
                        <video controls autoPlay className="w-full h-full" key={movie.filmCID}>
                          <source src={`${IPFS_GATEWAY}${movie.filmCID}`} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      )
                    case "rented_overlay":
                      return (
                        <>
                          <img
                            src={ movie.thumbnailCID ? `${IPFS_GATEWAY}${movie.thumbnailCID}` : `/placeholder.svg?text=${encodeURIComponent(movie.title)}` }
                            alt={movie.title}
                            className="w-full h-full object-cover blur-sm brightness-50"
                          />
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                            <CheckCircle className="h-20 w-20 text-teal-400 mb-4" />
                            <h2 className="text-3xl font-bold">You have access to this movie</h2>
                            <p className="text-gray-300 mt-2">Enjoy your rental!</p>
                            <Button onClick={handleWatchNow} size="lg" className="mt-6 bg-teal-500 hover:bg-teal-600 font-bold">
                              <Play className="mr-2 h-5 w-5" /> Watch Now
                            </Button>
                          </div>
                        </>
                      )
                    default:
                      return movie.trailerCID ? (
                        <video controls className="w-full h-full" poster={movie.thumbnailCID ? `${IPFS_GATEWAY}${movie.thumbnailCID}` : ""}>
                          <source src={`${IPFS_GATEWAY}${movie.trailerCID}`} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      ) : (
                        <img src={ movie.thumbnailCID ? `${IPFS_GATEWAY}${movie.thumbnailCID}` : `/placeholder.svg?text=${encodeURIComponent(movie.title)}` } alt={movie.title} className="w-full h-full object-cover"/>
                      )
                  }
                })()}
              </div>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div>
                    <CardTitle className="text-4xl font-extrabold mb-3">{movie.title}</CardTitle>
                    <div className="flex gap-2">
                      <Badge className="bg-cyan-500 text-white">{movie.genre || "N/A"}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-yellow-400 text-lg font-semibold bg-gray-900 px-3 py-1.5 rounded-lg shrink-0">
                    <Star className="h-5 w-5 fill-current" />
                    {/* CHANGED: Use .toString() for BigInts to avoid precision loss. */}
                    <span>{movie.rentalCount.toString()} Rentals</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-base leading-relaxed mb-6">{movie.description || "No description available."}</p>
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-gray-900 border-gray-700">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="owner">Ownership</TabsTrigger>
                  </TabsList>
                  <TabsContent value="details" className="mt-4 text-gray-300">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-cyan-400" />
                      {/* CHANGED: Use .toString() */}
                      Movie ID: #{movie.id.toString()}
                    </div>
                  </TabsContent>
                  <TabsContent value="owner" className="mt-4 text-gray-300">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-cyan-400" />
                      Owner: <span className="font-mono text-sm break-all">{movie.owner}</span>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div className="lg:col-span-1" variants={itemVariants}>
            <div className="lg:sticky lg:top-28">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader><CardTitle className="text-2xl font-bold flex items-center gap-2"><Video className="h-6 w-6 text-teal-400" />Rent This Movie</CardTitle></CardHeader>
                <CardContent>
                  {hasRental ? (
                    <div className="text-center py-6"><div className="bg-teal-500/10 border border-teal-500/20 rounded-lg p-4"><p className="text-teal-300 font-semibold">You already own this rental.</p><p className="text-gray-400 text-sm">You can watch the movie now.</p></div></div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-2">{["48h", "72h", "1w"].map((key) => (<button key={key} onClick={() => setSelectedDuration(key)} className={`text-center p-3 rounded-lg transition-all text-sm font-bold ${selectedDuration === key ? "bg-teal-500 text-white shadow-lg" : "bg-gray-700 hover:bg-gray-600 text-gray-200"}`}>{key === "1w" ? "1 Week" : `${key.replace("h", "")} Hrs`}</button>))}</div>
                      <div className="text-center py-3">
                        <p className="text-gray-400 text-sm">Price</p>
                        <p className="text-4xl font-bold text-teal-400">{displayPrice(movie.pricePerDay, rentalDays[selectedDuration])}{" "}<span className="text-2xl">ETH</span></p>
                      </div>
                      <Button
                        onClick={handleRent}
                        // CHANGED: Case-insensitive and safer address comparison.
                        disabled={!isConnected || isPending || isConfirming || address?.toLowerCase() === movie.owner?.toLowerCase()}
                        size="lg"
                        className="w-full bg-teal-500 hover:bg-teal-600 font-bold text-lg h-14 disabled:bg-gray-600"
                      >
                        {!isConnected ? (<><Wallet className="mr-2 h-5 w-5" />Connect Wallet</>) : 
                         address?.toLowerCase() === movie.owner?.toLowerCase() ? (<><XCircle className="mr-2 h-5 w-5" />Cannot Rent Own Movie</>) : 
                         isPending || isConfirming ? (<><Loader2 className="mr-2 h-5 w-5 animate-spin" />Processing...</>) : 
                         (<><Play className="mr-2 h-5 w-5" />Rent Now</>)}
                      </Button>
                      <div className="text-xs text-gray-500 text-center pt-2"><p>90% goes to the owner, 10% to the platform.</p><p>Discounts (if won via spotlight) apply automatically.</p></div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}