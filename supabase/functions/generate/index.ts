const REPLICATE_API_URL = 'https://api.replicate.com/v1'

const POLL_INTERVAL_MS = 2000
const TIMEOUT_MS = 120_000

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestPayload {
  selfie_image: string
  reference_images: string[]
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
      ? 'stylized illustration portrait, vibrant colors, full body'
      : 'realistic full body photo portrait, natural lighting, high detail, professional'

  const body = {
    model: 'black-forest-labs/flux-schnell',
    input: {
      prompt: stylePrompt,
      num_outputs: payload.num_outputs ?? 3,
      aspect_ratio: '2:3',
      output_format: 'jpg',
    },
  }

  console.log('Creating prediction with model: black-forest-labs/flux-schnell')

  const response = await fetch(`${REPLICATE_API_URL}/predictions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': 'wait',
    },
    body: JSON.stringify(body),
  })

  const responseText = await response.text()
  console.log('Replicate create response status:', response.status)
  console.log('Replicate create response body:', responseText.slice(0, 500))

  if (!response.ok) {
    throw new Error(`Replicate create prediction failed (${response.status}): ${responseText}`)
  }

  return JSON.parse(responseText) as ReplicatePrediction
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
        headers: { Authorization: `Bearer ${token}` },
      }
    )

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Replicate poll failed (${response.status}): ${text}`)
    }

    const prediction = (await response.json()) as ReplicatePrediction
    console.log('Poll status:', prediction.status)

    if (prediction.status === 'succeeded') {
      if (!prediction.output || prediction.output.length === 0) {
        throw new Error('Prediction succeeded but returned no output')
      }
      return prediction.output
    }

    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      throw new Error(
        `Prediction ${prediction.status}: ${prediction.error ?? 'unknown error'}`
      )
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
    if (!token) {
      throw new Error('REPLICATE_API_TOKEN is not configured')
    }

    console.log('Token present:', token.slice(0, 6) + '...')

    const payload = (await req.json()) as RequestPayload
    console.log('Received payload: style=', payload.style, 'num_outputs=', payload.num_outputs)

    if (!payload.selfie_image) {
      throw new Error('selfie_image is required')
    }
    if (!payload.reference_images || payload.reference_images.length === 0) {
      throw new Error('At least one reference_image is required')
    }

    const prediction = await createPrediction(token, payload)

    let output: string[]
    if (prediction.status === 'succeeded' && prediction.output) {
      output = prediction.output
    } else {
      output = await pollPrediction(token, prediction.id)
    }

    console.log('Generation succeeded, output count:', output.length)

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
