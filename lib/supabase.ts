import { createClient } from '@supabase/supabase-js'
import { File } from 'expo-file-system'
import { ReplicateInput } from '@/lib/replicate'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Upload a local file URI to a Supabase Storage bucket.
 * Returns the public URL of the uploaded file.
 */
export async function uploadImage(
  bucket: string,
  path: string,
  uri: string
): Promise<string> {
  const file = new File(uri)
  const buffer = await file.arrayBuffer()

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, { contentType: 'image/jpeg', upsert: true })

  if (error) throw new Error(`Upload failed: ${error.message}`)

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

/**
 * Invoke the Supabase Edge Function "generate" with the given payload.
 * Returns an array of generated image URLs.
 */
export async function invokeGenerate(payload: ReplicateInput): Promise<string[]> {
  const { data, error } = await supabase.functions.invoke('generate', {
    body: payload,
  })

  if (error) {
    // Try to extract the actual error message from the Edge Function response body
    const context = (error as { context?: { json?: () => Promise<{error?: string}> } }).context
    if (context?.json) {
      try {
        const body = await context.json()
        if (body?.error) throw new Error(body.error)
      } catch (parseErr) {
        if (parseErr instanceof Error && parseErr.message !== 'Generation failed') throw parseErr
      }
    }
    throw new Error(`Generation failed: ${error.message}`)
  }

  const result = data as { output?: string[]; error?: string }
  if (result.error) throw new Error(result.error)
  if (!result.output || result.output.length === 0) {
    throw new Error('No output returned from generation')
  }

  return result.output
}
