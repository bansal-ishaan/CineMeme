"use client"

import { useMemo, useState } from "react"
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import contractModule from "@/lib/contract"

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
const ABI = contractModule?.abi || contractModule

// Minimal ABIs to detect owner without changing your global ABI
const OWNABLE_ABI = [
  { type: "function", name: "owner", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
] 
const PLATFORM_OWNER_ABI = [
  { type: "function", name: "platformOwner", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
]

export default function SpotlightAdminPage() {
  const { address } = useAccount()
  const [txHash, setTxHash] = useState(null)
  const [error, setError] = useState(null)

  // Try to read platformOwner first, then owner()
  const { data: platformOwnerAddr } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: PLATFORM_OWNER_ABI,
    functionName: "platformOwner",
    query: { enabled: Boolean(CONTRACT_ADDRESS) },
  })

  const { data: ownerAddr } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: OWNABLE_ABI,
    functionName: "owner",
    query: { enabled: Boolean(CONTRACT_ADDRESS && !platformOwnerAddr) },
  })

  const effectiveOwner = platformOwnerAddr || ownerAddr

  // Optional: show current spotlight meme
  const { data: spotlightData, refetch: refetchSpotlight } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: "getSpotlightMeme",
    query: { enabled: Boolean(CONTRACT_ADDRESS && ABI) },
  })

  const isOwner = useMemo(() => {
    if (!address || !effectiveOwner) return false
    return String(address).toLowerCase() === String(effectiveOwner).toLowerCase()
  }, [address, effectiveOwner])

  const { writeContractAsync } = useWriteContract()
  const { data: receipt } = useWaitForTransactionReceipt({ hash: txHash })

  async function handleTriggerSpotlight() {
    setError(null)
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: "requestSpotlightWinner", // owner-only per your contract
        args: [],
      })
      setTxHash(hash)
      await refetchSpotlight()
    } catch (e) {
      console.error("[v0] requestSpotlightWinner error:", e)
      const helper = contractModule?.handleContractError
      const friendly = helper ? helper(e) : e?.shortMessage || e?.message || "Transaction failed"
      setError(friendly)
    }
  }

  return (
    <main className="mx-auto max-w-xl p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Spotlight Admin</h1>
        <p className="text-sm text-muted-foreground">Only the contract owner can trigger spotlight selection.</p>
      </header>

      <section className="rounded-md border p-4 space-y-2">
        <div className="text-sm">
          <div>
            <span className="font-medium">Connected:</span> {address || "Not connected"}
          </div>
          <div>
            <span className="font-medium">Owner (detected):</span> {effectiveOwner || "…"}
          </div>
          <div>
            <span className="font-medium">Is Owner:</span> {isOwner ? "Yes" : "No"}
          </div>
        </div>
      </section>

      <section className="rounded-md border p-4 space-y-3">
        <h2 className="text-lg font-medium">Current Spotlight</h2>
        <pre className="text-xs overflow-x-auto bg-muted p-3 rounded">{JSON.stringify(spotlightData, null, 2)}</pre>
        <button
          onClick={handleTriggerSpotlight}
          disabled={!address}
          className="px-4 py-2 rounded bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          Trigger Spotlight
        </button>
        <p className="text-xs text-muted-foreground">
          This action is enforced on-chain. If you’re not the owner, the transaction will revert with an owner-only
          error.
        </p>
        {txHash ? <p className="text-xs break-all">Submitted: {txHash}</p> : null}
        {receipt ? <p className="text-xs">Confirmed in block {Number(receipt.blockNumber)}</p> : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </section>
    </main>
  )
}
