import { StyleSheet, Text, View } from 'react-native'
import { ReferenceUploader } from '@/components/ReferenceUploader'
import { useGenerationStore } from '@/store/useGenerationStore'

export default function SettingsScreen() {
  const { referenceImages, addReferenceImage, removeReferenceImage } = useGenerationStore()

  function handleRemove(index: number) {
    const image = referenceImages[index]
    if (image) removeReferenceImage(image.id)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reference Photos</Text>
      <Text style={styles.subtitle}>
        Upload full-body photos of yourself so the AI can place you in the scene.
      </Text>
      <ReferenceUploader
        images={referenceImages.map((img) => img.uri)}
        onAdd={addReferenceImage}
        onRemove={handleRemove}
      />
      {referenceImages.length > 0 && (
        <Text style={styles.count}>
          {referenceImages.length} photo{referenceImages.length > 1 ? 's' : ''} added
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 24,
    paddingTop: 32,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
  },
  count: {
    fontSize: 13,
    color: '#555',
    marginTop: 4,
  },
})
