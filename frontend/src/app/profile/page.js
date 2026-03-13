'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../services/api';
import MovieCard from '../../components/MovieCard';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchProfile() {
      const token = localStorage.getItem('cinescope_token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const data = await api.get('/user/profile', token);
        setUser(data);
      } catch (err) {
        console.error("Failed to load profile", err);
        localStorage.removeItem('cinescope_token');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('cinescope_token');
    router.push('/');
  };

  if (loading) return <div style={{ padding: '5rem', textAlign: 'center' }}>Loading profile...</div>;
  if (!user) return null;

  return (
    <div style={{ padding: '3rem 5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '3rem', margin: '0 0 0.5rem 0' }}>Welcome, {user.username}</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>{user.email}</p>
        </div>
        <button 
          onClick={handleLogout}
          style={{ padding: '0.8rem 2rem', background: 'transparent', color: 'white', border: '1px solid white', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Sign Out
        </button>
      </div>

      <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>My Watchlist</h2>
      {user.watchlist && user.watchlist.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '2rem' }}>
          {user.watchlist.map(movie => (
            <MovieCard key={movie.movieId} movie={{ id: movie.movieId, title: movie.title, poster_path: movie.posterPath }} />
          ))}
        </div>
      ) : (
        <div style={{ padding: '3rem', background: 'var(--surface)', borderRadius: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Your watchlist is empty. Start exploring movies to add them here!
        </div>
      )}
    </div>
  );
}
