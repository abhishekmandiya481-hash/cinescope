export default function CastCard({ actor }) {
  const profileUrl = actor.profile_path
    ? `https://image.tmdb.org/t/p/w200${actor.profile_path}`
    : actor.custom_profile_url || 'https://via.placeholder.com/200x300?text=No+Photo';

  return (
    <div style={{
      width: '150px',
      flex: '0 0 auto',
      background: 'var(--surface)',
      borderRadius: '8px',
      overflow: 'hidden',
      textAlign: 'center',
      paddingBottom: '0.5rem'
    }}>
      <img 
        src={profileUrl} 
        alt={actor.name} 
        style={{ width: '100%', height: '225px', objectFit: 'cover' }}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(actor.name || 'Actor')}&size=300&background=random`;
        }}
      />
      <div style={{ padding: '0.5rem' }}>
        <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 'bold' }}>{actor.name}</h4>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{actor.character}</p>
      </div>
    </div>
  );
}
