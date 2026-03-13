'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '../../services/api';
import MovieCard from '../../components/MovieCard';

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q');
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) return;
    
    async function fetchSearch() {
      setLoading(true);
      try {
        const data = await api.get(`/movies/search?q=${encodeURIComponent(query)}`);
        setResults(data.results || []);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSearch();
  }, [query]);

  return (
    <div style={{ padding: '4rem 5rem' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>
        Search Results for <span style={{ color: 'var(--primary)' }}>"{query}"</span>
      </h1>
      
      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--primary)', padding: '3rem' }}>Searching...</div>
      ) : results.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '2rem'
        }}>
          {results.map(movie => <MovieCard key={movie.id} movie={movie} />)}
        </div>
      ) : (
        <div style={{ textAlign: 'center', fontSize: '1.2rem', color: 'var(--text-muted)' }}>
          No movies found matching your search.
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading search...</div>}>
      <SearchResults />
    </Suspense>
  );
}
