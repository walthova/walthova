import { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native'
import * as AppleAuthentication from 'expo-apple-authentication'
import { router } from 'expo-router'
import { signInWithApple } from '@/services/auth'

export default function Welcome() {
  const [loading, setLoading] = useState(false)

  const handleAppleSignIn = async () => {
    setLoading(true)
    try {
      const { error } = await signInWithApple()
      if (error) {
        Alert.alert('Sign In Error', error)
      } else {
        router.replace('/(tabs)/feed')
      }
    } catch (error: any) {
      Alert.alert('Error', error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🐕</Text>
        <Text style={styles.title}>Find Them</Text>
        <Text style={styles.subtitle}>
          Help reunite lost pets with their families
        </Text>
        <Text style={styles.description}>
          The national coordination layer for lost and found pets across the United States.
        </Text>
      </View>

      <View style={styles.footer}>
        {Platform.OS === 'ios' && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={12}
            style={styles.appleButton}
            onPress={handleAppleSignIn}
          />
        )}

        <TouchableOpacity
          style={styles.emailButton}
          onPress={() => router.push('/(auth)/email-signin')}
          disabled={loading}
        >
          <Text style={styles.emailButtonText}>Continue with Email</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    padding: 24,
    paddingBottom: 48,
  },
  appleButton: {
    width: '100%',
    height: 50,
    marginBottom: 12,
  },
  emailButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emailButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 16,
  },
})
