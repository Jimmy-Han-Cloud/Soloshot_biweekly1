import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const REPLICATE_API_URL = 'https://api.replicate.com/v1'
// Placeholder model — swap for ControlNet model once API key is configured
const REPLICATE_MODEL = 'stability-ai/sdxl:39ed52f2319f9bf9f645aca8d2a5c1a13c94cdaa9ddae1f3b8f4c8c87e748f5b'

const POLL_INTERVAL_MS = 2000
const TIMEOUT_MS = 120_000

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestPayload {
  selfie_image: string       // base64
  reference_images: string[] // base64[]
  style: 'realistic' | 'stylized'
  num_outputs: number
}

interface ReplicatePrediction {
  id: string
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  output: string[] | null
  error: string | null
}

async function createPrediction(
  token: string,
  payload: RequestPayload
): Promise<ReplicatePrediction> {
  const stylePrompt =
    payload.style === 'stylized'
      ? 'stylized illustration, vibrant colors'
      : 'realistic photo, natural lighting, high detail'

  const response = await fetch(`${REPLICATE_API_URL}/predictions`, {
    method: 'POST',
    headers: {
      Authorization: `Token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: REPLICATE_MODEL.split(':')[1],
      input: {
        prompt: `full body photo of a person, ${stylePrompt}`,
        image: `data:image/jpeg;base64,${payload.selfie_image}`,
        num_outputs: payload.num_outputs,
      },
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Replicate create prediction failed: ${text}`)
  }

  return response.json() as Promise<ReplicatePrediction>
}

async function pollPrediction(
  token: string,
  predictionId: string
): Promise<string[]> {
  const deadline = Date.now() + TIMEOUT_MS

  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))

    const response = await fetch(
      `${REPLICATE_API_URL}/predictions/${predictionId}`,
      {
        headers: { Authorization: `Token ${token}` },
      }
    )

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Replicate poll failed: ${text}`)
    }

    const prediction = (await response.json()) as ReplicatePrediction

    if (prediction.status === 'succeeded') {
      if (!prediction.output || prediction.output.length === 0) {
        throw new Error('Prediction succeeded but returned no output')
      }
      return prediction.output
    }

    if (
      prediction.status === 'failed' ||
      prediction.status === 'canceled'
    ) {
      throw new Error(
        `Prediction ${prediction.status}: ${prediction.error ?? 'unknown error'}`
      )
    }
    // status is 'starting' or 'processing' — keep polling
  }

  throw new Error('Generation timed out after 120 seconds')
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const token = Deno.env.get('REPLICATE_API_TOKEN')
    if (!token) {
      throw new Error('REPLICATE_API_TOKEN is not configured')
    }

    const payload = (await req.json()) as RequestPayload

    if (!payload.selfie_image) {
      throw new Error('selfie_image is required')
    }
    if (!payload.reference_images || payload.reference_images.length === 0) {
      throw new Error('At least one reference_image is required')
    }

    const prediction = await createPrediction(token, payload)
    const output = await pollPrediction(token, prediction.id)

    return new Response(JSON.stringify({ output }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
