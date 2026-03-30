import { StyleOption } from '@/constants'

export interface ReplicateInput {
  selfie_image: string        // base64 data URI
  reference_images: string[]  // base64 data URIs
  style: StyleOption
  num_outputs: number
}

export interface ReplicatePrediction {
  id: string
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  output: string[] | null
  error: string | null
}
