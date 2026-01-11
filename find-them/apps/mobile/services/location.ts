import * as Location from 'expo-location'

export interface LocationCoords {
  latitude: number
  longitude: number
  accuracy?: number
}

export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync()
  return status === 'granted'
}

export async function getCurrentLocation(): Promise<LocationCoords | null> {
  try {
    const hasPermission = await requestLocationPermission()
    if (!hasPermission) {
      return null
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    })

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy ?? undefined,
    }
  } catch (error) {
    console.error('Error getting location:', error)
    return null
  }
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude, longitude })
    if (results.length > 0) {
      const address = results[0]
      const parts = [
        address.street,
        address.city,
        address.region,
        address.postalCode,
      ].filter(Boolean)
      return parts.join(', ')
    }
    return null
  } catch (error) {
    console.error('Error reverse geocoding:', error)
    return null
  }
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // Haversine formula to calculate distance in miles
  const R = 3958.8 // Earth radius in miles
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}

export function formatDistance(miles: number): string {
  if (miles < 0.1) {
    return 'Nearby'
  } else if (miles < 1) {
    return `${(miles * 5280).toFixed(0)} ft away`
  } else if (miles < 10) {
    return `${miles.toFixed(1)} mi away`
  } else {
    return `${Math.round(miles)} mi away`
  }
}
