import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import { supabase } from './supabase'

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('Push notifications only work on physical devices')
    return null
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission not granted')
      return null
    }

    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: 'your-expo-project-id', // TODO: Replace with actual project ID
    })).data

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      })
    }

    return token
  } catch (error) {
    console.error('Error getting push token:', error)
    return null
  }
}

export async function savePushToken(userId: string, token: string) {
  try {
    const deviceId = await getDeviceId()
    const deviceType = Platform.OS

    await supabase.from('push_tokens').upsert(
      {
        user_id: userId,
        expo_push_token: token,
        device_id: deviceId,
        device_type: deviceType,
        is_active: true,
        last_used_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,expo_push_token',
      }
    )
  } catch (error) {
    console.error('Error saving push token:', error)
  }
}

export async function removePushToken(userId: string, token: string) {
  try {
    await supabase
      .from('push_tokens')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('expo_push_token', token)
  } catch (error) {
    console.error('Error removing push token:', error)
  }
}

async function getDeviceId(): Promise<string> {
  // In a real app, you'd use a proper device ID
  // For now, use a combination of device info
  const deviceInfo = await Device.getDeviceTypeAsync()
  return `${Platform.OS}-${deviceInfo}-${Date.now()}`
}

export function addNotificationReceivedListener(
  listener: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(listener)
}

export function addNotificationResponseReceivedListener(
  listener: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(listener)
}
