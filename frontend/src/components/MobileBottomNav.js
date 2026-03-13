'use client';
import { useRouter, usePathname } from 'next/navigation';

export default function MobileBottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { name: 'Home', icon: '🏠', path: '/' },
    { name: 'Categories', icon: '☰', action: 'categories' },
    { name: 'Search', icon: '🔍', path: '/search' },
    { name: 'My Profile', icon: '👤', path: '/profile' }
  ];

  const handleNavClick = (item) => {
    if (item.action === 'categories') {
      // Trigger the search/categories drawer if valid, or just go home
      router.push('/');
      setTimeout(() => {
        const element = document.getElementById('trending');
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return;
    }
    router.push(item.path);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '65px',
      background: 'rgba(18, 18, 18, 0.95)',
      backdropFilter: 'blur(15px)',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      zIndex: 2000,
      padding: '0 10px',
      paddingBottom: 'env(safe-area-inset-bottom)'
    }} className="mobile-only">
      {navItems.map((item) => {
        const isActive = pathname === item.path;
        return (
          <button
            key={item.name}
            onClick={() => handleNavClick(item)}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              color: isActive ? 'white' : 'rgba(255,255,255,0.5)',
              transition: 'all 0.2s',
              transform: isActive ? 'scale(1.1)' : 'scale(1)',
              padding: '8px'
            }}
          >
            <span style={{ fontSize: '1.2rem', filter: isActive ? 'none' : 'grayscale(100%) opacity(0.5)' }}>
              {item.icon}
            </span>
            <span style={{ fontSize: '0.65rem', fontWeight: isActive ? 'bold' : 'normal' }}>
              {item.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
