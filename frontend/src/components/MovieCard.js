'use client';
import Link from 'next/link';
import Image from 'next/image';

export default function MovieCard({ movie }) {
  const posterUrl = movie.poster_path 
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : movie.custom_poster_url || null;

  const handleImgError = async (e) => {
    e.target.onerror = null;
    const title = encodeURIComponent(movie.title || 'Movie');
    const year = movie.year || (movie.release_date ? movie.release_date.split('-')[0] : '');
    try {
      const res = await fetch(`https://www.omdbapi.com/?t=${title}&y=${year}&apikey=trilogy`);
      const data = await res.json();
      if (data.Poster && data.Poster !== 'N/A') {
        e.target.src = data.Poster;
        return;
      }
    } catch (_) {}
    e.target.src = `https://placehold.co/500x750/1a1a2e/e2b616?text=${title}`;
  };

  return (
    <Link href={`/movie/${movie.id}`}>
      <div style={{
        position: 'relative',
        borderRadius: '8px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.4s ease',
        boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
        aspectRatio: '2/3',
        background: '#1a1a1a'
      }}
      className="movie-card"
      >
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <Image 
              src={posterUrl || `https://placehold.co/500x750/1a1a2e/e2b616?text=${encodeURIComponent(movie.title)}`}
              alt={movie.title} 
              fill
              sizes="(max-width: 480px) 150px, (max-width: 768px) 200px, 210px"
              style={{ objectFit: 'cover' }}
              onLoadingComplete={(img) => {
                if (img.naturalWidth === 0) handleImgError({ target: img });
              }}
              onError={(e) => handleImgError({ target: e.target })}
              unoptimized={posterUrl && posterUrl.includes('placeholder')}
            />
        </div>
        
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 2,
          background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.8) 40%, transparent 100%)',
          padding: '2.5rem 1rem 1.2rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          transform: 'translateY(10px)',
          opacity: 0.9,
          transition: 'transform 0.3s ease, opacity 0.3s ease'
        }} className="card-overlay">
          <h3 style={{ 
            margin: 0, 
            fontSize: '1.05rem', 
            fontWeight: 'bold', 
            color: 'white',
            lineHeight: '1.2',
            marginBottom: '4px'
          }}>{movie.title}</h3>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            fontSize: '0.85rem'
          }}>
            <span style={{ color: '#46d369', fontWeight: '900' }}>
              ★ {movie.vote_average?.toFixed(1) || '8.5'}
            </span>
            <span style={{ color: '#bcbcbc', fontWeight: 'bold' }}>
              {movie.year || (movie.release_date ? movie.release_date.split('-')[0] : '2024')}
            </span>
          </div>
        </div>

        <style jsx>{`
          .movie-card:hover {
            transform: scale(1.08);
            box-shadow: 0 15px 35px rgba(0,0,0,0.8);
            z-index: 50;
          }
          .movie-card:hover .card-overlay {
            transform: translateY(0);
            opacity: 1;
          }
        `}</style>
      </div>
    </Link>
  );
}
