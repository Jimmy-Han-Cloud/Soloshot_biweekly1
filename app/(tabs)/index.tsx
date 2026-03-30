import { router } from 'expo-router'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import { CameraCapture } from '@/components/CameraCapture'
import { useGenerationStore } from '@/store/useGenerationStore'

export default function HomeScreen() {
  const { referenceImages, setSelfie } = useGenerationStore()

  function handleCapture(uri: string) {
    setSelfie(uri)

    if (referenceImages.length === 0) {
      Alert.alert(
        'No reference photos',
        'Please add at least one full-body reference photo in Settings before generating.',
        [
          { text: 'Go to Settings', onPress: () => router.push('/(tabs)/settings') },
          { text: 'OK', style: 'cancel' },
        ]
      )
      return
    }

    router.push('/generate')
  }

  return (
    <View style={styles.container}>
      <CameraCapture onCapture={handleCapture} />
      <View style={styles.hint}>
        <Text style={styles.hintText}>
          {referenceImages.length === 0
            ? 'Add reference photos in Settings first'
            : `${referenceImages.length} reference photo${referenceImages.length > 1 ? 's' : ''} ready`}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  hint: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  hintText: {
    color: '#fff',
    fontSize: 13,
  },
})
