export default function TrailerModal({ isOpen, onClose, videoKey }) {
  if (!isOpen || !videoKey) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.9)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '2rem'
    }}>
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '1000px',
        aspectRatio: '16/9',
        backgroundColor: '#000',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0,0,0,0.8)'
      }}>
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            fontSize: '1.5rem',
            cursor: 'pointer',
            zIndex: 10,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          &times;
        </button>
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${videoKey}?autoplay=1`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
}
