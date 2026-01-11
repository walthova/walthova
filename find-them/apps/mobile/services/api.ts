import { supabase } from './supabase'
import { LocationCoords } from './location'

export interface PetPost {
  id: string
  user_id: string
  pet_name: string
  animal_type: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other'
  breed?: string
  colors: string[]
  description: string
  photos: string[]
  last_seen_at: string
  status: 'active' | 'reunited' | 'archived'
  distance_miles?: number
  created_at: string
}

export interface SightingPost {
  id: string
  user_id: string
  animal_type: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other'
  description: string
  photos: string[]
  colors: string[]
  sighted_at: string
  status: 'active' | 'reunited' | 'archived'
  distance_miles?: number
  created_at: string
}

export interface CreatePetPostInput {
  pet_name: string
  animal_type: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other'
  breed?: string
  colors: string[]
  description: string
  photos: string[]
  location: LocationCoords
  address?: string
  last_seen_at: Date
}

export interface CreateSightingInput {
  animal_type: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other'
  description: string
  photos: string[]
  colors: string[]
  location: LocationCoords
  address?: string
  sighted_at: Date
}

export async function getNearbyPosts(
  location: LocationCoords,
  radiusMiles: number = 25,
  limit: number = 20,
  offset: number = 0
) {
  const { data, error } = await supabase.rpc('get_nearby_pet_posts', {
    user_lat: location.latitude,
    user_lng: location.longitude,
    radius_miles: radiusMiles,
    limit_count: limit,
    offset_count: offset,
  })

  if (error) throw error
  return data as PetPost[]
}

export async function getNearbySightings(
  location: LocationCoords,
  radiusMiles: number = 25,
  limit: number = 20,
  offset: number = 0
) {
  const { data, error } = await supabase.rpc('get_nearby_sightings', {
    user_lat: location.latitude,
    user_lng: location.longitude,
    radius_miles: radiusMiles,
    limit_count: limit,
    offset_count: offset,
  })

  if (error) throw error
  return data as SightingPost[]
}

export async function createPetPost(input: CreatePetPostInput) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('pet_posts')
    .insert({
      user_id: user.id,
      pet_name: input.pet_name,
      animal_type: input.animal_type,
      breed: input.breed,
      colors: input.colors,
      description: input.description,
      photos: input.photos,
      last_seen_location: `POINT(${input.location.longitude} ${input.location.latitude})`,
      last_seen_address: input.address,
      location_accuracy_meters: input.location.accuracy,
      last_seen_at: input.last_seen_at.toISOString(),
    })
    .select()
    .single()

  if (error) throw error

  // Award karma for posting
  await awardKarma(user.id, 10, 'sighting_posted', 'Posted a lost pet report')

  return data
}

export async function createSighting(input: CreateSightingInput) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('sighting_posts')
    .insert({
      user_id: user.id,
      animal_type: input.animal_type,
      description: input.description,
      photos: input.photos,
      colors: input.colors,
      sighting_location: `POINT(${input.location.longitude} ${input.location.latitude})`,
      sighting_address: input.address,
      location_accuracy_meters: input.location.accuracy,
      sighted_at: input.sighted_at.toISOString(),
    })
    .select()
    .single()

  if (error) throw error

  // Award karma for posting sighting
  await awardKarma(user.id, 10, 'sighting_posted', 'Posted a sighting')

  return data
}

export async function uploadPhoto(uri: string, bucket: string = 'pet-photos'): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Convert URI to blob
  const response = await fetch(uri)
  const blob = await response.blob()

  const fileExt = uri.split('.').pop()
  const fileName = `${user.id}/${Date.now()}.${fileExt}`

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, blob, {
      contentType: 'image/jpeg',
    })

  if (error) throw error

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path)

  return publicUrl
}

export async function markAsReunited(
  petPostId: string,
  helpfulSightingIds: string[],
  reunionStory?: string
) {
  const { error } = await supabase.rpc('mark_as_reunited', {
    p_pet_post_id: petPostId,
    p_helpful_sighting_ids: helpfulSightingIds,
    p_reunion_story: reunionStory,
  })

  if (error) throw error
}

export async function reportPost(
  postId: string,
  postType: 'lost' | 'sighting',
  reason: string,
  description?: string
) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('reports').insert({
    reporter_id: user.id,
    reported_post_id: postId,
    post_type: postType,
    reason: reason,
    description: description,
  })

  if (error) throw error
}

export async function blockUser(blockedUserId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('blocks').insert({
    blocker_id: user.id,
    blocked_id: blockedUserId,
  })

  if (error) throw error
}

async function awardKarma(
  userId: string,
  amount: number,
  reason: string,
  description: string
) {
  await supabase.rpc('award_karma', {
    p_user_id: userId,
    p_amount: amount,
    p_reason: reason,
    p_description: description,
  })
}
