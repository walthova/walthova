import * as AppleAuthentication from 'expo-apple-authentication'
import * as Crypto from 'expo-crypto'
import { supabase } from './supabase'

export async function signInWithApple() {
  try {
    const nonce = await generateNonce()
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      nonce
    )

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    })

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken!,
      nonce,
    })

    if (error) throw error

    // If this is a new user, update their profile with their name
    if (credential.fullName?.givenName) {
      const displayName = `${credential.fullName.givenName} ${credential.fullName.familyName || ''}`.trim()
      await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('id', data.user!.id)
    }

    return { data, error: null }
  } catch (error: any) {
    if (error.code === 'ERR_REQUEST_CANCELED') {
      return { data: null, error: 'Sign in was cancelled' }
    }
    return { data: null, error: error.message }
  }
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export async function signUpWithEmail(email: string, password: string, displayName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: displayName,
      },
    },
  })
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

// Helper function to generate a random nonce
async function generateNonce(length = 32): Promise<string> {
  const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._'
  const result: string[] = []
  const randomBytes = await Crypto.getRandomBytesAsync(length)

  randomBytes.forEach((byte) => {
    result.push(charset[byte % charset.length])
  })

  return result.join('')
}
