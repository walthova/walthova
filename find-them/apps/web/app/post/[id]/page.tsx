import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Try to fetch as pet post first
  const { data: petPost } = await supabase
    .from('pet_posts')
    .select('*')
    .eq('id', id)
    .single()

  if (!petPost) {
    // Try as sighting post
    const { data: sightingPost } = await supabase
      .from('sighting_posts')
      .select('*')
      .eq('id', id)
      .single()

    if (!sightingPost) {
      notFound()
    }
  }

  const post = petPost
  const isLost = !!petPost

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '2rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'inline-block',
          padding: '0.5rem 1rem',
          backgroundColor: isLost ? '#FF3B30' : '#007AFF',
          color: 'white',
          borderRadius: '6px',
          marginBottom: '1rem',
          fontWeight: '600'
        }}>
          {isLost ? 'Lost Pet' : 'Sighting'}
        </div>

        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
          {isLost ? `Lost: ${post.pet_name}` : 'Pet Sighting'}
        </h1>

        {post.photos?.length > 0 && (
          <img
            src={post.photos[0]}
            alt="Pet photo"
            style={{
              width: '100%',
              maxHeight: '400px',
              objectFit: 'cover',
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}
          />
        )}

        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#666' }}>Description</h2>
          <p style={{ lineHeight: '1.6' }}>{post.description}</p>
        </div>

        {isLost && post.breed && (
          <div style={{ marginBottom: '1rem' }}>
            <strong>Breed:</strong> {post.breed}
          </div>
        )}

        {post.colors?.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <strong>Colors:</strong> {post.colors.join(', ')}
          </div>
        )}

        <div style={{ marginBottom: '1.5rem' }}>
          <strong>{isLost ? 'Last Seen:' : 'Sighted:'}</strong>{' '}
          {new Date(isLost ? post.last_seen_at : post.sighted_at).toLocaleString()}
        </div>

        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px'
        }}>
          <p style={{ marginBottom: '1rem' }}>
            Have you seen this pet? Download the Find Them app to help reunite them with their owner.
          </p>
          <a
            href="#"
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#007AFF',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600'
            }}
          >
            Download App
          </a>
        </div>
      </div>
    </div>
  )
}
