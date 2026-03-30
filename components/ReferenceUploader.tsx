import * as ImagePicker from 'expo-image-picker'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { ImageCard } from '@/components/ImageCard'

interface ReferenceUploaderProps {
  images: string[]
  onAdd: (uri: string) => void
  onRemove: (index: number) => void
}

export function ReferenceUploader({ images, onAdd, onRemove }: ReferenceUploaderProps) {
  async function handlePick() {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow access to your photo library.')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 1,
      })

      if (!result.canceled) {
        for (const asset of result.assets) {
          onAdd(asset.uri)
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to open photo library.')
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {images.map((uri, index) => (
          <View key={`${uri}-${index}`} style={styles.thumb}>
            <ImageCard uri={uri} style={styles.thumbImage} />
            <Pressable style={styles.removeButton} onPress={() => onRemove(index)}>
              <Text style={styles.removeLabel}>✕</Text>
            </Pressable>
          </View>
        ))}
        <Pressable style={styles.addButton} onPress={handlePick}>
          <Text style={styles.addIcon}>+</Text>
          <Text style={styles.addLabel}>Add Photo</Text>
        </Pressable>
      </ScrollView>
    </View>
  )
}

const THUMB_SIZE = 100

const styles = StyleSheet.create({
  container: {
    minHeight: THUMB_SIZE + 8,
  },
  row: {
    gap: 12,
    paddingHorizontal: 4,
    alignItems: 'flex-start',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
  },
  thumbImage: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 10,
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ff3b30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeLabel: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },
  addButton: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#444',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    gap: 4,
  },
  addIcon: {
    fontSize: 24,
    color: '#888',
    lineHeight: 28,
  },
  addLabel: {
    fontSize: 11,
    color: '#888',
  },
})
