'use client';
import { GoogleOAuthProvider } from '@react-oauth/google';

export function Providers({ children }) {
  // Uses environment variable for Google Client ID or falls back to a placeholder
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";
  
  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  );
}
