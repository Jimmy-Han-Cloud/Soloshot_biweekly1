const REPLICATE_API_URL = 'https://api.replicate.com/v1'

const POLL_INTERVAL_MS = 2000
const TIMEOUT_MS = 120_000

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestPayload {
  selfie_url: string        // PRIMARY: selfie with travel background
  reference_urls: string[]  // REFERENCE: full-body photos for body style guidance
  style: 'realistic' | 'stylized'
  num_outputs: number
}

interface ReplicatePrediction {
  id: string
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  output: string | string[] | null
  error: string | null
}

async function generateFullBody(
  token: string,
  payload: RequestPayload
): Promise<string[]> {
  // The selfie is the PRIMARY image — we keep the face + background
  // and generate the full body extending downward.
  // strength 0.55 = keep ~45% of original (face + background preserved),
  // generate the rest (body below frame)

  const stylePrompt =
    payload.style === 'stylized'
      ? 'full body portrait of this person, stylized, showing complete body from head to toe, same travel location background, whole body visible including legs and feet'
      : 'full body photo of this person standing, showing complete body from head to toe, same travel location background, natural lighting, professional photography, whole body visible including legs and feet'

  const negativePrompt =
    'cropped body, missing legs, missing feet, cut off, floating, deformed, ugly, bad anatomy, blurry'

  const body = {
    input: {
      prompt: stylePrompt,
      negative_prompt: negativePrompt,
      image: payload.selfie_url,
      strength: 0.6,
      num_outputs: payload.num_outputs ?? 3,
      aspect_ratio: '2:3',   // portrait ratio — ensures room for full body
      output_format: 'jpg',
      guidance_scale: 3.5,
      num_inference_steps: 28,
    },
  }

  console.log('Generating full body from selfie (flux-dev img2img)')
  console.log('Selfie URL:', payload.selfie_url)
  console.log('Refs count:', payload.reference_urls.length)

  const response = await fetch(
    `${REPLICATE_API_URL}/models/black-forest-labs/flux-dev/predictions`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait',
      },
      body: JSON.stringify(body),
    }
  )

  const responseText = await response.text()
  console.log('Replicate status:', response.status)
  if (!response.ok) {
    throw new Error(`Replicate failed (${response.status}): ${responseText}`)
  }

  const prediction = JSON.parse(responseText) as ReplicatePrediction

  let output: string[]
  if (prediction.status === 'succeeded' && prediction.output) {
    const out = prediction.output
    output = Array.isArray(out) ? out : [out]
  } else {
    output = await pollPrediction(token, prediction.id)
  }

  return output
}

async function pollPrediction(token: string, predictionId: string): Promise<string[]> {
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
      if (!prediction.output) throw new Error('No output returned')
      const out = prediction.output
      return Array.isArray(out) ? out : [out]
    }

    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      throw new Error(`Prediction ${prediction.status}: ${prediction.error ?? 'unknown'}`)
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
    console.log('style:', payload.style, 'num_outputs:', payload.num_outputs)

    if (!payload.selfie_url) throw new Error('selfie_url is required')
    if (!payload.reference_urls || payload.reference_urls.length === 0) {
      throw new Error('At least one reference_url is required')
    }

    const output = await generateFullBody(token, payload)
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
