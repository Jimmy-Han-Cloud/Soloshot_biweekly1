import { Image, StyleSheet, View, ViewStyle } from 'react-native'

interface ImageCardProps {
  uri: string
  style?: ViewStyle
}

export function ImageCard({ uri, style }: ImageCardProps) {
  return (
    <View style={[styles.container, style]}>
      <Image source={{ uri }} style={styles.image} resizeMode="cover" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  image: {
    width: '100%',
    height: '100%',
  },
})
