const REPLICATE_API_URL = 'https://api.replicate.com/v1'
// Face swap: puts selfie face onto reference full-body photos
const FACESWAP_VERSION = 'd1d6ea8c8be89d664a07a457526f7128109dee7030fdac424788d762c71ed111'

const POLL_INTERVAL_MS = 2000
const TIMEOUT_MS = 120_000

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestPayload {
  selfie_url: string        // public URL — face source
  reference_urls: string[]  // public URLs — full-body target photos
  style: 'realistic' | 'stylized'
  num_outputs: number
}

interface ReplicatePrediction {
  id: string
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  output: string | string[] | null
  error: string | null
}

async function swapFace(
  token: string,
  bodyImageUrl: string,  // target: full-body reference photo
  faceImageUrl: string   // source: selfie
): Promise<string> {
  const response = await fetch(`${REPLICATE_API_URL}/predictions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: FACESWAP_VERSION,
      input: {
        input_image: bodyImageUrl,  // body stays, face gets replaced
        swap_image: faceImageUrl,   // face comes from selfie
      },
    }),
  })

  const responseText = await response.text()
  if (!response.ok) {
    throw new Error(`Face swap create failed (${response.status}): ${responseText}`)
  }

  const prediction = JSON.parse(responseText) as ReplicatePrediction
  console.log('Face swap prediction started:', prediction.id)
  return await pollForResult(token, prediction.id)
}

async function pollForResult(token: string, predictionId: string): Promise<string> {
  const deadline = Date.now() + TIMEOUT_MS

  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))

    const response = await fetch(`${REPLICATE_API_URL}/predictions/${predictionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Poll failed (${response.status}): ${text}`)
    }

    const prediction = (await response.json()) as ReplicatePrediction
    console.log('Poll status:', prediction.status)

    if (prediction.status === 'succeeded') {
      // output can be a string or string[]
      const out = prediction.output
      if (!out) throw new Error('No output returned')
      return Array.isArray(out) ? out[0] : out
    }

    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      throw new Error(`Prediction ${prediction.status}: ${prediction.error ?? 'unknown error'}`)
    }
  }

  throw new Error('Generation timed out after 120 seconds')
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const token = Deno.env.get('REPLICATE_API_TOKEN')
    if (!token) throw new Error('REPLICATE_API_TOKEN is not configured')

    const payload = (await req.json()) as RequestPayload
    console.log('style:', payload.style, 'refs:', payload.reference_urls?.length)

    if (!payload.selfie_url) throw new Error('selfie_url is required')
    if (!payload.reference_urls || payload.reference_urls.length === 0) {
      throw new Error('At least one reference_url is required')
    }

    // Run face swap on each reference photo (up to num_outputs), in parallel
    const targets = payload.reference_urls.slice(0, payload.num_outputs ?? 3)
    console.log('Running face swap on', targets.length, 'reference photos')

    const output = await Promise.all(
      targets.map((bodyUrl) => swapFace(token, bodyUrl, payload.selfie_url))
    )

    console.log('Done, output count:', output.length)

    return new Response(JSON.stringify({ output }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    console.error('Edge Function error:', message)
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
