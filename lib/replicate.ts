import { StyleOption } from '@/constants'

export interface ReplicateInput {
  selfie_url: string        // public Supabase Storage URL
  reference_urls: string[]  // public Supabase Storage URLs
  style: StyleOption
  num_outputs: number
}

export interface ReplicatePrediction {
  id: string
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  output: string[] | null
  error: string | null
}
