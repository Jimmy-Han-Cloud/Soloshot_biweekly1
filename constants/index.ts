// API & Storage
export const SUPABASE_FUNCTION_URL = 'generate'
export const STORAGE_BUCKET_REFERENCE = 'reference-images'
export const STORAGE_BUCKET_GENERATED = 'generated-images'

// Image processing
export const IMAGE_MAX_DIMENSION = 1024
export const IMAGE_JPEG_QUALITY = 0.85

// Generation
export const GENERATION_TIMEOUT_MS = 120_000
export const GENERATION_POLL_INTERVAL_MS = 2000
export const GENERATION_OUTPUT_COUNT = 3

// Style options
export const STYLE_OPTIONS = [
  { id: 'realistic', label: 'Realistic' },
  { id: 'stylized', label: 'Stylized' },
] as const
export type StyleOption = (typeof STYLE_OPTIONS)[number]['id']
