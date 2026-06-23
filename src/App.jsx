import React, { useEffect, useRef, useState } from 'react';
import './App.css';

function TopBar({ onUpload, uploading }) {
  const inputRef = useRef(null);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    onUpload(file);
    e.target.value = '';
  }

  return (
    <header className="topbar">
      <span className="topbar__word">Hangar</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="topbar__file-input"
        onChange={handleFileChange}
        aria-hidden="true"
        tabIndex={-1}
      />
      <button
        type="button"
        className="topbar__hangar-btn"
        aria-label="Upload photo — add an aircraft to the hangar"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        <img
          src="/hangar24-logo.png"
          alt=""
          className={`topbar__hangar-img${uploading ? ' topbar__hangar-img--uploading' : ''}`}
        />
      </button>
      <span className="topbar__num">24</span>
    </header>
  );
}

function DetailView({ photos, index, onBack, onPrev, onNext }) {
  const photo = photos[index];
  const isFirst = index === 0;
  const isLast = index === photos.length - 1;

  // 0 = try preview, 1 = try original, 2 = failed
  const [fallbackLevel, setFallbackLevel] = useState(0);

  // Reset fallback whenever the photo changes
  useEffect(() => { setFallbackLevel(0); }, [photo.r2_key]);

  const imgSrc = fallbackLevel === 0
    ? `/img/${photo.r2_key}?size=preview`
    : `/img/${photo.r2_key}`;
  const imgFailed = fallbackLevel >= 2;

  // Touch swipe handling
  const touchStart = useRef(null);

  function handleTouchStart(e) {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }

  function handleTouchEnd(e) {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) < 50) return;
    if (Math.abs(dy) > Math.abs(dx)) return; // ignore vertical-dominant gestures
    if (dx < 0) onNext();
    else onPrev();
  }

  return (
    <div
      className="detail"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <header className="detail__bar">
        <button type="button" className="detail__back" onClick={onBack} aria-label="Back to wall">
          <span className="detail__back-chevron">‹</span> Back
        </button>
      </header>
      <div className="detail__body">
        <button
          type="button"
          className="detail__nav detail__nav--prev"
          onClick={onPrev}
          disabled={isFirst}
          aria-label="Previous photo"
        >
          ‹
        </button>
        {imgFailed ? (
          <p className="detail__unavailable">Image unavailable</p>
        ) : (
          <img
            className="detail__img"
            src={imgSrc}
            alt={photo.original_filename || ''}
            onError={() => setFallbackLevel(l => l + 1)}
          />
        )}
        <button
          type="button"
          className="detail__nav detail__nav--next"
          onClick={onNext}
          disabled={isLast}
          aria-label="Next photo"
        >
          ›
        </button>
        <div className="detail__spacer" />
      </div>
    </div>
  );
}

function PhotoTile({ photo, onClick }) {
  const [imgFailed, setImgFailed] = useState(false);
  const isSeed = photo.r2_key.startsWith('seed/');

  if (isSeed || imgFailed) {
    return (
      <div
        className="wall__tile wall__tile--placeholder"
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onClick()}
      />
    );
  }

  return (
    <div
      className="wall__tile"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <img
        className="wall__tile-img"
        src={`/img/${photo.r2_key}?size=thumb`}
        alt={photo.original_filename || ''}
        onError={() => setImgFailed(true)}
      />
    </div>
  );
}

function Wall({ photos, onSelect }) {
  return (
    <section className="wall">
      <div className="wall__grid">
        {photos.map((photo, idx) => (
          <PhotoTile key={photo.id} photo={photo} onClick={() => onSelect(idx)} />
        ))}
      </div>
    </section>
  );
}

export default function App() {
  const [photos, setPhotos] = useState([]);
  const [status, setStatus] = useState('loading');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);

  function loadPhotos() {
    return fetch('/api/photos')
      .then((res) => {
        if (!res.ok) throw new Error('fetch failed');
        return res.json();
      })
      .then((data) => {
        setPhotos(data.photos ?? []);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }

  useEffect(() => { loadPhotos(); }, []);

  async function handleUpload(file) {
    setUploading(true);
    setUploadError(null);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': file.type, 'X-Filename': file.name },
        body: file,
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Upload failed');
      await loadPhotos();
    } catch (err) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  if (selectedIndex !== null && photos.length > 0) {
    return (
      <div className="app">
        <DetailView
          photos={photos}
          index={selectedIndex}
          onBack={() => setSelectedIndex(null)}
          onPrev={() => setSelectedIndex(i => Math.max(0, i - 1))}
          onNext={() => setSelectedIndex(i => Math.min(photos.length - 1, i + 1))}
        />
      </div>
    );
  }

  return (
    <div className="app">
      <TopBar onUpload={handleUpload} uploading={uploading} />
      {uploadError && (
        <p className="app__message app__message--error">{uploadError}</p>
      )}
      {status === 'loading' && <p className="app__message">Loading…</p>}
      {status === 'error' && <p className="app__message app__message--error">Failed to load photos.</p>}
      {status === 'ready' && <Wall photos={photos} onSelect={setSelectedIndex} />}
    </div>
  );
}
