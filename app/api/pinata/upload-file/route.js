export const runtime = "nodejs"

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")
    if (!file || typeof file === "string") {
      return new Response("Missing file", { status: 400 })
    }

    const pinataJwt = process.env.PINATA_JWT
    if (!pinataJwt) {
      return new Response("PINATA_JWT is not configured", { status: 500 })
    }

    // Forward to Pinata
    const pinataForm = new FormData()
    pinataForm.append("file", file)

    // minimal defaults to keep behavior same
    pinataForm.append(
      "pinataMetadata",
      JSON.stringify({
        name: file.name || "upload",
        keyvalues: { uploadedAt: new Date().toISOString(), source: "cinevault" },
      }),
    )
    pinataForm.append("pinataOptions", JSON.stringify({ cidVersion: 1 }))

    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: { Authorization: `Bearer ${pinataJwt}` },
      body: pinataForm,
    })

    const text = await res.text()
    if (!res.ok) {
      return new Response(text || "Pinata error", { status: res.status })
    }

    // text may be JSON string; ensure we return valid JSON
    try {
      const json = JSON.parse(text)
      return Response.json(json)
    } catch {
      return new Response(text, { status: 200, headers: { "content-type": "application/json" } })
    }
  } catch (err) {
    return new Response(err?.message || "Server error", { status: 500 })
  }
}
