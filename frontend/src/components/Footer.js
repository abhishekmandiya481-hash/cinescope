export default function Footer() {
  return (
    <footer style={{ 
      padding: '4rem var(--container-padding)', 
      marginTop: 'auto',
      textAlign: 'center', 
      color: 'var(--text-muted)',
      borderTop: '1px solid rgba(255,255,255,0.05)',
      fontSize: '0.9rem'
    }}>
      <p>&copy; {new Date().getFullYear()} CineScope. All rights reserved.</p>
      <p style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>Data provided by TMDB</p>
    </footer>
  );
}
