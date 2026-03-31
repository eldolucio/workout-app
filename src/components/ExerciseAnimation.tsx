"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

type AnimationType = string;

interface Props {
  name: AnimationType;
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '2rem',
    background: '#161616',
    borderRadius: '14px',
    border: '1px solid #222',
    width: '100%',
    maxWidth: '320px',
    margin: '0 auto',
  },
  label: {
    marginTop: '1.5rem',
    fontSize: '0.875rem',
    color: '#c8f135',
    fontFamily: 'Barlow Condensed',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  tip: {
    marginTop: '0.5rem',
    fontSize: '0.75rem',
    color: '#555',
    textAlign: 'center' as const,
    fontFamily: 'Barlow',
  }
};

export default function ExerciseAnimation({ name }: Props) {
  const [videoId, setVideoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchVideo() {
      try {
        setLoading(true);
        const res = await fetch(`/api/youtube?q=${encodeURIComponent(name)}`);
        const data = await res.json();
        
        if (data.videoId) {
           setVideoId(data.videoId);
        } else {
           setError(true);
        }
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchVideo();
  }, [name]);

  return (
    <div style={styles.container} onClick={(e) => e.stopPropagation()}>
      <h3 style={{
        fontFamily: 'Barlow Condensed',
        color: '#c8f135',
        fontSize: '1.25rem',
        textTransform: 'uppercase',
        marginBottom: '0.5rem',
        alignSelf: 'flex-start'
      }}>
        {name}
      </h3>
      <p style={{ color: '#aaa', fontSize: '0.75rem', marginBottom: '1rem', alignSelf: 'flex-start' }}>
        Aprenda a execução correta:
      </p>

      {/* YouTube Video Section */}
      <div style={{ width: '100%', height: '200px', background: '#000', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#c8f135' }}>
            <Loader2 size={24} style={{ animation: 'spin 1.5s linear infinite' }} />
            <span style={{ fontFamily: 'Barlow Condensed', fontSize: '0.875rem' }}>Buscando tutorial...</span>
          </div>
        ) : error || !videoId ? (
          <span style={{ color: '#ff4444', fontFamily: 'Barlow', fontSize: '0.875rem' }}>Vídeo não encontrado.</span>
        ) : (
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={name}
          ></iframe>
        )}
      </div>
      
      <p style={{
        marginTop: '1.5rem',
        fontSize: '0.75rem',
        color: '#555',
        textAlign: 'center',
        fontFamily: 'Barlow',
        width: '100%',
      }}>
        Toque fora do card para fechar
      </p>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
