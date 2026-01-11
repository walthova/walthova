import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { supabase } from '@/services/supabase'
import { useAuthStore } from '@/stores/authStore'
import { registerForPushNotifications, savePushToken } from '@/services/notifications'

export default function RootLayout() {
  const { setUser, setLoading } = useAuthStore()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)

      // Register for push notifications if logged in
      if (session?.user) {
        registerForPushNotifications().then((token) => {
          if (token) {
            savePushToken(session.user.id, token)
          }
        })
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)

      // Register for push notifications on sign in
      if (session?.user) {
        registerForPushNotifications().then((token) => {
          if (token) {
            savePushToken(session.user.id, token)
          }
        })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="create-lost" options={{ presentation: 'modal' }} />
        <Stack.Screen name="create-sighting" options={{ presentation: 'modal' }} />
        <Stack.Screen name="post/[id]" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  )
}
