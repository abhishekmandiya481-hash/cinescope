'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SearchBar from './SearchBar';

export default function Navbar() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const categories = [
    { name: 'Awards-Winning Masterpieces', id: 'masterpieces' },
    { name: 'Tollywood Blockbusters', id: 'tollywood' },
    { name: 'Top 10 Today', id: 'trending' },
    { name: 'Bollywood Hits', id: 'bollywood' },
    { name: 'New Released', id: 'new-released' },
    { name: 'Popular on CineScope', id: 'popular' }
  ];

  const handleCategoryClick = (id) => {
    setIsDrawerOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <>
      <nav style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        padding: '0 var(--container-padding)', 
        height: 'var(--header-height)',
        alignItems: 'center',
        background: scrolled ? 'rgba(15, 16, 20, 0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        transition: 'var(--transition)',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <Link href="/">
            <h1 style={{ 
              color: 'var(--netflix-red)', 
              fontSize: '2rem', 
              fontWeight: '900', 
              margin: 0, 
              cursor: 'pointer',
              letterSpacing: '-1.5px',
              textTransform: 'uppercase',
              fontFamily: 'Impact, sans-serif'
            }}>
              CineScope
            </h1>
          </Link>

          <div className="desktop-only" style={{ display: 'flex', gap: '1.5rem', marginLeft: '1rem' }}>
            <Link href="/" style={{ fontSize: '0.9rem', fontWeight: '500', color: '#e5e5e5' }}>Home</Link>
            <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#e5e5e5', cursor: 'pointer' }} onClick={() => setIsDrawerOpen(true)}>Categories</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {/* Workable Search Bar on Right */}
          <div className="desktop-only">
            <SearchBar compact={true} />
          </div>

          {/* Notification Bell */}
          <div 
            style={{ position: 'relative', cursor: 'pointer', padding: '5px' }}
            onMouseEnter={() => setIsNotificationOpen(true)}
            onMouseLeave={() => setIsNotificationOpen(false)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
            </svg>
            <span style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              background: 'var(--netflix-red)',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              border: '2px solid #0f1014'
            }}></span>

            {isNotificationOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                width: '300px',
                background: 'rgba(20, 20, 20, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '1rem',
                borderRadius: '4px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                zIndex: 1001,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '5px' }}>Notifications</p>
                <div style={{ fontSize: '0.8rem', color: '#ccc' }}>New Movie Added: <b>Homebound (2025)</b> is now trending!</div>
                <div style={{ fontSize: '0.8rem', color: '#ccc' }}><b>Pushpa: The Rule</b> - Review out now.</div>
              </div>
            )}
          </div>

          {/* User Profile - Workable Link */}
          <div 
            onClick={() => router.push('/profile')}
            style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '4px', 
              background: '#e50914', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'white' }}>S</span>
          </div>

          {/* Three-line Menu Button */}
          <button 
            onClick={() => setIsDrawerOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '1.5rem',
              cursor: 'pointer',
              display: 'flex',
              padding: '5px',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            ☰
          </button>
        </div>
      </nav>

      {/* Slide-out Category Drawer */}
      {isDrawerOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'var(--drawer-width)',
          background: 'rgba(15, 16, 20, 0.98)',
          backdropFilter: 'blur(30px)',
          zIndex: 2000,
          boxShadow: '-10px 0 50px rgba(0,0,0,0.8)',
          display: 'flex',
          flexDirection: 'column',
          padding: '2rem',
          animation: 'slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin:0 }}>Menu</h2>
            <button 
              onClick={() => setIsDrawerOpen(false)}
              style={{ background: 'none', border: 'none', color: 'white', fontSize: '2rem', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Home Option - Workable */}
            <div 
              onClick={() => {
                router.push('/');
                setIsDrawerOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              style={{ 
                fontSize: '1.1rem', 
                color: '#e5e5e5', 
                cursor: 'pointer',
                transition: 'var(--transition)',
                padding: '10px 0',
                fontWeight: 'bold',
                borderBottom: '1px solid rgba(255,255,255,0.1)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--netflix-red)'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#e5e5e5'}
            >
              Home
            </div>

            <p style={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '2px', fontWeight: 'bold', marginBottom: '0.5rem' }}>Categories</p>
            {categories.map((cat) => (
              <div 
                key={cat.id} 
                onClick={() => handleCategoryClick(cat.id)}
                style={{ 
                  fontSize: '1.1rem', 
                  color: '#e5e5e5', 
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                  padding: '10px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.05)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--netflix-red)';
                  e.currentTarget.style.paddingLeft = '10px';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#e5e5e5';
                  e.currentTarget.style.paddingLeft = '0';
                }}
              >
                {cat.name}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <Link href="/login" onClick={() => setIsDrawerOpen(false)} style={{ display: 'block', padding: '1rem', background: 'var(--netflix-red)', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold', color: 'white' }}>
              Account Settings
            </Link>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: '1.5rem' }}>© 2026 CineScope Premium</p>
          </div>
        </div>
      )}

      {/* Backdrop for Drawer */}
      {isDrawerOpen && (
        <div 
          onClick={() => setIsDrawerOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 1999
          }}
        />
      )}
    </>
  );
}
