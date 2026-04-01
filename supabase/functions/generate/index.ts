const REPLICATE_API_URL = 'https://api.replicate.com/v1'
// PhotoMaker: identity-preserving model, uses "img" as trigger word in prompt
const PHOTOMAKER_VERSION = 'ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4'

const POLL_INTERVAL_MS = 2000
const TIMEOUT_MS = 120_000

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestPayload {
  selfie_url: string        // public Supabase Storage URL
  reference_urls: string[]  // public Supabase Storage URLs
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
  // "img" is the required trigger word for PhotoMaker identity conditioning
  const stylePrompt =
    payload.style === 'stylized'
      ? 'full body portrait of a person img, stylized illustration, vibrant colors, standing in a travel location, whole body visible'
      : 'full body photo of a person img, standing in a scenic travel location, natural lighting, high quality, professional photography, whole body visible'

  const negativePrompt =
    'deformed, ugly, bad anatomy, bad quality, cropped, missing limbs, extra limbs, lowres, blurry'

  // Build input with selfie URL + up to 3 reference URLs for better identity matching
  const refs = payload.reference_urls.slice(0, 3)
  const input: Record<string, unknown> = {
    prompt: stylePrompt,
    negative_prompt: negativePrompt,
    input_image: payload.selfie_url,
    num_outputs: payload.num_outputs ?? 3,
    num_steps: 20,
    style_name: payload.style === 'stylized' ? 'Disney Charactor' : 'Photographic (Default)',
    style_strength_ratio: 20,
    guidance_scale: 5,
    disable_safety_checker: true,
  }

  if (refs[0]) input['input_image2'] = refs[0]
  if (refs[1]) input['input_image3'] = refs[1]
  if (refs[2]) input['input_image4'] = refs[2]

  console.log('Creating PhotoMaker prediction, refs count:', refs.length)

  const response = await fetch(`${REPLICATE_API_URL}/predictions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ version: PHOTOMAKER_VERSION, input }),
  })

  const responseText = await response.text()
  console.log('Replicate create status:', response.status)
  console.log('Replicate response:', responseText.slice(0, 300))

  if (!response.ok) {
    throw new Error(`Replicate create failed (${response.status}): ${responseText}`)
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
      if (!prediction.output || prediction.output.length === 0) {
        throw new Error('Prediction succeeded but returned no output')
      }
      return prediction.output
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

    console.log('Token present:', token.slice(0, 6) + '...')

    const payload = (await req.json()) as RequestPayload
    console.log('style:', payload.style, 'num_outputs:', payload.num_outputs, 'refs:', payload.reference_urls?.length)

    if (!payload.selfie_url) throw new Error('selfie_url is required')
    if (!payload.reference_urls || payload.reference_urls.length === 0) {
      throw new Error('At least one reference_url is required')
    }

    const prediction = await createPrediction(token, payload)

    const output =
      prediction.status === 'succeeded' && prediction.output
        ? prediction.output
        : await pollPrediction(token, prediction.id)

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
