'use client';
import { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import TrailerModal from '../../../components/TrailerModal';
import CastCard from '../../../components/CastCard';
import Carousel from '../../../components/Carousel';

export default function MovieDetails({ params }) {
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTrailerOpen, setTrailerOpen] = useState(false);

  const handleAddToWatchlist = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert("Please sign in to add to your watchlist.");
        return;
      }
      await api.post('/user/watchlist', { 
        movieId: movie.id, 
        title: movie.title, 
        posterPath: movie.poster_path || movie.custom_poster_url 
      });
      alert("Success! Check your profile for your Watchlist.");
    } catch (err) {
      console.error(err);
      alert("Failed to update watchlist");
    }
  };

  useEffect(() => {
    async function fetchMovie() {
      try {
        const data = await api.get(`/movies/${params.id}`);
        setMovie(data);
      } catch (err) {
        console.error("Failed to fetch movie", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMovie();
  }, [params.id]);

  if (loading) return <div style={{ padding: '5rem', textAlign: 'center', color: 'var(--primary)' }}>Loading...</div>;
  if (!movie) return <div style={{ padding: '5rem', textAlign: 'center' }}>Movie not found.</div>;

  const trailer = movie.videos?.results?.find(vid => vid.type === 'Trailer' && vid.site === 'YouTube');
  const cast = movie.credits?.cast?.slice(0, 10) || [];
  const recommendations = movie.recommendations?.results || [];

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
    <div>
      <div style={{
        position: 'relative',
        padding: '4rem 5rem',
        background: `linear-gradient(to right, rgba(15,16,20,1) 20%, rgba(15,16,20,0.8) 100%), url(${movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : movie.custom_backdrop_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        gap: '4rem',
        alignItems: 'center'
      }}>
        <img 
          src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : (movie.custom_poster_url || `https://placehold.co/500x750/1a1a2e/e2b616?text=${encodeURIComponent(movie.title)}`)} 
          alt={movie.title}
          style={{ width: '300px', borderRadius: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
          onError={handleImgError}
        />
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '3.5rem', margin: '0 0 0.5rem 0' }}>{movie.title} <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>({movie.year || movie.release_date?.substring(0,4)})</span></h1>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
            <span style={{ background: 'var(--primary)', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>
              ★ {movie.vote_average?.toFixed(1)}
            </span>
            <span>{movie.runtime} min</span>
            <span>{movie.genres?.map(g => g.name).join(', ')}</span>
          </div>
          <p style={{ fontSize: '1.2rem', lineHeight: '1.6', marginBottom: '2rem', maxWidth: '800px' }}>
            {movie.overview}
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {trailer && (
              <button 
                onClick={() => setTrailerOpen(true)}
                style={{ padding: '1rem 2rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '50px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}
              >
                ▶ Play Trailer
              </button>
            )}
            {movie.youtube_url && (
              <a 
                href={movie.youtube_url} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ padding: '1rem 2rem', background: '#FF0000', color: 'white', textDecoration: 'none', borderRadius: '50px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                Watch on YouTube
              </a>
            )}
            <button 
              onClick={handleAddToWatchlist}
              style={{ padding: '1rem 2rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>
              + Add to Watchlist
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: '2rem 3rem' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Top Cast</h2>
        <div style={{ display: 'flex', gap: '1.5rem', overflowX: 'auto', paddingBottom: '1rem', scrollbarWidth: 'none' }}>
          {cast.map(actor => <CastCard key={actor.id} actor={actor} />)}
        </div>
      </div>

      {recommendations.length > 0 && (
        <Carousel title="You May Also Like" movies={recommendations} />
      )}

      {trailer && (
        <TrailerModal 
          isOpen={isTrailerOpen} 
          onClose={() => setTrailerOpen(false)} 
          videoKey={trailer.key} 
        />
      )}
    </div>
  );
}
