// Use the configured gateway for reads only (safe on client)
const PINATA_PUBLIC_GATEWAY =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_PINATA_GATEWAY) || "https://gateway.pinata.cloud"

// Upload a binary file to IPFS via server route (uses PINATA_JWT on server)
export async function uploadFileToIPFS(file, options = {}) {
  if (!file) throw new Error("No file provided")

  const formData = new FormData()
  formData.append("file", file)

  const res = await fetch("/api/pinata/upload-file", { method: "POST", body: formData })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Pinata upload failed: ${res.status} - ${txt}`)
  }
  const data = await res.json()
  if (!data?.IpfsHash) throw new Error("No IPFS hash returned from Pinata")
  return data.IpfsHash
}

// Upload JSON to IPFS via server route
export async function uploadJSONToPinata(jsonData, name = "metadata.json") {
  const res = await fetch("/api/pinata/upload-json", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonData, name }),
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`JSON upload failed: ${res.status} - ${txt}`)
  }
  const data = await res.json()
  if (!data?.IpfsHash) throw new Error("No IPFS hash returned from Pinata")
  return data.IpfsHash
}

// Build a public gateway URL for a CID
export function getIPFSUrl(cid, preferredGateway = "pinata") {
  const gateways = {
    pinata: `${PINATA_PUBLIC_GATEWAY}/ipfs/${cid}`,
    ipfs: `https://ipfs.io/ipfs/${cid}`,
    cloudflare: `https://cloudflare-ipfs.com/ipfs/${cid}`,
  }
  return gateways[preferredGateway] || gateways.pinata
}

// Basic client-side file validation
export function validateFile(file, maxSizeMB = 500, allowedTypes = []) {
  if (!file) throw new Error("No file provided")
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  if (file.size > maxSizeBytes) throw new Error(`File size exceeds ${maxSizeMB}MB limit`)
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    throw new Error(`File type ${file.type} not allowed. Allowed types: ${allowedTypes.join(", ")}`)
  }
  return true
}
