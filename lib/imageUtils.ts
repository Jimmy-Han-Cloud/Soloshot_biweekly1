import { File } from 'expo-file-system'
import * as ImageManipulator from 'expo-image-manipulator'
import { IMAGE_MAX_DIMENSION, IMAGE_JPEG_QUALITY } from '@/constants'

/**
 * Compress an image to max IMAGE_MAX_DIMENSION on the long edge at IMAGE_JPEG_QUALITY.
 * Returns a local file URI pointing to the compressed image.
 */
export async function compressImage(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: IMAGE_MAX_DIMENSION } }],
    {
      compress: IMAGE_JPEG_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  )
  return result.uri
}

/**
 * Read a local file URI and return its contents as a base64 string.
 */
export async function uriToBase64(uri: string): Promise<string> {
  const file = new File(uri)
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}
