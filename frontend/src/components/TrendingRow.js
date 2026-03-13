'use client';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import TrailerModal from './TrailerModal';
import { api } from '../services/api';

export default function TrendingRow({ title, movies }) {
  const router = useRouter();
  const scrollRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [selectedTrailer, setSelectedTrailer] = useState(null);

  const handlePlayTrailer = async (e, movie) => {
    e.stopPropagation();
    try {
      const movieData = await api.get(`/movies/${movie.id}`);
      const trailer = movieData.videos?.results?.find(vid => vid.type === 'Trailer' && vid.site === 'YouTube');
      if (trailer) {
        setSelectedTrailer(trailer.key);
      } else {
        alert("Trailer not available for this movie.");
      }
    } catch (err) {
      console.error("Error fetching trailer", err);
    }
  };

  const handleImgError = async (e, movie) => {
    e.target.onerror = null;
    const movieTitle = encodeURIComponent(movie.title || 'Movie');
    const year = movie.year || (movie.release_date ? movie.release_date.split('-')[0] : '');
    try {
      const res = await fetch(`https://www.omdbapi.com/?t=${movieTitle}&y=${year}&apikey=trilogy`);
      const data = await res.json();
      if (data.Poster && data.Poster !== 'N/A') {
        e.target.src = data.Poster;
        return;
      }
    } catch (_) {}
    e.target.src = `https://placehold.co/500x750/1a1a2e/e2b616?text=${movieTitle}`;
  };

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth * 0.8 : scrollLeft + clientWidth * 0.8;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      setShowLeft(scrollRef.current.scrollLeft > 50);
    }
  };

  if (!movies || movies.length === 0) return null;

  return (
    <div style={{ padding: '2rem 0', overflow: 'hidden', position: 'relative' }} className="trending-container">
      <h2 style={{ 
        fontSize: 'clamp(1.2rem, 5vw, 1.6rem)', 
        marginBottom: '0.8rem', 
        paddingLeft: 'var(--container-padding)', 
        fontWeight: 'bold',
        color: '#e5e5e5'
      }}>
        {title}
      </h2>
      
      {showLeft && (
        <button 
          onClick={() => scroll('left')}
          style={{
            position: 'absolute',
            left: '0',
            top: '40px',
            bottom: '0',
            width: '4rem',
            zIndex: 100,
            background: 'linear-gradient(to right, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%)',
            color: 'white',
            border: 'none',
            outline: 'none',
            cursor: 'pointer',
            fontSize: '3rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0,
            transition: 'opacity 0.2s ease-in-out'
          }}
          className="scroll-btn desktop-only"
        >
          ‹
        </button>
      )}

      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          display: 'flex',
          overflowX: 'auto',
          gap: 'clamp(1rem, 5vw, 2.5rem)',
          padding: '1.5rem var(--container-padding) 2.5rem',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          scrollBehavior: 'smooth',
          scrollSnapType: 'x mandatory'
        }} className="hide-scrollbar">
        {movies.slice(0, 10).map((movie, index) => (
          <div 
            key={movie.id} 
            onClick={() => router.push(`/movie/${movie.id}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
              flex: '0 0 auto',
              cursor: 'pointer',
              transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              width: 'clamp(220px, 70vw, 320px)',
              height: 'clamp(160px, 45vw, 220px)',
              scrollSnapAlign: 'start',
              scrollSnapStop: 'always'
            }}
            className="trending-card-wrapper"
          >
            {/* Numbering */}
            <div style={{
              fontSize: 'clamp(5rem, 18vw, 12rem)',
              fontWeight: '900',
              color: '#0f1014',
              WebkitTextStroke: '2px #555',
              lineHeight: '1',
              position: 'relative',
              left: 'clamp(5px, 2vw, 15px)',
              zIndex: 1,
              fontFamily: 'Impact, sans-serif'
            }}>
              {index + 1}
            </div>
            
            {/* Poster Container */}
            <div style={{
              width: 'clamp(110px, 35vw, 160px)',
              height: '100%',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 8px 30px rgba(0,0,0,0.7)',
              position: 'relative',
              left: 'clamp(-10px, -3vw, -30px)',
              zIndex: 2,
              flexShrink: 0,
              background: '#1a1a1a'
            }} className="poster-container">
              <img 
                src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : (movie.custom_poster_url || `https://placehold.co/500x750/1a1a2e/e2b616?text=${encodeURIComponent(movie.title)}`)} 
                alt={movie.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => handleImgError(e, movie)}
              />
              
              {/* Play Button Overlay */}
              <div 
                onClick={(e) => handlePlayTrailer(e, movie)}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0,
                  transition: 'opacity 0.3s ease',
                  zIndex: 10
                }} className="play-overlay">
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '1.5rem',
                  paddingLeft: '4px',
                  boxShadow: '0 0 20px var(--primary)'
                }}>▶</div>
              </div>

              {/* Info Overlay (Visible on Hover) */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.8) 60%, transparent 100%)',
                padding: '1.5rem 0.8rem 0.8rem',
                transform: 'translateY(100%)',
                transition: 'transform 0.4s ease',
                zIndex: 5,
                display: 'flex',
                flexDirection: 'column',
                gap: '5px'
              }} className="info-overlay">
                <h3 style={{ margin: 0, fontSize: '0.9rem', color: 'white', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {movie.title}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }}>
                  <span style={{ color: '#46d369', fontWeight: 'bold' }}>★ {movie.vote_average?.toFixed(1) || '8.5'}</span>
                  <span style={{ color: '#bcbcbc' }}>{movie.year || '2025'}</span>
                </div>
                {movie._originalCast && (
                  <p style={{ margin: 0, fontSize: '0.65rem', color: '#aaa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {movie._originalCast.slice(0, 2).map(c => c.name).join(', ')}
                  </p>
                )}
                <p style={{ 
                  margin: 0, 
                  fontSize: '0.65rem', 
                  color: '#888', 
                  display: '-webkit-box', 
                  WebkitLineClamp: '2', 
                  WebkitBoxOrient: 'vertical', 
                  overflow: 'hidden',
                  lineHeight: '1.2'
                }}>
                  {movie.overview}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button 
        onClick={() => scroll('right')}
        style={{
          position: 'absolute',
          right: '0',
          top: '40px',
          bottom: '0',
          width: '4rem',
          zIndex: 100,
          background: 'linear-gradient(to left, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%)',
          color: 'white',
          border: 'none',
          outline: 'none',
          cursor: 'pointer',
          fontSize: '3rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0,
          transition: 'opacity 0.2s ease-in-out'
        }}
        className="scroll-btn desktop-only"
      >
        ›
      </button>

      {selectedTrailer && (
        <TrailerModal 
          isOpen={!!selectedTrailer} 
          onClose={() => setSelectedTrailer(null)} 
          videoKey={selectedTrailer} 
        />
      )}

      <style jsx>{`
        .trending-container:hover .scroll-btn {
          opacity: 1;
        }
        .scroll-btn:hover {
          font-size: 3.5rem !important;
          color: #fff !important;
        }
        .trending-card-wrapper:hover {
          transform: scale(1.1) translateX(10px);
          z-index: 100;
        }
        .trending-card-wrapper:hover .play-overlay {
          opacity: 1;
        }
        .trending-card-wrapper:hover .info-overlay {
          transform: translateY(0);
        }
        @media (max-width: 768px) {
          .desktop-only {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
