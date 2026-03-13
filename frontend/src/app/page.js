'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../services/api';
import Carousel from '../components/Carousel';
import Image from 'next/image';
import TrendingRow from '../components/TrendingRow';
import SearchBar from '../components/SearchBar';
import TrailerModal from '../components/TrailerModal';

export default function Home() {
  const router = useRouter();
  const [trending, setTrending] = useState([]);
  const [popular, setPopular] = useState([]);
  const [newReleased, setNewReleased] = useState([]);
  const [bollywood, setBollywood] = useState([]);
  const [tollywood, setTollywood] = useState([]);
  const [masterpieces, setMasterpieces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);
  const [isTrailerOpen, setTrailerOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [trendingData, popularData, newReleasedData, bollywoodData, tollywoodData, masterpieceData] = await Promise.all([
          api.get('/movies/trending'),
          api.get('/movies/popular'),
          api.get('/movies/new-released'),
          api.get('/movies/bollywood'),
          api.get('/movies/tollywood'),
          api.get('/movies/masterpieces')
        ]);
        setTrending(trendingData.results || []);
        setPopular(popularData.results || []);
        setNewReleased(newReleasedData.results || []);
        setBollywood(bollywoodData.results || []);
        setTollywood(tollywoodData.results || []);
        setMasterpieces(masterpieceData.results || []);
      } catch (err) {
        console.error("Failed to fetch movies", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Auto-rotate hero every 5 seconds
  useEffect(() => {
    if (trending.length === 0 || isTrailerOpen) return;
    const timer = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % Math.min(trending.length, 10));
    }, 5000);
    return () => clearInterval(timer);
  }, [trending, isTrailerOpen]);

  const heroMovie = trending[heroIndex];
  const trailerKey = heroMovie?.videos?.results?.find(v => v.type === 'Trailer')?.key || heroMovie?.youtube_url?.split('v=')[1];

  return (
    <div style={{ backgroundColor: 'var(--background)' }}>
      {/* Hero Section */}
      <div style={{
        position: 'relative',
        minHeight: 'clamp(60vh, 85vh, 85vh)',
        width: '100%',
        backgroundImage: heroMovie 
          ? `linear-gradient(to bottom, rgba(15,16,20,0.2) 0%, rgba(15,16,20,1) 100%), url(${heroMovie.backdrop_path ? `https://image.tmdb.org/t/p/original${heroMovie.backdrop_path}` : heroMovie.custom_backdrop_url})`
          : 'none',
        backgroundColor: 'var(--background)',
        backgroundSize: 'cover',
        backgroundPosition: 'center 20%',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        alignItems: 'center',
        padding: '0 var(--container-padding)',
        overflow: 'hidden'
      }}>
        {/* LCP Optimization: Preload the hero image if it's a custom URL */}
        {heroMovie?.custom_backdrop_url && (
            <div style={{ display: 'none' }}>
                <Image 
                    src={heroMovie.custom_backdrop_url} 
                    alt="LCP Preload" 
                    width={1} 
                    height={1} 
                    priority 
                />
            </div>
        )}
        {/* Decorative Overlay */}
        <div className="hero-gradient" style={{ pointerEvents: 'none' }}></div>

        <div className="fade-in" style={{ 
          position: 'relative', 
          zIndex: 2, 
          maxWidth: '800px',
          marginTop: '4rem'
        }}>
          <div style={{ 
            display: 'inline-block', 
            padding: '4px 12px', 
            backgroundColor: 'var(--primary)', 
            color: 'white', 
            borderRadius: '4px', 
            fontSize: '0.8rem', 
            fontWeight: '900',
            letterSpacing: '2px',
            marginBottom: '1.5rem',
            textTransform: 'uppercase'
          }}>
            CineScope Original
          </div>

          <h1 style={{ 
            fontSize: 'clamp(2rem, 10vw, 5.5rem)', 
            fontWeight: '800', 
            lineHeight: '1',
            marginBottom: '1rem',
            background: 'linear-gradient(to bottom, #fff, #ccc)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-1px'
          }}>
            {heroMovie ? heroMovie.title : 'CineScope'}
          </h1>

          <h2 style={{
            fontSize: 'clamp(1rem, 3vw, 2rem)',
            fontWeight: '500',
            color: 'var(--text-main)',
            marginBottom: '1rem',
            opacity: 0.9
          }}>
            Anywhere. Anytime. Infinite Stories.
          </h2>

          <p className="desktop-only" style={{ 
            fontSize: '1.1rem', 
            color: 'var(--text-muted)', 
            marginBottom: '3rem', 
            lineHeight: '1.6',
            maxWidth: '550px'
          }}>
            {heroMovie ? heroMovie.overview : 'Discover the latest blockbusters and exclusive originals. Experience cinema redefined.'}
          </p>
          
          <div className="hero-buttons" style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button 
              onClick={() => setTrailerOpen(true)}
              style={{ 
                flex: 1,
                padding: '0.8rem 1.5rem', 
                background: 'white', 
                color: 'black', 
                border: 'none', 
                borderRadius: '4px', 
                fontWeight: 'bold', 
                fontSize: '1rem', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>▶</span> Play
            </button>
            <button 
              onClick={() => router.push(`/movie/${heroMovie?.id}`)}
              style={{ 
                flex: 1,
                padding: '0.8rem 1.5rem', 
                background: 'rgba(109, 109, 110, 0.7)', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                fontWeight: 'bold', 
                fontSize: '1rem', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>ⓘ</span> Details
            </button>
          </div>

          <style jsx>{`
            @media (max-width: 480px) {
              .hero-buttons {
                flex-direction: column !important;
                width: 100%;
              }
              .hero-buttons button {
                width: 100% !important;
                padding: 1rem !important;
              }
            }
          `}</style>

        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '10rem', color: 'var(--primary)', fontSize: '1.5rem', fontWeight: 'bold' }}>Loading...</div>
      ) : (
        <div style={{ position: 'relative', zIndex: 10, paddingBottom: '3rem', marginTop: '-5rem' }}>
          <div id="trending">
            <TrendingRow title="Top 10 Today" movies={trending} />
          </div>
          <div id="masterpieces">
            <Carousel title="Awards-Winning Masterpieces" movies={masterpieces} />
          </div>
          <div id="tollywood">
            <Carousel title="Tollywood Blockbusters" movies={tollywood} />
          </div>
          <div id="bollywood">
            <Carousel title="Bollywood Hits" movies={bollywood} />
          </div>
          <div id="new-released">
            <Carousel title="New Released" movies={newReleased} />
          </div>
          <div id="popular">
            <Carousel title="Popular on CineScope" movies={popular} />
          </div>
        </div>
      )}

      {isTrailerOpen && trailerKey && (
        <TrailerModal 
          isOpen={isTrailerOpen} 
          onClose={() => setTrailerOpen(false)} 
          videoKey={trailerKey} 
        />
      )}
    </div>
  );
}
