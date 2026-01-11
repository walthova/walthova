import { useEffect } from 'react'
import { Redirect } from 'expo-router'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { useAuthStore } from '@/stores/authStore'

export default function Index() {
  const { user, loading } = useAuthStore()

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    )
  }

  // Redirect based on auth state
  if (user) {
    return <Redirect href="/(tabs)/feed" />
  } else {
    return <Redirect href="/(auth)/welcome" />
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
})
