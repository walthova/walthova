# Find Them - API Documentation

## Overview

The Find Them API is built on **Supabase**, providing a PostgreSQL database with PostGIS for geospatial queries, real-time subscriptions, authentication, storage, and serverless Edge Functions.

**Base URL (Hosted):** `https://your-project.supabase.co`
**Base URL (Local):** `http://localhost:54321`

**Authentication:** All API requests require a valid Supabase auth token in the `Authorization` header:
```
Authorization: Bearer <access_token>
```

---

## Authentication

### Sign In with Apple
**Client-side implementation** using `expo-apple-authentication` and Supabase's `signInWithIdToken` method.

See `apps/mobile/services/auth.ts` for implementation.

### Sign In with Email
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})
```

### Sign Up with Email
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
  options: {
    data: {
      full_name: 'John Doe'
    }
  }
})
```

### Get Current User
```typescript
const { data: { user }, error } = await supabase.auth.getUser()
```

### Sign Out
```typescript
const { error } = await supabase.auth.signOut()
```

---

## Core Entities

### Profile
```typescript
interface Profile {
  id: string // UUID, references auth.users(id)
  display_name: string
  avatar_url: string | null
  karma_score: number
  trust_score: number // 0.0 - 1.0
  total_posts: number
  total_sightings: number
  reunions_assisted: number
  is_shadow_banned: boolean
  is_verified: boolean
  preferences: {
    notifications: {
      matches: boolean
      nearby_posts: boolean
      comments: boolean
      karma: boolean
    }
    privacy: {
      show_location_exact: boolean
      public_profile: boolean
    }
  }
  created_at: string
  updated_at: string
}
```

### Pet Post (Lost Pet)
```typescript
interface PetPost {
  id: string
  user_id: string
  pet_name: string
  animal_type: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other'
  breed: string | null
  colors: string[]
  age_estimate: string | null
  size: string | null
  distinguishing_marks: string | null
  microchip_id: string | null
  description: string
  photos: string[] // Supabase Storage URLs
  last_seen_location: Geography // PostGIS point
  last_seen_address: string | null
  location_accuracy_meters: number | null
  last_seen_at: string // ISO timestamp
  status: 'active' | 'reunited' | 'archived' | 'removed'
  visibility: 'public' | 'community' | 'limited'
  contact_method: string
  contact_phone: string | null
  view_count: number
  share_count: number
  helpful_sightings_count: number
  reunited_at: string | null
  reunion_story: string | null
  created_at: string
  updated_at: string
}
```

### Sighting Post (Found/Seen Pet)
```typescript
interface SightingPost {
  id: string
  user_id: string
  animal_type: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other'
  description: string
  photos: string[]
  colors: string[]
  sighting_location: Geography // PostGIS point
  sighting_address: string | null
  location_accuracy_meters: number | null
  sighted_at: string // ISO timestamp (when pet was seen, not when posted)
  status: 'active' | 'reunited' | 'archived' | 'removed'
  visibility: 'public' | 'community' | 'limited'
  matched_pet_post_id: string | null
  marked_helpful_by: string[] // Array of user IDs
  view_count: number
  created_at: string
  updated_at: string
}
```

### Match
```typescript
interface Match {
  id: string
  pet_post_id: string
  sighting_post_id: string
  match_score: number // 0-100
  distance_meters: number
  time_difference_hours: number
  score_details: object
  dismissed_by: string[] // User IDs
  confirmed_by: string[] // User IDs
  is_active: boolean
  created_at: string
  notified_at: string | null
}
```

---

## API Endpoints

### Profiles

#### Get Current User Profile
```typescript
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single()
```

#### Update Profile
```typescript
const { data, error } = await supabase
  .from('profiles')
  .update({
    display_name: 'New Name',
    avatar_url: 'https://...',
    preferences: { ... }
  })
  .eq('id', user.id)
```

---

### Pet Posts

#### Get Nearby Pet Posts (RPC)
```typescript
const { data, error } = await supabase.rpc('get_nearby_pet_posts', {
  user_lat: 37.7749,
  user_lng: -122.4194,
  radius_miles: 25,
  limit_count: 20,
  offset_count: 0
})

// Returns array of PetPost with distance_miles field
```

#### Create Pet Post
```typescript
const { data, error } = await supabase
  .from('pet_posts')
  .insert({
    user_id: user.id,
    pet_name: 'Max',
    animal_type: 'dog',
    breed: 'Golden Retriever',
    colors: ['golden', 'light brown'],
    description: 'Friendly dog, answers to Max...',
    photos: ['https://...'],
    last_seen_location: `POINT(-122.4194 37.7749)`, // lon, lat
    last_seen_address: 'Dolores Park, San Francisco',
    location_accuracy_meters: 10,
    last_seen_at: new Date().toISOString(),
  })
  .select()
  .single()
```

#### Get Pet Post by ID
```typescript
const { data, error } = await supabase
  .from('pet_posts')
  .select('*')
  .eq('id', postId)
  .single()
```

#### Update Pet Post
```typescript
const { data, error } = await supabase
  .from('pet_posts')
  .update({ description: 'Updated description' })
  .eq('id', postId)
  .eq('user_id', user.id) // Ensure user owns post
```

#### Mark as Reunited (RPC)
```typescript
const { error } = await supabase.rpc('mark_as_reunited', {
  p_pet_post_id: postId,
  p_helpful_sighting_ids: ['sighting-id-1', 'sighting-id-2'],
  p_reunion_story: 'Found him at the park thanks to your help!'
})

// Automatically awards karma to helpers
```

---

### Sighting Posts

#### Get Nearby Sightings (RPC)
```typescript
const { data, error } = await supabase.rpc('get_nearby_sightings', {
  user_lat: 37.7749,
  user_lng: -122.4194,
  radius_miles: 25,
  limit_count: 20,
  offset_count: 0
})
```

#### Create Sighting Post
```typescript
const { data, error } = await supabase
  .from('sighting_posts')
  .insert({
    user_id: user.id,
    animal_type: 'dog',
    description: 'Saw a golden retriever near the playground',
    photos: ['https://...'],
    colors: ['golden', 'brown'],
    sighting_location: `POINT(-122.4194 37.7749)`,
    sighting_address: 'Near playground, Dolores Park',
    location_accuracy_meters: 15,
    sighted_at: new Date().toISOString(),
  })
  .select()
  .single()
```

---

### Matches

#### Get Matches for User's Posts
```typescript
const { data, error } = await supabase
  .from('matches')
  .select(`
    *,
    pet_post:pet_posts(*),
    sighting_post:sighting_posts(*)
  `)
  .or(`pet_post_id.in.(${userPetPostIds.join(',')}),sighting_post_id.in.(${userSightingIds.join(',')})`)
  .order('match_score', { ascending: false })
```

#### Dismiss Match
```typescript
const { error } = await supabase
  .from('matches')
  .update({
    dismissed_by: supabase.rpc('array_append', {
      array: dismissed_by,
      element: user.id
    })
  })
  .eq('id', matchId)
```

---

### Karma

#### Get User Karma Ledger
```typescript
const { data, error } = await supabase
  .from('karma_ledger')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
```

#### Award Karma (RPC - typically called server-side)
```typescript
const { data, error } = await supabase.rpc('award_karma', {
  p_user_id: userId,
  p_amount: 50,
  p_reason: 'sighting_helpful',
  p_description: 'Sighting helped reunite pet',
  p_related_post_id: sightingId,
  p_awarded_by: ownerId
})
```

---

### Reports & Moderation

#### Report Post
```typescript
const { error } = await supabase
  .from('reports')
  .insert({
    reporter_id: user.id,
    reported_post_id: postId,
    post_type: 'lost', // or 'sighting'
    reason: 'spam',
    description: 'This post appears to be spam'
  })
```

#### Block User
```typescript
const { error } = await supabase
  .from('blocks')
  .insert({
    blocker_id: user.id,
    blocked_id: userToBlockId
  })
```

---

### Storage (Photos)

#### Upload Photo
```typescript
// Convert image URI to blob
const response = await fetch(imageUri)
const blob = await response.blob()

const fileExt = imageUri.split('.').pop()
const fileName = `${user.id}/${Date.now()}.${fileExt}`

const { data, error } = await supabase.storage
  .from('pet-photos')
  .upload(fileName, blob, {
    contentType: 'image/jpeg',
  })

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('pet-photos')
  .getPublicUrl(data.path)
```

#### Delete Photo
```typescript
const { error } = await supabase.storage
  .from('pet-photos')
  .remove([fileName])
```

---

### Push Notifications

#### Register Push Token
```typescript
const { error } = await supabase
  .from('push_tokens')
  .upsert({
    user_id: user.id,
    expo_push_token: expoPushToken,
    device_id: deviceId,
    device_type: 'ios',
    is_active: true,
    last_used_at: new Date().toISOString()
  }, {
    onConflict: 'user_id,expo_push_token'
  })
```

---

## Edge Functions

### match-engine
**Trigger:** Cron job (every 5 minutes) or manual invocation

**Purpose:** Find potential matches between new sightings and active lost pet posts, create Match records, send push notifications.

**Endpoint:**
```
POST https://your-project.supabase.co/functions/v1/match-engine
Authorization: Bearer <service_role_key>
```

**Response:**
```json
{
  "success": true,
  "matchesCreated": 3,
  "notificationsSent": 6,
  "processed": {
    "petPosts": 120,
    "sightings": 8
  }
}
```

**How it works:**
1. Fetches all active pet posts from last 30 days
2. Fetches new sightings from last hour
3. For each sighting, calculates match score against all pet posts
4. If score ≥ 70, creates Match and sends push notifications to both users

---

## Real-Time Subscriptions

### Subscribe to Nearby Posts
```typescript
const channel = supabase
  .channel('nearby-posts')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'pet_posts',
      filter: `status=eq.active`
    },
    (payload) => {
      // New lost pet post created
      console.log('New post:', payload.new)
    }
  )
  .subscribe()
```

### Subscribe to Matches
```typescript
const channel = supabase
  .channel('my-matches')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'matches',
      filter: `pet_post_id=eq.${myPetPostId}`
    },
    (payload) => {
      // New match for my lost pet
      console.log('New match:', payload.new)
    }
  )
  .subscribe()
```

---

## Row Level Security (RLS) Policies

All tables have RLS enabled. Key policies:

### pet_posts
- **SELECT:** Public posts viewable by everyone, private posts only by owner
- **INSERT:** Authenticated users can create posts
- **UPDATE/DELETE:** Only post owner

### sighting_posts
- **SELECT:** Public sightings viewable by everyone
- **INSERT:** Authenticated users can create sightings
- **UPDATE/DELETE:** Only sighting owner

### matches
- **SELECT:** Viewable by users who own either the pet_post or sighting_post
- **UPDATE:** Only pet_post owner can update (dismiss, confirm)

### karma_ledger
- **SELECT:** Users can view their own karma
- **INSERT:** Service role only (prevents karma manipulation)

### reports, blocks
- **SELECT/INSERT/DELETE:** Only for user's own reports/blocks

---

## Rate Limits

**Client-side enforcement:**
- Max 10 pet posts per day
- Max 5 karma-eligible sightings per day

**Server-side (via Supabase):**
- API requests: 500 req/min per IP (configurable)

---

## Error Handling

### Common Errors

**401 Unauthorized:**
```json
{
  "error": "JWT expired",
  "code": "PGRST301"
}
```
**Fix:** Refresh auth token

**403 Forbidden:**
```json
{
  "error": "new row violates row-level security policy"
}
```
**Fix:** User doesn't have permission for this action

**404 Not Found:**
```json
{
  "error": "No rows found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Database error"
}
```
**Fix:** Check Supabase logs

---

## Best Practices

1. **Use RPC functions for complex queries:** Geospatial queries, match calculations
2. **Batch uploads:** Upload photos in parallel, but limit to 5 at a time
3. **Optimize images:** Compress before upload (< 2MB per photo)
4. **Cache profiles:** Store user profile in Zustand to avoid repeated queries
5. **Real-time subscriptions:** Use sparingly to avoid connection overhead
6. **Error handling:** Always check `error` object before using `data`
7. **Pagination:** Use `offset` and `limit` for large datasets
8. **Security:** Never expose service role key in client code

---

## Testing API Calls

### Using Supabase CLI
```bash
# Start local Supabase
supabase start

# Test RPC function
supabase db execute "SELECT * FROM get_nearby_pet_posts(37.7749, -122.4194, 25, 20, 0);"
```

### Using Postman/Insomnia
```
POST https://your-project.supabase.co/rest/v1/rpc/get_nearby_pet_posts
Authorization: Bearer <anon_key>
Content-Type: application/json

{
  "user_lat": 37.7749,
  "user_lng": -122.4194,
  "radius_miles": 25,
  "limit_count": 20,
  "offset_count": 0
}
```

---

## Monitoring & Observability

### Supabase Dashboard
- **Database:** View tables, run queries
- **Storage:** View uploaded files
- **Auth:** View users, sessions
- **Logs:** View real-time logs for Edge Functions, DB queries

### Sentry (Recommended for production)
- Track client-side errors
- Monitor API failure rates
- Alert on critical errors

---

**API Version:** 1.0
**Last Updated:** 2026-01-11
