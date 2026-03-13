'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GoogleLogin } from '@react-oauth/google';
import { api } from '../../services/api';

export default function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await api.post('/auth/register', { username, email, password });
      if (data.token) {
        localStorage.setItem('cinescope_token', data.token);
        router.push('/profile');
      } else {
        setError(data.message || 'Signup failed');
      }
    } catch (err) {
      setError('Registration failed. Username or email might be taken.');
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const data = await api.post('/auth/google', { credential: credentialResponse.credential });
      if (data.token) {
        localStorage.setItem('cinescope_token', data.token);
        router.push('/profile');
      } else {
        setError(data.message || 'Google signup failed');
      }
    } catch (err) {
      setError('Google Sign-In failed. Have you configured the real GOOGLE_CLIENT_ID?');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <form onSubmit={handleSubmit} style={{ background: 'var(--surface)', padding: '3rem', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', textAlign: 'center' }}>Sign Up</h2>
        {error && <p style={{ color: 'var(--primary)', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}
        
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Username</label>
          <input 
            type="text" 
            value={username}
            onChange={e => setUsername(e.target.value)}
            style={{ width: '100%', padding: '0.8rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: 'var(--background)', color: 'white' }}
            required 
          />
        </div>

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
            minLength={6}
          />
        </div>
        
        <button type="submit" style={{ width: '100%', padding: '1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', marginBottom: '1rem' }}>
          Register
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '1rem 0' }}>
            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)' }} />
            <span style={{ padding: '0 1rem', color: 'var(--text-muted)' }}>OR</span>
            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google Signup Failed (Widget Error)')}
                theme="filled_black"
                text="signup_with"
                size="large"
            />
        </div>
        
        <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          Already have an account? <Link href="/login" style={{ color: 'white', fontWeight: 'bold' }}>Sign in here.</Link>
        </p>
      </form>
    </div>
  );
}
