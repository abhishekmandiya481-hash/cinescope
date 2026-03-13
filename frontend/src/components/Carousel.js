import { useRef, useState, useEffect } from 'react';
import MovieCard from './MovieCard';

export default function Carousel({ title, movies }) {
  const scrollRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);

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

  return (
    <div style={{ margin: '2.5rem 0', position: 'relative' }} className="carousel-container">
      <h2 style={{ 
        fontSize: 'clamp(1.2rem, 5vw, 1.6rem)', 
        marginBottom: '0.8rem', 
        paddingLeft: 'var(--container-padding)', 
        fontWeight: 'bold',
        color: '#e5e5e5'
      }}>
        {title}
      </h2>
      
      {/* Scroll Left Button - Hidden on mobile */}
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
          gap: '0.8rem',
          padding: '0.5rem var(--container-padding) 1.5rem var(--container-padding)',
          scrollBehavior: 'smooth',
          scrollSnapType: 'x mandatory'
        }}
        className="hide-scrollbar"
      >
        {movies.map(movie => (
          <div key={movie.id} style={{ 
            flex: '0 0 auto', 
            width: 'clamp(140px, 40vw, 210px)',
            transition: 'transform 0.3s',
            scrollSnapAlign: 'start',
            scrollSnapStop: 'always'
          }} className="movie-card-wrapper">
            <MovieCard movie={movie} />
          </div>
        ))}
      </div>

      {/* Scroll Right Button - Hidden on mobile */}
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

      <style jsx>{`
        .carousel-container:hover .scroll-btn {
          opacity: 1;
        }
        .scroll-btn:hover {
          font-size: 3.5rem !important;
          color: #fff !important;
        }
        @media (max-width: 768px) {
          .desktop-only {
            display: none !important;
          }
        }
        .movie-card-wrapper:hover {
          transform: scale(1.05);
          z-index: 10;
        }
      `}</style>
    </div>
  );
}
