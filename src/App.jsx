import React, { useEffect, useState } from 'react';
import './App.css';

function TopBar() {
  return (
    <header className="topbar">
      <img src="/hangar24-logo-wide.png" alt="Hangar 24" className="topbar__logo-img" />
      <button className="topbar__upload" type="button" aria-label="Upload photo">
        ↑ Upload
      </button>
    </header>
  );
}

function PhotoTile({ photo }) {
  return (
    <div className="wall__tile">
      <span className="wall__tile-label">{photo.original_filename}</span>
    </div>
  );
}

function Wall({ photos }) {
  return (
    <section className="wall">
      <div className="wall__grid">
        {photos.map((photo) => (
          <PhotoTile key={photo.id} photo={photo} />
        ))}
      </div>
    </section>
  );
}

export default function App() {
  const [photos, setPhotos] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    fetch('/api/photos')
      .then((res) => {
        if (!res.ok) throw new Error('fetch failed');
        return res.json();
      })
      .then((data) => {
        setPhotos(data.photos ?? []);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  return (
    <div className="app">
      <TopBar />
      {status === 'loading' && <p className="app__message">Loading…</p>}
      {status === 'error' && <p className="app__message app__message--error">Failed to load photos.</p>}
      {status === 'ready' && <Wall photos={photos} />}
    </div>
  );
}
