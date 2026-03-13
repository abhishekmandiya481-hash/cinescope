'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GoogleLogin } from '@react-oauth/google';
import { api } from '../../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await api.post('/auth/login', { email, password });
      if (data.token) {
        localStorage.setItem('cinescope_token', data.token);
        router.push('/profile');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const data = await api.post('/auth/google', { credential: credentialResponse.credential });
      if (data.token) {
        localStorage.setItem('cinescope_token', data.token);
        router.push('/profile');
      } else {
        setError(data.message || 'Google login failed');
      }
    } catch (err) {
      // The backend returns a specific error if the client id isn't set, intercept it
      setError('Google Sign-In failed. Have you configured the real GOOGLE_CLIENT_ID?');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <form onSubmit={handleSubmit} style={{ background: 'var(--surface)', padding: '3rem', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', textAlign: 'center' }}>Sign In</h2>
        {error && <p style={{ color: 'var(--primary)', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}
        
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Email</label>
          <input 
            type="email" 
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ width: '100%', padding: '0.8rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: 'var(--background)', color: 'white' }}
            required 
          />
        </div>
        
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Password</label>
          <input 
            type="password" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', padding: '0.8rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: 'var(--background)', color: 'white' }}
            required 
          />
        </div>
        
        <button type="submit" style={{ width: '100%', padding: '1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', marginBottom: '1rem' }}>
          Sign In
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '1rem 0' }}>
            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)' }} />
            <span style={{ padding: '0 1rem', color: 'var(--text-muted)' }}>OR</span>
            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google Login Failed (Widget Error)')}
                theme="filled_black"
                text="signin_with"
                size="large"
            />
        </div>
        
        <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          New to CineScope? <Link href="/signup" style={{ color: 'white', fontWeight: 'bold' }}>Sign up now.</Link>
        </p>
      </form>
    </div>
  );
}
