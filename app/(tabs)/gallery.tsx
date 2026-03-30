import { useEffect, useState } from 'react'
import { ActivityIndicator, Dimensions, FlatList, StyleSheet, Text, View } from 'react-native'
import { supabase } from '@/lib/supabase'
import { STORAGE_BUCKET_GENERATED } from '@/constants'
import { ImageCard } from '@/components/ImageCard'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const NUM_COLUMNS = 2
const CARD_SIZE = (SCREEN_WIDTH - 48) / NUM_COLUMNS

export default function GalleryScreen() {
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchImages() {
      try {
        const { data, error: listError } = await supabase.storage
          .from(STORAGE_BUCKET_GENERATED)
          .list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } })

        if (listError) throw listError

        const urls = (data ?? []).map((file) => {
          const { data: urlData } = supabase.storage
            .from(STORAGE_BUCKET_GENERATED)
            .getPublicUrl(file.name)
          return urlData.publicUrl
        })

        setImageUrls(urls)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load gallery'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    fetchImages()
  }, [])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#fff" />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    )
  }

  if (imageUrls.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No generated photos yet.</Text>
        <Text style={styles.emptySubtext}>Take a selfie on the Home tab to get started.</Text>
      </View>
    )
  }

  return (
    <FlatList
      data={imageUrls}
      keyExtractor={(uri) => uri}
      numColumns={NUM_COLUMNS}
      contentContainerStyle={styles.grid}
      columnWrapperStyle={styles.row}
      renderItem={({ item }) => (
        <ImageCard uri={item} style={styles.card} />
      )}
    />
  )
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 8,
  },
  errorText: {
    color: '#ff453a',
    fontSize: 14,
    textAlign: 'center',
  },
  emptyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#666',
    fontSize: 13,
    textAlign: 'center',
  },
  grid: {
    backgroundColor: '#000',
    padding: 16,
    gap: 16,
  },
  row: {
    gap: 16,
  },
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE * 1.35,
  },
})
