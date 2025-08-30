"use client"

import { useState, useEffect, useMemo } from "react"
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useReadContracts } from "wagmi"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { User, Film, Upload, Star, DollarSign, Wallet, Loader2, Play } from "lucide-react"
import Link from "next/link"
import { CONTRACT_ADDRESS, CONTRACT_ABI, handleContractError } from "@/lib/contract"
import { useToast } from "@/hooks/use-toast"

export default function ProfilePage() {
  const [isMounted, setIsMounted] = useState(false)
  const { address, isConnected } = useAccount()
  const { toast } = useToast()
  const [username, setUsername] = useState("")

  // New local state to manage UI updates
  const [localProfile, setLocalProfile] = useState(null);

  const { data: contractUserProfile, refetch: refetchProfile } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "userProfiles",
    args: [address || "0x0000000000000000000000000000000000000000"],
    query: { enabled: Boolean(address) },
  })

  // Keep local state in sync with the contract data
  useEffect(() => {
    if (contractUserProfile) {
      setLocalProfile(contractUserProfile)
      setUsername(contractUserProfile.username)
    }
  }, [contractUserProfile])

  const { data: pageData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getPaginatedMovies",
    args: [0n, 1000n],
    query: { enabled: true },
  })

  const userMovies = useMemo(() => {
    const list = pageData?.[0] || []
    return list.filter((m) => m.owner?.toLowerCase() === address?.toLowerCase())
  }, [pageData, address])

  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const { data: rentals } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getUserRentals",
    args: [address || "0x0000000000000000000000000000000000000000"],
    query: { enabled: Boolean(address) },
  })

  // Build unique movieIds from rentals to fetch movie details
  const rentalMovieIds = Array.isArray(rentals) ? [...new Set(rentals.map((r) => r.movieId))] : []
  const movieCalls = rentalMovieIds.map((mid) => ({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "movies",
    args: [mid],
  }))
  const { data: rentalMoviesData } = useReadContracts({
    contracts: movieCalls,
    query: { enabled: movieCalls.length > 0 },
  })
  const rentalMoviesMap = {}
  if (Array.isArray(rentalMoviesData)) {
    rentalMoviesData.forEach((res, idx) => {
      const m = res?.result
      if (m) rentalMoviesMap[Number(rentalMovieIds[idx])] = m
    })
  }

  // My Memes
  const { data: myMemeIds } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "userMemeIds",
    args: [address || "0x0000000000000000000000000000000000000000"],
    query: { enabled: Boolean(address) },
  })
  const myMemeCalls = (Array.isArray(myMemeIds) ? myMemeIds : []).map((id) => ({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "memes",
    args: [id],
  }))
  const { data: myMemesData } = useReadContracts({ contracts: myMemeCalls, query: { enabled: myMemeCalls.length > 0 } })
  const myMemes = Array.isArray(myMemesData) ? myMemesData.map((r) => r?.result).filter(Boolean) : []

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Update local state and refetch after a successful transaction
  useEffect(() => {
    if (isSuccess && username) {
      toast({ title: "Profile Created!", description: "Your profile has been successfully created." })
      // Immediately update local state to show the new profile
      setLocalProfile({ username, exists: true })
      refetchProfile()
    }
  }, [isSuccess, toast, username, refetchProfile])

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    try {
      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "createProfile",
        args: [username],
      })
    } catch (error) {
      const errorMessage = handleContractError(error)
      toast({ title: "Error", description: errorMessage, variant: "destructive" })
    }
  }

  const formatPrice = (wei) => (Number(wei || 0n) / 1e18).toFixed(4)
  const totalRentals = userMovies.reduce((sum, m) => sum + Number(m.rentalCount || 0), 0)
  const totalEarnings = userMovies.reduce((sum, m) => {
    const perDay = m?.pricePerDay ?? 0n
    const per48h = Number(perDay) * 2
    return sum + per48h * Number(m.rentalCount || 0) * 0.9
  }, 0)

  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.5 } } }
  
  const hasProfile = localProfile?.exists

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-teal-400" />
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="relative min-h-screen bg-gray-900 flex items-center justify-center p-4 overflow-hidden">
        <Card className="bg-gray-800 border-gray-700 max-w-md text-center z-10">
          <CardHeader>
            <Wallet className="h-16 w-16 text-cyan-400 mx-auto mb-4" />
            <CardTitle className="text-white text-2xl font-bold">Connect Your Wallet</CardTitle>
            <CardDescription className="text-gray-400">
              Please connect your wallet to create or view your profile.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-gray-900 text-white py-12 pt-24 md:py-16 md:pt-28 overflow-hidden">
      <motion.div
        className="max-w-7xl mx-auto px-4 z-10 relative"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <motion.div className="lg:col-span-4" variants={itemVariants}>
            <Card className="bg-gray-800 border-gray-700 h-full flex flex-col">
              <CardHeader className="text-center items-center flex flex-col">
                <div className="relative w-32 h-32 mb-4">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center overflow-hidden border-4 border-gray-800">
                    <User className="h-16 w-16 text-white" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold">
                  {hasProfile ? localProfile.username || "User" : "No Profile Yet"}
                </CardTitle>
                <CardDescription className="text-sm font-mono break-all mt-1">{address}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                {!hasProfile ? (
                  <form onSubmit={handleProfileSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your username"
                        required
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        type="submit"
                        disabled={isPending || isConfirming}
                        className="flex-1 bg-teal-500 hover:bg-teal-600 font-bold"
                      >
                        {isPending || isConfirming ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                          </>
                        ) : (
                          "Create Profile"
                        )}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="mt-6 space-y-4">
                    <h3 className="font-semibold text-lg text-white">Your Stats</h3>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-gray-400">
                        <Film className="h-4 w-4" /> Movies Uploaded
                      </span>
                      <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-300">
                        {userMovies.length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-gray-400">
                        <Star className="h-4 w-4" /> Total Rentals
                      </span>
                      <Badge variant="secondary" className="bg-pink-500/20 text-pink-300">
                        {totalRentals}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-gray-400">
                        <DollarSign className="h-4 w-4" /> Est. Earnings
                      </span>
                      <Badge variant="secondary" className="bg-teal-500/20 text-teal-300">
                        {formatPrice(totalEarnings)} ETH
                      </Badge>
                    </div>
                    <Link href="/upload" className="block mt-4">
                      <Button className="w-full bg-teal-500 hover:bg-teal-600 font-bold">
                        <Upload className="mr-2 h-4 w-4" /> Upload New Movie
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div className="lg:col-span-8" variants={itemVariants}>
            <Tabs defaultValue="movies" className="w-full">
              <TabsList className="bg-gray-800 border-gray-700">
                <TabsTrigger value="movies">Your Uploads</TabsTrigger>
                <TabsTrigger value="rentals">Your Rentals</TabsTrigger>
                <TabsTrigger value="memes">Your Memes</TabsTrigger>
              </TabsList>

              <TabsContent value="movies" className="mt-6">
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader className="flex-row items-center justify-between">
                    <CardTitle>Your Uploads</CardTitle>
                    <Link href="/upload">
                      <Button
                        variant="outline"
                        className="border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-white font-bold bg-transparent"
                      >
                        <Upload className="mr-2 h-4 w-4" /> Upload New Movie
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent>
                    {userMovies.length === 0 ? (
                      <div className="text-center py-16">
                        <Film className="h-16 w-16 mx-auto text-gray-600 mb-4" />
                        <h4 className="text-lg font-semibold mb-2">You haven't uploaded any movies yet.</h4>
                        <p className="text-gray-400 mb-4">Start sharing your creations with the world!</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {userMovies.map((movie) => (
                          <motion.div key={movie.id} whileHover={{ y: -5 }}>
                            <Card className="bg-gray-800 border-gray-700 hover:border-teal-500 transition-colors duration-300 overflow-hidden group h-full flex flex-col">
                              <CardHeader className="p-0">
                                <div className="aspect-video overflow-hidden">
                                  <motion.img
                                    src={
                                      movie.thumbnailCID
                                        ? `https://gateway.pinata.cloud/ipfs/${movie.thumbnailCID}`
                                        : `/placeholder.svg?height=225&width=400&text=${encodeURIComponent(movie.title)}`
                                    }
                                    alt={movie.title}
                                    className="w-full h-full object-cover"
                                    whileHover={{ scale: 1.1 }}
                                    transition={{ duration: 0.4 }}
                                    onError={(e) => {
                                      e.target.src = `/placeholder.svg?height=225&width=400&text=${encodeURIComponent(movie.title)}`
                                    }}
                                  />
                                </div>
                              </CardHeader>
                              <CardContent className="p-4 flex flex-col flex-grow">
                                <h4 className="font-semibold text-lg truncate">{movie.title}</h4>
                                <div className="flex justify-between items-center text-sm my-2">
                                  <Badge variant="secondary" className="bg-cyan-500 text-white shrink-0">
                                    {movie.genre}
                                  </Badge>
                                  <div className="flex items-center gap-1.5 text-yellow-400">
                                    <Star className="h-4 w-4 fill-current" />
                                    <span>{Number(movie.rentalCount || 0)} rentals</span>
                                  </div>
                                </div>
                                <div className="mt-auto flex justify-between items-center">
                                  <div className="font-semibold text-teal-400">
                                    {formatPrice(movie.pricePerDay * 2)} ETH
                                  </div>
                                  <Link href={`/movie/${movie.id}`}>
                                    <Button size="sm" className="bg-teal-500 hover:bg-teal-600 font-bold">
                                      <Play className="mr-2 h-4 w-4" /> View
                                    </Button>
                                  </Link>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="rentals" className="mt-6">
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle>Your Rentals</CardTitle>
                    <CardDescription>Movies you’ve rented and can watch while active.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!Array.isArray(rentals) || rentals.length === 0 ? (
                      <div className="text-center py-16 text-gray-400">No rentals yet.</div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {rentals.map((r) => {
                          const m = rentalMoviesMap[Number(r.movieId)]
                          if (!m) return null
                          const active = Number(r.expiryTimestamp) * 1000 > Date.now()
                          return (
                            <Card key={Number(r.rentalId)} className="bg-gray-800 border-gray-700">
                              <CardContent className="p-4 flex gap-4">
                                <img
                                  src={
                                    m.thumbnailCID
                                      ? `https://gateway.pinata.cloud/ipfs/${m.thumbnailCID}`
                                      : `/placeholder.svg?height=120&width=200&query=${encodeURIComponent(m.title + " movie poster")}`
                                  }
                                  alt={m.title}
                                  className="w-32 h-20 object-cover rounded"
                                />
                                <div className="flex-1">
                                  <div className="font-semibold">{m.title}</div>
                                  <div className="text-xs text-gray-400">Rental #{Number(r.rentalId)}</div>
                                  <div className={`text-xs mt-1 ${active ? "text-teal-300" : "text-gray-400"}`}>
                                    {active ? "Active" : "Expired"} • Expires:{" "}
                                    {new Date(Number(r.expiryTimestamp) * 1000).toLocaleString()}
                                  </div>
                                  <Link href={`/movie/${Number(m.id)}`} className="inline-block mt-2">
                                    <Button size="sm" className="bg-teal-500 hover:bg-teal-600 font-bold">
                                      <Play className="mr-2 h-4 w-4" /> View
                                    </Button>
                                  </Link>
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="memes" className="mt-6">
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle>Your Memes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {myMemes.length === 0 ? (
                      <div className="text-center py-16 text-gray-400">
                        You haven’t minted any memes yet. Go to the Memes page to mint your first one.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {myMemes.map((meme) => (
                          <Card key={Number(meme.id)} className="bg-gray-800 border-gray-700">
                            <CardContent className="p-4 flex gap-4">
                              <img
                                src={`https://gateway.pinata.cloud/ipfs/${meme.imageCID}`}
                                alt={meme.title}
                                className="w-32 h-20 object-cover rounded"
                              />
                              <div className="flex-1">
                                <div className="font-semibold">{meme.title}</div>
                                <div className="text-xs text-gray-400">#{Number(meme.id)}</div>
                                {meme.isSpotlighted ? (
                                  <div className="mt-1 text-xs text-yellow-300">Spotlight Winner</div>
                                ) : null}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}