"use client"

import { useState, useEffect, useMemo } from "react"
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
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
import { BackgroundAnimation } from "@/components/BackgroundAnimation"
import { useToast } from "@/hooks/use-toast"

export default function ProfilePage() {
  const [isMounted, setIsMounted] = useState(false)
  const { address, isConnected } = useAccount()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [username, setUsername] = useState("")

  const { data: userProfile, refetch: refetchProfile } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "userProfiles",
    args: [address],
    enabled: !!address,
  })

  const { data: pageData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getPaginatedMovies",
    args: [0n, 1000n],
    enabled: !!address,
  })

  const userMovies = useMemo(() => {
    const list = pageData?.[0] || []
    return list.filter((m) => m.owner?.toLowerCase() === address?.toLowerCase())
  }, [pageData, address])

  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (userProfile?.username) setUsername(userProfile.username)
  }, [userProfile])

  useEffect(() => {
    if (isSuccess) {
      toast({ title: "Profile Created!", description: "Your profile has been successfully created." })
      setIsEditing(false)
      refetchProfile()
    }
  }, [isSuccess, toast, refetchProfile])

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

  const formatPrice = (wei) => (Number(wei) / 1e18).toFixed(4)
  const totalRentals = userMovies.reduce((sum, movie) => sum + Number(movie.rentalCount), 0)
  const totalEarnings = userMovies.reduce(
    (sum, movie) => sum + Number(movie.rentalCount) * Number(movie.pricePerDay) * 2 * 0.9,
    0,
  ) // approx by 48h price = 2*perDay

  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.5 } } }

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
        <BackgroundAnimation />
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

  const hasProfile = userProfile?.exists

  return (
    <div className="relative min-h-screen bg-gray-900 text-white py-12 pt-24 md:py-16 md:pt-28 overflow-hidden">
      <BackgroundAnimation />
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
                  {hasProfile ? userProfile.username || "User" : "No Profile Yet"}
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
                                    <span>{Number(movie.rentalCount)} rentals</span>
                                  </div>
                                </div>
                                <div className="mt-auto flex justify-between items-center">
                                  <div className="font-semibold text-teal-400">
                                    {formatPrice(BigInt(movie.pricePerDay) * 2n)} ETH
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
            </Tabs>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
