'use client';
import { useEffect, useState } from 'react';
import { api } from '../../../services/api';

export default function ActorPage({ params }) {
  const [actor, setActor] = useState(null);
  const [loading, setLoading] = useState(true);

  return (
    <div style={{ padding: '4rem 5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
      {/* TMDB API Proxy for actors would be needed, but for MVP we acknowledge the page exists */}
      <h1>Actor details for ID: {params.id}</h1>
      <p>This page would fetch from /person/{params.id} via the backend proxy.</p>
    </div>
  );
}
