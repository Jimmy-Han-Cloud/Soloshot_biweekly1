import { router } from 'expo-router'
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import { StyleSelector } from '@/components/StyleSelector'
import { useGenerationStore } from '@/store/useGenerationStore'
import { invokeGenerate } from '@/lib/supabase'
import { compressImage, uriToBase64 } from '@/lib/imageUtils'
import { GENERATION_OUTPUT_COUNT } from '@/constants'

const STATUS_LABELS: Record<string, string> = {
  compressing: 'Compressing images…',
  uploading: 'Preparing upload…',
  generating: 'Generating your photo…',
}

export default function GenerateScreen() {
  const {
    selfieUri,
    referenceImages,
    selectedStyle,
    status,
    setStyle,
    setStatus,
    setResults,
    setError,
  } = useGenerationStore()

  const isLoading = status === 'compressing' || status === 'uploading' || status === 'generating'

  async function handleGenerate() {
    if (!selfieUri) {
      Alert.alert('No selfie', 'Please take a selfie on the Home screen first.')
      return
    }
    if (referenceImages.length === 0) {
      Alert.alert('No reference photos', 'Please add reference photos in Settings.')
      return
    }

    try {
      setStatus('compressing')

      const [compressedSelfie, ...compressedRefs] = await Promise.all([
        compressImage(selfieUri),
        ...referenceImages.map((img) => compressImage(img.uri)),
      ])

      const [selfieBase64, ...refBase64s] = await Promise.all([
        uriToBase64(compressedSelfie),
        ...compressedRefs.map((uri) => uriToBase64(uri)),
      ])

      setStatus('generating')

      const output = await invokeGenerate({
        selfie_image: selfieBase64,
        reference_images: refBase64s,
        style: selectedStyle,
        num_outputs: GENERATION_OUTPUT_COUNT,
      })

      setResults(output.map((uri, i) => ({ uri, id: `result_${Date.now()}_${i}` })))
      router.push('/preview')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed'
      setError(message)
      Alert.alert('Generation failed', message)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Style</Text>
      <Text style={styles.subtitle}>Select how you want your photo to look.</Text>

      <StyleSelector value={selectedStyle} onChange={setStyle} />

      {isLoading ? (
        <View style={styles.loadingBlock}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>{STATUS_LABELS[status] ?? 'Processing…'}</Text>
        </View>
      ) : (
        <Pressable style={styles.button} onPress={handleGenerate}>
          <Text style={styles.buttonLabel}>Generate</Text>
        </Pressable>
      )}

      {status === 'error' && (
        <Pressable style={styles.retryButton} onPress={handleGenerate}>
          <Text style={styles.retryLabel}>Retry</Text>
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 24,
    paddingTop: 40,
    gap: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: -8,
  },
  loadingBlock: {
    marginTop: 24,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#aaa',
    fontSize: 15,
  },
  button: {
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonLabel: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  retryButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#444',
    paddingVertical: 14,
    alignItems: 'center',
  },
  retryLabel: {
    color: '#aaa',
    fontSize: 15,
  },
})
