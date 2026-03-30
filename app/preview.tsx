import * as MediaLibrary from 'expo-media-library'
import { router } from 'expo-router'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import { ResultCarousel } from '@/components/ResultCarousel'
import { useGenerationStore } from '@/store/useGenerationStore'

export default function PreviewScreen() {
  const { results, reset } = useGenerationStore()
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions()

  async function handleSave(uri: string) {
    try {
      if (!mediaPermission?.granted) {
        const { granted } = await requestMediaPermission()
        if (!granted) {
          Alert.alert('Permission required', 'Please allow access to save photos.')
          return
        }
      }
      await MediaLibrary.saveToLibraryAsync(uri)
      Alert.alert('Saved', 'Photo saved to your library.')
    } catch (err) {
      Alert.alert('Error', 'Failed to save photo.')
    }
  }

  function handleRetry() {
    reset()
    router.push('/generate')
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Results</Text>
      <Text style={styles.subtitle}>
        {results.length} photo{results.length !== 1 ? 's' : ''} generated
      </Text>

      <View style={styles.carousel}>
        <ResultCarousel
          results={results.map((r) => r.uri)}
          onSave={handleSave}
        />
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryLabel}>Try Again</Text>
        </Pressable>
        <Pressable style={styles.doneButton} onPress={() => router.push('/(tabs)')}>
          <Text style={styles.doneLabel}>Done</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 32,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    paddingHorizontal: 24,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 24,
  },
  carousel: {
    flex: 1,
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
    paddingBottom: 36,
  },
  retryButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#444',
    paddingVertical: 14,
    alignItems: 'center',
  },
  retryLabel: {
    color: '#aaa',
    fontSize: 15,
    fontWeight: '500',
  },
  doneButton: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#fff',
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneLabel: {
    color: '#000',
    fontSize: 15,
    fontWeight: '700',
  },
})
