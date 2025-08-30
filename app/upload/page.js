"use client"

import { useState, useEffect, useMemo } from "react"
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi"
import { motion } from "framer-motion"
import { parseEther } from "viem"
import { BackgroundAnimation } from "@/components/BackgroundAnimation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { UploadCloud, ImageIcon, Video, DollarSign, CheckCircle, AlertCircle, Loader2, PartyPopper } from "lucide-react"
import { CONTRACT_ADDRESS, CONTRACT_ABI, handleContractError } from "@/lib/contract"
import { uploadFileToIPFS, validateFile } from "@/lib/pinata-enhanced"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

// A small component to avoid repetition for file status display
const FileStatus = ({ file, uploadedFile }) => {
  if (!file) return null
  const getStatusColor = () => {
    switch (uploadedFile.status) {
      case "completed":
        return "text-teal-400"
      case "error":
        return "text-red-400"
      case "uploading":
        return "text-cyan-400"
      default:
        return "text-gray-400"
    }
  }
  return (
    <div className="flex items-center gap-2 mt-2 text-sm">
      {uploadedFile.status === "uploading" && <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />}
      {uploadedFile.status === "completed" && <CheckCircle className="h-4 w-4 text-teal-400" />}
      {uploadedFile.status === "error" && <AlertCircle className="h-4 w-4 text-red-400" />}
      <p className={getStatusColor()}>
        <span className="font-semibold truncate max-w-xs inline-block align-middle">{file.name}</span>
        <span className="text-gray-500"> ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
        {uploadedFile.status === "uploading" && " - Uploading..."}
        {uploadedFile.status === "completed" && " - Uploaded"}
        {uploadedFile.status === "error" && " - Failed"}
      </p>
    </div>
  )
}

export default function UploadPage() {
  const { address, isConnected } = useAccount()
  const { toast } = useToast()
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState("idle")
  const [uploadedFiles, setUploadedFiles] = useState({
    film: { cid: "", status: "pending" },
    trailer: { cid: "", status: "pending" },
    thumbnail: { cid: "", status: "pending" },
  })
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    genre: "",
    price48h: "", // user enters 48h price, we convert to per-day (unitary method)
  })
  const [files, setFiles] = useState({ film: null, trailer: null, thumbnail: null })

  // Read uploadFee and user's profile (mapping)
  const { data: uploadFee } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "uploadFee",
  })
  const { data: userProfile } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "userProfiles",
    args: [address],
    enabled: !!address,
  })

  const { writeContract, data: hash, isPending, error: contractError } = useWriteContract()
  const { isLoading: isConfirming, isSuccess, error: txError } = useWaitForTransactionReceipt({ hash })

  const genres = [
    "Action",
    "Comedy",
    "Drama",
    "Horror",
    "Romance",
    "Sci-Fi",
    "Thriller",
    "Documentary",
    "Animation",
    "Adventure",
    "Fantasy",
    "Mystery",
  ]

  useEffect(() => {
    if (contractError || txError) {
      const errorMessage = handleContractError(contractError || txError)
      toast({ title: "Transaction Failed", description: errorMessage, variant: "destructive" })
      setUploadStatus("error")
    }
  }, [contractError, txError, toast])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (type, file) => {
    if (!file) return
    try {
      const config = {
        film: { maxSize: 1024, types: ["video/mp4", "video/mov", "video/avi", "video/quicktime", "video/x-msvideo"] },
        trailer: { maxSize: 500, types: ["video/mp4", "video/mov", "video/avi", "video/quicktime", "video/x-msvideo"] },
        thumbnail: { maxSize: 10, types: ["image/jpeg", "image/png", "image/jpg", "image/webp"] },
      }
      validateFile(file, config[type].maxSize, config[type].types)
      setFiles((prev) => ({ ...prev, [type]: file }))
      setUploadedFiles((prev) => ({ ...prev, [type]: { cid: "", status: "pending" } }))
    } catch (error) {
      toast({ title: "File Error", description: error.message, variant: "destructive" })
    }
  }

  const uploadSingleFile = async (type, file) => {
    try {
      setUploadedFiles((prev) => ({ ...prev, [type]: { cid: "", status: "uploading" } }))
      const cid = await uploadFileToIPFS(file)
      setUploadedFiles((prev) => ({ ...prev, [type]: { cid, status: "completed" } }))
      toast({
        title: "Upload Success",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully!`,
      })
      return cid
    } catch (error) {
      setUploadedFiles((prev) => ({ ...prev, [type]: { cid: "", status: "error" } }))
      throw new Error(`Failed to upload ${type}: ${error.message}`)
    }
  }

  const uploadFilesToIPFS = async () => {
    setUploadStatus("uploading")
    setUploadProgress(0)
    try {
      const filesToUpload = Object.entries(files)
        .filter(([, file]) => file)
        .map(([key, file]) => ({ key, file }))
      const results = {}
      for (let i = 0; i < filesToUpload.length; i++) {
        const { key, file } = filesToUpload[i]
        const cid = await uploadSingleFile(key, file)
        results[key] = cid
        setUploadProgress(((i + 1) / filesToUpload.length) * 100)
      }
      setUploadStatus("uploaded")
      return results
    } catch (error) {
      setUploadStatus("error")
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" })
      throw error
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const hasProfile = userProfile?.exists
    if (
      !isConnected ||
      !hasProfile ||
      !files.film ||
      !formData.title.trim() ||
      !formData.price48h ||
      Number.parseFloat(formData.price48h) <= 0
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields and connect your wallet.",
        variant: "destructive",
      })
      return
    }
    try {
      setUploadStatus("submitting")
      const uploadResults = await uploadFilesToIPFS()
      // Unitary method: per-day = price48h / 2
      const perDay = Number.parseFloat(formData.price48h) / 2
      const pricePerDayWei = parseEther(perDay.toString())

      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "uploadMovie",
        args: [
          formData.title,
          formData.genre || "",
          formData.description || "",
          uploadResults.film || "",
          uploadResults.trailer || "",
          uploadResults.thumbnail || "",
          pricePerDayWei,
        ],
        value: uploadFee ?? 0n,
      })
    } catch (error) {
      const errorMessage = handleContractError(error)
      toast({ title: "Submit Failed", description: errorMessage, variant: "destructive" })
      setUploadStatus("error")
    }
  }

  const uploadFeeCAMP = useMemo(() => (uploadFee ? (Number(uploadFee) / 1e18).toFixed(4) : "0.00"), [uploadFee])
  const isUploadingOrConfirming =
    uploadStatus === "uploading" || uploadStatus === "submitting" || isPending || isConfirming
  const canSubmit = uploadStatus === "uploaded" && !isUploadingOrConfirming

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <BackgroundAnimation />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-gray-800 border-gray-700 max-w-lg text-center shadow-2xl shadow-teal-500/10">
            <CardHeader>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}>
                <PartyPopper className="h-20 w-20 text-teal-400 mx-auto" />
              </motion.div>
              <CardTitle className="text-3xl font-bold text-white mt-4">Upload Successful!</CardTitle>
              <CardDescription className="text-gray-400">Your movie is now live on the platform.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-900 rounded-lg p-3 text-left space-y-2">
                {uploadedFiles.film.cid && (
                  <p className="text-xs text-gray-400 break-all">
                    <strong className="text-teal-400">Film CID:</strong> {uploadedFiles.film.cid}
                  </p>
                )}
                {uploadedFiles.trailer.cid && (
                  <p className="text-xs text-gray-400 break-all">
                    <strong className="text-cyan-400">Trailer CID:</strong> {uploadedFiles.trailer.cid}
                  </p>
                )}
                {uploadedFiles.thumbnail.cid && (
                  <p className="text-xs text-gray-400 break-all">
                    <strong className="text-pink-400">Thumbnail CID:</strong> {uploadedFiles.thumbnail.cid}
                  </p>
                )}
              </div>
              <p className="text-sm text-gray-500">
                Transaction Hash:{" "}
                <a
                  href={`https://sepolia.etherscan.io/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline break-all"
                >
                  {hash}
                </a>
              </p>
            </CardContent>
            <CardFooter className="flex-col md:flex-row gap-2">
              <Button
                onClick={() => window.location.reload()}
                className="w-full bg-teal-500 hover:bg-teal-600 font-bold"
              >
                Upload Another Movie
              </Button>
              <Link href="/profile" className="w-full">
                <Button
                  variant="outline"
                  className="w-full border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-white font-bold bg-transparent"
                >
                  View My Profile
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white py-12 pt-24 md:py-16 md:pt-28">
      <BackgroundAnimation />
      <motion.div className="max-w-4xl mx-auto px-4" initial="hidden" animate="visible" variants={itemVariants}>
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-teal-400 to-cyan-500 bg-clip-text text-transparent">
            Upload Your Movie
          </h1>
          <p className="text-gray-400 text-lg">Share your creation with the world on the CineVault.</p>
        </div>

        {isConnected && userProfile && !userProfile.exists && (
          <Alert variant="destructive" className="mb-6 bg-yellow-900/50 border-yellow-700 text-yellow-300">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Profile Required</AlertTitle>
            <AlertDescription>
              You need to create a profile before uploading.{" "}
              <Link href="/profile" className="font-bold underline hover:text-yellow-200">
                Create Profile
              </Link>
            </AlertDescription>
          </Alert>
        )}

        <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700 shadow-lg">
          <form onSubmit={handleSubmit}>
            <CardContent className="p-6 md:p-8 space-y-8">
              {/* Section 1: Movie Details */}
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold text-white border-l-4 border-teal-500 pl-4">Movie Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">
                      Movie Title <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      disabled={isUploadingOrConfirming}
                      placeholder="e.g., The Decentralized Dream"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price48h">
                      48h Rental Price (ETH) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="price48h"
                      name="price48h"
                      type="number"
                      step="0.0001"
                      min="0.0001"
                      value={formData.price48h}
                      onChange={handleInputChange}
                      required
                      disabled={isUploadingOrConfirming}
                      placeholder="e.g., 0.01"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    disabled={isUploadingOrConfirming}
                    placeholder="A short synopsis of your movie..."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Genre</Label>
                    <Select
                      value={formData.genre}
                      onValueChange={(v) => setFormData((p) => ({ ...p, genre: v }))}
                      disabled={isUploadingOrConfirming}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select genre" />
                      </SelectTrigger>
                      <SelectContent>
                        {genres.map((g) => (
                          <SelectItem key={g} value={g}>
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Removed language field per new contract */}
                </div>
              </div>

              {/* Section 2: File Uploads */}
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold text-white border-l-4 border-cyan-500 pl-4">File Uploads</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      Movie File <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="file"
                      accept="video/*"
                      onChange={(e) => handleFileChange("film", e.target.files[0])}
                      disabled={isUploadingOrConfirming}
                    />
                    <FileStatus file={files.film} uploadedFile={uploadedFiles.film} />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      Trailer{" "}
                    </Label>
                    <Input
                      type="file"
                      accept="video/*"
                      onChange={(e) => handleFileChange("trailer", e.target.files[0])}
                      disabled={isUploadingOrConfirming}
                    />
                    <FileStatus file={files.trailer} uploadedFile={uploadedFiles.trailer} />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Thumbnail
                    </Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange("thumbnail", e.target.files[0])}
                      disabled={isUploadingOrConfirming}
                    />
                    <FileStatus file={files.thumbnail} uploadedFile={uploadedFiles.thumbnail} />
                  </div>
                </div>
              </div>

              {/* Section 3: Status & Pricing */}
              <div className="space-y-6">
                {uploadStatus === "uploading" && (
                  <div className="space-y-2">
                    <div className="flex justify-between font-semibold">
                      <span>Uploading to IPFS...</span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <Progress value={uploadProgress} className="w-full [&>div]:bg-teal-500" />
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Alert className="bg-gray-900/70 border-gray-700">
                    <DollarSign className="h-4 w-4 text-teal-400" />
                    <AlertTitle className="text-white">Pricing Tiers</AlertTitle>
                    <AlertDescription className="text-xs text-gray-400 space-y-1 mt-2">
                      <p>
                        72h Price: {formData.price48h ? (Number.parseFloat(formData.price48h) * 1.5).toFixed(4) : "0"}{" "}
                        ETH
                      </p>
                      <p>
                        1 Week Price:{" "}
                        {formData.price48h ? (Number.parseFloat(formData.price48h) * 3.5).toFixed(4) : "0"} ETH
                      </p>
                      <p className="pt-1 font-bold">You receive 90% of all rental fees.</p>
                    </AlertDescription>
                  </Alert>
                  <Alert className="bg-gray-900/70 border-gray-700">
                    <UploadCloud className="h-4 w-4 text-cyan-400" />
                    <AlertTitle className="text-white">Platform Fee</AlertTitle>
                    <AlertDescription className="text-gray-400 mt-2">
                      A one-time fee of <strong className="text-cyan-300">{uploadFeeCAMP} ETH</strong> is required to
                      upload your movie.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-800 p-6">
              <Button
                type="submit"
                disabled={!isConnected || isUploadingOrConfirming || (userProfile && !userProfile.exists)}
                className="w-full bg-teal-500 hover:bg-teal-600 font-bold text-lg py-6 disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                {!isConnected ? (
                  "Connect Wallet to Upload"
                ) : userProfile && !userProfile.exists ? (
                  "Please Create a Profile First"
                ) : isUploadingOrConfirming ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />{" "}
                    <span>
                      {isConfirming
                        ? "Processing Transaction..."
                        : isPending
                          ? "Confirming in Wallet..."
                          : "Uploading Files..."}
                    </span>
                  </>
                ) : canSubmit ? (
                  <>
                    {" "}
                    <CheckCircle className="mr-2 h-5 w-5" /> Ready to Submit to Blockchain
                  </>
                ) : (
                  <>
                    <UploadCloud className="mr-2 h-5 w-5" /> Start Upload & Submit
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  )
}
