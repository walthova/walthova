export default function Home() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>🐕 Find Them</h1>
      <p style={{ fontSize: '1.5rem', color: '#666', marginBottom: '2rem' }}>
        Help reunite lost pets with their families
      </p>
      <p style={{ fontSize: '1rem', color: '#999', textAlign: 'center', maxWidth: '600px' }}>
        Download the app from the App Store to report lost pets, post sightings,
        and help reunite animals with their owners across the United States.
      </p>
      <div style={{ marginTop: '2rem' }}>
        <a
          href="#"
          style={{
            display: 'inline-block',
            padding: '1rem 2rem',
            backgroundColor: '#007AFF',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '12px',
            fontWeight: '600'
          }}
        >
          Download on the App Store
        </a>
      </div>
    </div>
  )
}
