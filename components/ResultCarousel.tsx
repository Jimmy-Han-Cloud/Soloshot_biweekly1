import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { ImageCard } from '@/components/ImageCard'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const CARD_WIDTH = SCREEN_WIDTH * 0.8
const CARD_HEIGHT = CARD_WIDTH * 1.4

interface ResultCarouselProps {
  results: string[]
  onSave: (uri: string) => void
}

export function ResultCarousel({ results, onSave }: ResultCarouselProps) {
  if (results.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No results yet</Text>
      </View>
    )
  }

  return (
    <ScrollView
      horizontal
      pagingEnabled={false}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      decelerationRate="fast"
      snapToInterval={CARD_WIDTH + 16}
    >
      {results.map((uri, index) => (
        <View key={`${uri}-${index}`} style={styles.card}>
          <ImageCard uri={uri} style={styles.image} />
          <Pressable style={styles.saveButton} onPress={() => onSave(uri)}>
            <Text style={styles.saveLabel}>Save to Photos</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    gap: 16,
    alignItems: 'flex-start',
  },
  card: {
    width: CARD_WIDTH,
    gap: 12,
  },
  image: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  saveButton: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveLabel: {
    color: '#000000',
    fontWeight: '600',
    fontSize: 15,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 15,
  },
})
