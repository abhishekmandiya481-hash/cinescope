'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../services/api';

export default function SearchBar({ compact = false }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const data = await api.get(`/movies/search?q=${encodeURIComponent(query)}`);
        setResults(data.results.slice(0, 5));
        setShowDropdown(true);
      } catch (err) {
        console.error("Search error:", err);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSearch = (e) => {
    e?.preventDefault();
    if (query.trim()) {
      setShowDropdown(false);
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%', maxWidth: compact ? '250px' : '600px' }}>
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <input 
            type="text" 
            placeholder={compact ? "Search..." : "Search movies, actors, or directors..."} 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: '100%',
              padding: compact ? '0.5rem 1rem 0.5rem 2.5rem' : '1rem 1.5rem',
              borderRadius: '50px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.05)',
              color: 'white',
              fontSize: compact ? '0.9rem' : '1rem',
              outline: 'none',
              transition: 'border-color 0.3s'
            }}
            onFocus={() => query.length >= 2 && setShowDropdown(true)}
          />
          {compact && (
            <svg 
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}
              width="16" height="16" viewBox="0 0 24 24" fill="white"
            >
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
          )}
        </div>
        {!compact && (
          <button 
            type="submit"
            style={{
              padding: '0 2rem',
              borderRadius: '50px',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Search
          </button>
        )}
      </form>

      {showDropdown && results.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '110%',
          left: 0,
          right: 0,
          background: 'var(--surface)',
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          zIndex: 1000,
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          {results.map((movie) => (
            <div 
              key={movie.id}
              onClick={() => {
                router.push(`/movie/${movie.id}`);
                setShowDropdown(false);
                setQuery('');
              }}
              style={{
                display: 'flex',
                gap: '1rem',
                padding: '0.8rem 1rem',
                cursor: 'pointer',
                transition: 'background 0.2s',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.05)'
              }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            >
              <img 
                src={movie.custom_poster_url || `https://placehold.co/50x75/1a1a2e/e2b616?text=${encodeURIComponent(movie.title)}`} 
                alt={movie.title}
                style={{ width: '40px', height: '60px', borderRadius: '4px', objectFit: 'cover' }}
                onError={async (e) => {
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
                  e.target.src = `https://placehold.co/50x75/1a1a2e/e2b616?text=${title}`;
                }}
              />
              <div>
                <div style={{ fontWeight: 'bold' }}>{movie.title}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {movie.release_date?.substring(0,4)} • {movie.genres?.[0]?.name}
                </div>
              </div>
            </div>
          ))}
          <div 
            onClick={handleSearch}
            style={{ padding: '0.8rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--primary)', cursor: 'pointer', background: 'rgba(255,255,255,0.02)' }}
          >
            See all results for "{query}"
          </div>
        </div>
      )}
    </div>
  );
}
