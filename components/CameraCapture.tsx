import { CameraView, useCameraPermissions } from 'expo-camera'
import { useRef } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'

interface CameraCaptureProps {
  onCapture: (uri: string) => void
}

export function CameraCapture({ onCapture }: CameraCaptureProps) {
  const [permission, requestPermission] = useCameraPermissions()
  const cameraRef = useRef<CameraView>(null)

  if (!permission) {
    return <View style={styles.container} />
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Camera access is required to take a selfie.</Text>
        <Pressable style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonLabel}>Allow Camera</Text>
        </Pressable>
      </View>
    )
  }

  async function handleCapture() {
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 1 })
      if (photo?.uri) {
        onCapture(photo.uri)
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to take photo. Please try again.')
    }
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="front" />
      <View style={styles.controls}>
        <Pressable style={styles.shutter} onPress={handleCapture}>
          <View style={styles.shutterInner} />
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    alignItems: 'center',
  },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    padding: 32,
    gap: 16,
  },
  permissionText: {
    color: '#aaa',
    fontSize: 15,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  permissionButtonLabel: {
    color: '#000',
    fontWeight: '600',
    fontSize: 15,
  },
})
