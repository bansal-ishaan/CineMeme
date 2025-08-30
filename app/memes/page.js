"use client"

import { useEffect, useState } from "react"
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useReadContracts } from "wagmi"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ImageIcon, Star, Loader2, CheckCircle } from "lucide-react"
// import { BackgroundAnimation } from "@/components/BackgroundAnimation"
import { CONTRACT_ADDRESS, CONTRACT_ABI, handleContractError } from "@/lib/contract"
import { uploadFileToIPFS, validateFile } from "@/lib/pinata-enhanced"
import { useToast } from "@/hooks/use-toast"

export default function MemesPage() {
  const { address, isConnected } = useAccount()
  const { toast } = useToast()

  // Read user profile to require profile before mint
  const { data: userProfile } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "userProfiles",
    args: [address || "0x0000000000000000000000000000000000000000"],
    query: { enabled: Boolean(address) },
  })

  const { data: fee } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "memeFee",
  })

  const { data: spotlight } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getSpotlightMeme",
  })

  const { data: userMemeIds } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "userMemeIds",
    args: [address || "0x0000000000000000000000000000000000000000"],
    query: { enabled: Boolean(address) },
  })

  const memeCalls = (Array.isArray(userMemeIds) ? userMemeIds : []).map((id) => ({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "memes",
    args: [id],
  }))
  const { data: myMemesData } = useReadContracts({ contracts: memeCalls, query: { enabled: memeCalls.length > 0 } })
  const myMemes = Array.isArray(myMemesData) ? myMemesData.map((r) => r?.result).filter(Boolean) : []

  const [title, setTitle] = useState("")
  const [file, setFile] = useState(null)
  const [imageCID, setImageCID] = useState("")
  const [status, setStatus] = useState("idle") // idle | uploading | submitting

  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (isSuccess) {
      toast({ title: "Meme Minted!", description: "Your meme has been minted successfully." })
      setTitle("")
      setFile(null)
      setImageCID("")
      setStatus("idle")
    }
  }, [isSuccess, toast])

  const onFileChange = (f) => {
    if (!f) return
    try {
      validateFile(f, 10, ["image/jpeg", "image/png", "image/webp", "image/jpg"])
      setFile(f)
      setImageCID("")
    } catch (e) {
      toast({ title: "File Error", description: e.message, variant: "destructive" })
    }
  }

  const handleUpload = async () => {
    if (!file) return
    try {
      setStatus("uploading")
      const cid = await uploadFileToIPFS(file)
      setImageCID(cid)
      toast({ title: "Uploaded!", description: "Image uploaded to IPFS." })
      setStatus("idle")
    } catch (e) {
      setStatus("idle")
      toast({ title: "Upload Failed", description: e.message, variant: "destructive" })
    }
  }

  const handleMint = async () => {
    if (!isConnected || !title.trim() || !imageCID || !(userProfile && userProfile.exists)) {
      toast({
        title: "Validation",
        description: !isConnected
          ? "Connect your wallet."
          : !userProfile || !userProfile.exists
            ? "Please create your profile first."
            : !imageCID
              ? "Upload an image before minting."
              : "Enter a title.",
        variant: "destructive",
      })
      return
    }
    try {
      setStatus("submitting")
      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "mintMeme",
        args: [title, imageCID],
        value: fee ?? 0n,
      })
    } catch (e) {
      setStatus("idle")
      toast({ title: "Mint Failed", description: handleContractError(e), variant: "destructive" })
    }
  }

  const fmtEth = (wei) => (Number(wei || 0) / 1e18).toFixed(4)

  return (
    <div className="min-h-screen bg-gray-900 text-white py-12 pt-24 md:py-16 md:pt-28">
      {/* BackgroundAnimation removed */}
      <div className="max-w-4xl mx-auto px-4 grid gap-8 md:grid-cols-2">
        {/* left: mint */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-2xl">Mint Meme NFT</CardTitle>
            <CardDescription className="text-gray-400">
              Showcase your memes and compete for the daily Spotlight.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input placeholder="Enter meme title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Image</Label>
              <div className="flex gap-2">
                <Input type="file" accept="image/*" onChange={(e) => onFileChange(e.target.files[0])} />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleUpload}
                  disabled={!file || status === "uploading"}
                >
                  {status === "uploading" ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading
                    </>
                  ) : (
                    <>Upload</>
                  )}
                </Button>
              </div>
              {imageCID && (
                <Alert className="bg-gray-900/60 border-gray-700 mt-2">
                  <ImageIcon className="h-4 w-4" />
                  <AlertDescription className="break-all text-gray-300">CID: {imageCID}</AlertDescription>
                </Alert>
              )}
            </div>
            <div className="text-sm text-gray-400">
              Meme Fee: <span className="text-teal-400 font-semibold">{fmtEth(fee)} ETH</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full bg-teal-500 hover:bg-teal-600 font-bold"
              onClick={handleMint}
              disabled={status !== "idle" || isPending || isConfirming || !(userProfile && userProfile.exists)}
            >
              {isPending || isConfirming ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Minting...
                </>
              ) : (
                <>Mint Meme</>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* right: spotlight + my memes */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center gap-2">
            <Star className="h-6 w-6 text-yellow-400" />
            <div>
              <CardTitle className="text-2xl">Daily Spotlight</CardTitle>
              <CardDescription className="text-gray-400">Randomly selected via Chainlink VRF.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {spotlight && Number(spotlight.id) > 0 ? (
              <>
                <div className="aspect-video overflow-hidden rounded-lg border border-gray-700">
                  <img
                    src={`https://gateway.pinata.cloud/ipfs/${spotlight.imageCID}`}
                    alt={spotlight.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="text-lg font-semibold">{spotlight.title}</div>
                  <div className="text-sm text-gray-400 break-all">Creator: {spotlight.creator}</div>
                </div>
                <div className="flex items-center gap-2 text-teal-300">
                  <CheckCircle className="h-4 w-4" />
                  <span>Spotlight Active</span>
                </div>
              </>
            ) : (
              <div className="text-gray-400">No spotlight selected yet. Mint a meme to participate!</div>
            )}

            {/* My Memes */}
            <div className="pt-4 border-t border-gray-700">
              <div className="text-lg font-semibold mb-2">My Memes</div>
              {myMemes.length === 0 ? (
                <div className="text-gray-400 text-sm">You haven't minted any memes yet.</div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {myMemes.map((meme) => (
                    <div key={Number(meme.id)} className="flex items-center gap-3">
                      <img
                        src={`https://gateway.pinata.cloud/ipfs/${meme.imageCID}`}
                        alt={meme.title}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{meme.title}</div>
                        <div className="text-xs text-gray-400">#{Number(meme.id)}</div>
                      </div>
                      {meme.isSpotlighted ? (
                        <span className="text-xs px-2 py-1 rounded bg-yellow-500/20 text-yellow-300">Spotlight</span>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
