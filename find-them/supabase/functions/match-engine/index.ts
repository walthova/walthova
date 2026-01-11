// Edge Function: Match Engine
// Runs periodically to match sightings with lost pet posts
// Triggered by cron job or webhook

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const MATCH_THRESHOLD = 70 // Minimum score to create a match
const MAX_DISTANCE_MILES = 50 // Don't match if > 50 miles apart

interface PetPost {
  id: string
  user_id: string
  animal_type: string
  last_seen_location: { coordinates: [number, number] }
  colors: string[]
}

interface SightingPost {
  id: string
  user_id: string
  animal_type: string
  sighting_location: { coordinates: [number, number] }
  colors: string[]
}

serve(async (req) => {
  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Get all active pet posts from the last 30 days
    const { data: petPosts, error: petPostsError } = await supabaseClient
      .from('pet_posts')
      .select('id, user_id, animal_type, last_seen_location, colors, last_seen_at')
      .eq('status', 'active')
      .gte('last_seen_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    if (petPostsError) throw petPostsError

    // Get new sightings from the last hour (only process recent ones)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { data: sightings, error: sightingsError } = await supabaseClient
      .from('sighting_posts')
      .select('id, user_id, animal_type, sighting_location, colors, sighted_at')
      .eq('status', 'active')
      .gte('created_at', oneHourAgo)

    if (sightingsError) throw sightingsError

    console.log(`Processing ${petPosts?.length ?? 0} pet posts and ${sightings?.length ?? 0} new sightings`)

    let matchesCreated = 0
    let notificationsSent = 0

    // For each new sighting, check against all active pet posts
    for (const sighting of sightings ?? []) {
      for (const petPost of petPosts ?? []) {
        // Skip if same user (can't match your own posts)
        if (sighting.user_id === petPost.user_id) continue

        // Quick animal type filter
        if (sighting.animal_type !== petPost.animal_type) continue

        // Calculate match score using database function
        const { data: scoreData, error: scoreError } = await supabaseClient
          .rpc('calculate_match_score', {
            pet_post_id_input: petPost.id,
            sighting_post_id_input: sighting.id,
          })

        if (scoreError) {
          console.error('Error calculating score:', scoreError)
          continue
        }

        const matchScore = scoreData as number

        if (matchScore >= MATCH_THRESHOLD) {
          // Check if match already exists
          const { data: existingMatch } = await supabaseClient
            .from('matches')
            .select('id')
            .eq('pet_post_id', petPost.id)
            .eq('sighting_post_id', sighting.id)
            .single()

          if (!existingMatch) {
            // Create new match
            const { data: newMatch, error: matchError } = await supabaseClient
              .from('matches')
              .insert({
                pet_post_id: petPost.id,
                sighting_post_id: sighting.id,
                match_score: matchScore,
                distance_meters: 0, // Calculated in score function
                time_difference_hours: 0,
                score_details: {
                  calculated_at: new Date().toISOString(),
                  threshold: MATCH_THRESHOLD,
                },
              })
              .select()
              .single()

            if (matchError) {
              console.error('Error creating match:', matchError)
              continue
            }

            matchesCreated++

            // Send push notifications
            await sendMatchNotifications(
              supabaseClient,
              petPost.user_id,
              sighting.user_id,
              newMatch.id,
              matchScore
            )
            notificationsSent += 2 // Owner + sighter
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        matchesCreated,
        notificationsSent,
        processed: {
          petPosts: petPosts?.length ?? 0,
          sightings: sightings?.length ?? 0,
        },
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Match engine error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

async function sendMatchNotifications(
  supabaseClient: any,
  ownerId: string,
  sighterId: string,
  matchId: string,
  score: number
) {
  // Get push tokens for both users
  const { data: ownerTokens } = await supabaseClient
    .from('push_tokens')
    .select('expo_push_token')
    .eq('user_id', ownerId)
    .eq('is_active', true)

  const { data: sighterTokens } = await supabaseClient
    .from('push_tokens')
    .select('expo_push_token')
    .eq('user_id', sighterId)
    .eq('is_active', true)

  // Send notifications via Expo Push API
  const messages = []

  // Notify owner
  for (const token of ownerTokens ?? []) {
    messages.push({
      to: token.expo_push_token,
      sound: 'default',
      title: '🐕 Possible Match!',
      body: `Someone may have seen your pet! Match confidence: ${score}%`,
      data: { matchId, type: 'match' },
    })
  }

  // Notify sighter
  for (const token of sighterTokens ?? []) {
    messages.push({
      to: token.expo_push_token,
      sound: 'default',
      title: '✨ Your sighting matched!',
      body: `Your sighting may help reunite a pet! Match: ${score}%`,
      data: { matchId, type: 'match' },
    })
  }

  if (messages.length > 0) {
    // Send to Expo Push API
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    })
  }

  // Update match as notified
  await supabaseClient
    .from('matches')
    .update({ notified_at: new Date().toISOString() })
    .eq('id', matchId)
}
