export const runtime = "nodejs"

export async function POST(request) {
  try {
    const { jsonData, name } = await request.json()
    if (!jsonData) return new Response("Missing jsonData", { status: 400 })

    const pinataJwt = process.env.PINATA_JWT
    if (!pinataJwt) {
      return new Response("PINATA_JWT is not configured", { status: 500 })
    }

    const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${pinataJwt}`,
      },
      body: JSON.stringify({
        pinataContent: jsonData,
        pinataMetadata: {
          name: name || "metadata.json",
          keyvalues: { uploadedAt: new Date().toISOString(), source: "cinevault" },
        },
        pinataOptions: { cidVersion: 1 },
      }),
    })

    const text = await res.text()
    if (!res.ok) {
      return new Response(text || "Pinata error", { status: res.status })
    }

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
