import { Pressable, StyleSheet, Text, View } from 'react-native'
import { STYLE_OPTIONS, StyleOption } from '@/constants'

interface StyleSelectorProps {
  value: StyleOption
  onChange: (style: StyleOption) => void
}

export function StyleSelector({ value, onChange }: StyleSelectorProps) {
  return (
    <View style={styles.container}>
      {STYLE_OPTIONS.map((option) => {
        const active = option.id === value
        return (
          <Pressable
            key={option.id}
            style={[styles.button, active && styles.buttonActive]}
            onPress={() => onChange(option.id)}
          >
            <Text style={[styles.label, active && styles.labelActive]}>
              {option.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#444',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  buttonActive: {
    borderColor: '#ffffff',
    backgroundColor: '#2a2a2a',
  },
  label: {
    fontSize: 15,
    color: '#888',
    fontWeight: '500',
  },
  labelActive: {
    color: '#ffffff',
  },
})
