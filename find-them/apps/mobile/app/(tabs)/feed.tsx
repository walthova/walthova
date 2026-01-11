import { useState, useEffect } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { getNearbyPosts, getNearbySightings, PetPost, SightingPost } from '@/services/api'
import { getCurrentLocation } from '@/services/location'
import { formatDistance } from '@/services/location'

type FeedItem = (PetPost | SightingPost) & { type: 'lost' | 'sighting' }

export default function Feed() {
  const [items, setItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [radiusMiles, setRadiusMiles] = useState(25)

  useEffect(() => {
    loadFeed()
  }, [radiusMiles])

  const loadFeed = async () => {
    try {
      const location = await getCurrentLocation()
      if (!location) {
        // Handle no location permission
        setLoading(false)
        return
      }

      // Load both lost posts and sightings
      const [posts, sightings] = await Promise.all([
        getNearbyPosts(location, radiusMiles),
        getNearbySightings(location, radiusMiles),
      ])

      // Combine and sort by distance
      const combined: FeedItem[] = [
        ...posts.map((p) => ({ ...p, type: 'lost' as const })),
        ...sightings.map((s) => ({ ...s, type: 'sighting' as const })),
      ]

      combined.sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0))

      setItems(combined)
    } catch (error) {
      console.error('Error loading feed:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    loadFeed()
  }

  const renderItem = ({ item }: { item: FeedItem }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/post/${item.id}?type=${item.type}`)}
    >
      {item.photos.length > 0 && (
        <Image source={{ uri: item.photos[0] }} style={styles.cardImage} />
      )}
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>
            {item.type === 'lost' ? `Lost: ${(item as PetPost).pet_name}` : 'Sighting'}
          </Text>
          <View style={[styles.badge, item.type === 'lost' ? styles.lostBadge : styles.sightingBadge]}>
            <Text style={styles.badgeText}>
              {item.type === 'lost' ? 'Lost' : 'Sighting'}
            </Text>
          </View>
        </View>
        <Text style={styles.cardDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.cardFooter}>
          <Text style={styles.distance}>
            {item.distance_miles ? formatDistance(item.distance_miles) : 'Nearby'}
          </Text>
          <Text style={styles.time}>
            {new Date(
              item.type === 'lost'
                ? (item as PetPost).last_seen_at
                : (item as SightingPost).sighted_at
            ).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No posts nearby</Text>
            <Text style={styles.emptySubtext}>Be the first to post a sighting!</Text>
          </View>
        }
      />

      {/* FAB for quick sighting */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/create-sighting')}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#e0e0e0',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  lostBadge: {
    backgroundColor: '#FF3B30',
  },
  sightingBadge: {
    backgroundColor: '#007AFF',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  distance: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  empty: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
})
