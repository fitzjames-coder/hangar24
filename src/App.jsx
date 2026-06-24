import React, { useEffect, useRef, useState } from 'react';
import './App.css';

// ── SVG icons (inline line-art, stroke only) ──────────────────────────────────

function IconCamera() {
  return (
    <svg viewBox="0 0 28 28" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="8" width="24" height="16" rx="2" />
      <path d="M9 8V6.5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1V8" />
      <circle cx="14" cy="16" r="4.5" />
    </svg>
  );
}

function IconLens() {
  return (
    <svg viewBox="0 0 28 28" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="14" cy="14" r="11" />
      <circle cx="14" cy="14" r="6" />
      <circle cx="14" cy="14" r="2" />
    </svg>
  );
}

function IconAperture() {
  return (
    <svg viewBox="0 0 28 28" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="14" cy="14" r="11" />
      <polygon points="14,7.5 19.7,10.8 19.7,17.2 14,20.5 8.3,17.2 8.3,10.8" />
    </svg>
  );
}

function IconISO() {
  return (
    <svg viewBox="0 0 28 28" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="2" y="7" width="24" height="14" rx="3" />
      <text x="14" y="18" textAnchor="middle" fontSize="8" fontWeight="bold" fill="currentColor" stroke="none" fontFamily="Helvetica,Arial,sans-serif">ISO</text>
    </svg>
  );
}

function IconShutter() {
  return (
    <svg viewBox="0 0 28 28" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="14" cy="16" r="10" />
      <line x1="11.5" y1="3" x2="16.5" y2="3" />
      <line x1="14" y1="3" x2="14" y2="6" />
      <line x1="14" y1="16" x2="14" y2="10" />
      <line x1="14" y1="16" x2="19" y2="16" />
    </svg>
  );
}

function IconFocalLength() {
  return (
    <svg viewBox="0 0 28 28" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="14" r="2" />
      <line x1="7" y1="14" x2="23" y2="4" />
      <line x1="7" y1="14" x2="23" y2="24" />
      <line x1="23" y1="4" x2="23" y2="24" />
    </svg>
  );
}

function IconFlash() {
  return (
    <svg viewBox="0 0 28 28" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3L6 17h8l-3 8 13-14h-8L14 3z" />
    </svg>
  );
}

function IconWhiteBalance() {
  return (
    <svg viewBox="0 0 28 28" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="2" y="7" width="24" height="14" rx="3" />
      <text x="14" y="18" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="currentColor" stroke="none" fontFamily="Helvetica,Arial,sans-serif">WB</text>
    </svg>
  );
}

function IconMeter() {
  return (
    <svg viewBox="0 0 28 28" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 22 A10 10 0 0 1 23 22" />
      <line x1="8" y1="19.5" x2="9.7" y2="17" />
      <line x1="20" y1="19.5" x2="18.3" y2="17" />
      <line x1="14" y1="12" x2="14" y2="22" />
      <circle cx="14" cy="22" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconMegapixels() {
  return (
    <svg viewBox="0 0 28 28" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="7" width="22" height="14" rx="1.5" />
      <line x1="10" y1="7" x2="10" y2="21" />
      <line x1="18" y1="7" x2="18" y2="21" />
      <line x1="3" y1="14" x2="25" y2="14" />
    </svg>
  );
}

function IconAspectRatio() {
  return (
    <svg viewBox="0 0 28 28" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="7" width="20" height="14" rx="1.5" />
      <polyline points="4,16 4,21 9,21" />
      <polyline points="24,12 24,7 19,7" />
    </svg>
  );
}

function IconFileSize() {
  return (
    <svg viewBox="0 0 28 28" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 4h10l6 6v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
      <polyline points="17,4 17,10 23,10" />
    </svg>
  );
}

// ── ExifCell ──────────────────────────────────────────────────────────────────

function ExifCell({ icon, label, value }) {
  return (
    <div className="exif__cell">
      <span className="exif__icon">{icon}</span>
      <span className="exif__stack">
        <span className="exif__label">{label}</span>
        <span className="exif__value">{value || '—'}</span>
      </span>
    </div>
  );
}

// ── DetailInfo ────────────────────────────────────────────────────────────────

function DetailInfo({ photo, onDescriptionUpdate, onDelete, onBack }) {
  const parts = photo.taken_at ? photo.taken_at.split(' ') : [];
  const dateStr = parts[0] || null;
  const timeStr = parts[1] || null;

  let focalDisplay = photo.focal_length || null;
  if (photo.focal_length_35mm && photo.focal_length && photo.focal_length_35mm !== photo.focal_length) {
    focalDisplay = `${photo.focal_length_35mm} (${photo.focal_length})`;
  } else if (photo.focal_length_35mm && !photo.focal_length) {
    focalDisplay = photo.focal_length_35mm;
  }

  const [copyState, setCopyState] = useState('idle');
  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState('');
  const [editError, setEditError] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [deleteStep, setDeleteStep] = useState('idle');
  const [deleteError, setDeleteError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setEditMode(false);
    setEditText('');
    setEditError(null);
    setDeleteStep('idle');
    setDeleteError(null);
    setCopyState('idle');
  }, [photo.id]);

  async function handleCopy() {
    try { await navigator.clipboard.writeText(photo.description || ''); } catch (_) {}
    setCopyState('copied');
    setTimeout(() => setCopyState('idle'), 1500);
  }

  function handleEditStart() {
    setEditText(photo.description || '');
    setEditError(null);
    setEditMode(true);
  }

  async function handleSave() {
    setEditSaving(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/photos/${photo.id}/description`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: editText }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Save failed');
      onDescriptionUpdate(photo.id, editText);
      setEditMode(false);
    } catch (err) {
      setEditError(err.message || 'Save failed');
    } finally {
      setEditSaving(false);
    }
  }

  async function handleConfirmDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/photos/${photo.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Delete failed');
      onDelete(photo.id);
    } catch (err) {
      setDeleteError(err.message || 'Delete failed');
      setDeleting(false);
    }
  }

  return (
    <div className="detail__info">
      {(photo.title || dateStr) && (
        <div className="detail__heading">
          {photo.title && <p className="detail__reg">{photo.title}</p>}
          {dateStr && (
            <p className="detail__date">{dateStr}{timeStr && <>&nbsp;&nbsp;{timeStr}</>}</p>
          )}
        </div>
      )}

      {deleteStep === 'confirm' ? (
        <div className="detail__delete-confirm">
          <p className="detail__delete-msg">Delete this photo? This can't be undone.</p>
          {deleteError && <p className="detail__action-error">{deleteError}</p>}
          <div className="detail__actions">
            <button type="button" className="detail__action-btn detail__action-btn--danger" onClick={handleConfirmDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Confirm Delete'}
            </button>
            <button type="button" className="detail__action-btn" onClick={() => { setDeleteStep('idle'); setDeleteError(null); }}>
              Cancel
            </button>
          </div>
        </div>
      ) : editMode ? (
        <>
          <textarea
            className="detail__desc-textarea"
            value={editText}
            onChange={e => setEditText(e.target.value)}
            rows={4}
            placeholder="Add a description…"
          />
          {editError && <p className="detail__action-error">{editError}</p>}
          <div className="detail__actions">
            <button type="button" className="detail__action-btn detail__action-btn--primary" onClick={handleSave} disabled={editSaving}>
              {editSaving ? 'Saving…' : 'Save'}
            </button>
            <button type="button" className="detail__action-btn" onClick={() => { setEditMode(false); setEditError(null); }}>
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          {photo.description && <p className="detail__desc">{photo.description}</p>}
          <div className="detail__actions">
            <button type="button" className="detail__action-btn" onClick={handleCopy} disabled={!photo.description}>
              {copyState === 'copied' ? 'Copied ✓' : 'Copy'}
            </button>
            <button type="button" className="detail__action-btn" onClick={handleEditStart}>
              Edit
            </button>
            <button type="button" className="detail__action-btn detail__action-btn--danger" onClick={() => setDeleteStep('confirm')}>
              Del
            </button>
            <button type="button" className="detail__action-btn detail__action-btn--back" onClick={onBack}>
              ‹ Back
            </button>
          </div>
        </>
      )}

      <section className="exif">
        <h3 className="exif__header">TECHNICAL</h3>
        <div className="exif__grid">
          <ExifCell icon={<IconCamera />} label="CAMERA" value={photo.camera} />
          <ExifCell icon={<IconLens />} label="LENS" value={photo.lens} />
          <ExifCell icon={<IconAperture />} label="APERTURE" value={photo.aperture} />
          <ExifCell icon={<IconISO />} label="ISO" value={photo.iso} />
          <ExifCell icon={<IconShutter />} label="SHUTTER SPEED" value={photo.shutter} />
          <ExifCell icon={<IconFocalLength />} label="FOCAL LENGTH" value={focalDisplay} />
          <ExifCell icon={<IconMeter />} label="METERING" value={photo.metering} />
          <ExifCell icon={<IconMegapixels />} label="MEGAPIXELS" value={photo.megapixels} />
          <ExifCell icon={<IconAspectRatio />} label="ASPECT RATIO" value={photo.aspect_ratio} />
          <ExifCell icon={<IconFileSize />} label="FILE SIZE" value={photo.file_size} />
        </div>
      </section>
    </div>
  );
}

// ── TopBar ────────────────────────────────────────────────────────────────────

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

// ── DetailView ────────────────────────────────────────────────────────────────

function DetailView({ photos, index, onBack, onPrev, onNext, onDescriptionUpdate, onDelete }) {
  const photo = photos[index];

  // 0 = try preview, 1 = try original, 2 = failed
  const [fallbackLevel, setFallbackLevel] = useState(0);
  const [chromeVisible, setChromeVisible] = useState(false);

  // Reset per-photo state and scroll to top when the photo changes
  useEffect(() => {
    setFallbackLevel(0);
    setChromeVisible(false);
    window.scrollTo(0, 0);
  }, [photo.r2_key]);

  const imgSrc = fallbackLevel === 0
    ? `/img/${photo.r2_key}?size=preview`
    : `/img/${photo.r2_key}`;
  const imgFailed = fallbackLevel >= 2;

  // Touch: track start coords and whether the touch was already handled
  const touchStart = useRef(null);
  const touchHandled = useRef(false);

  function handleTouchStart(e) {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }

  function handleTouchEnd(e) {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;

    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      // tap — toggle chrome; scroll to top when hiding so image is centred
      touchHandled.current = true;
      setChromeVisible(v => {
        if (v) window.scrollTo(0, 0);
        return !v;
      });
      return;
    }
    if (Math.abs(dx) >= 50 && Math.abs(dx) > Math.abs(dy)) {
      // horizontal swipe — change photo
      if (dx < 0) onNext();
      else onPrev();
    }
    // vertical-dominant or in-between — do nothing (native scroll)
  }

  function handleBodyClick() {
    if (touchHandled.current) {
      touchHandled.current = false;
      return;
    }
    setChromeVisible(v => {
      if (v) window.scrollTo(0, 0);
      return !v;
    });
  }

  return (
    <div className={`detail${chromeVisible ? ' detail--info-open' : ''}`}>
      <div
        className="detail__body"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleBodyClick}
      >
        {imgFailed ? (
          <p className="detail__unavailable">Image unavailable</p>
        ) : (
          <div className="detail__img-wrap">
            <img
              className="detail__img"
              src={imgSrc}
              alt={photo.original_filename || ''}
              onError={() => setFallbackLevel(l => l + 1)}
            />
            {photo.title && (
              <span className="detail__img-reg">{photo.title}</span>
            )}
          </div>
        )}
      </div>
      {chromeVisible && <DetailInfo photo={photo} onDescriptionUpdate={onDescriptionUpdate} onDelete={onDelete} onBack={onBack} />}
    </div>
  );
}

// ── PhotoTile ─────────────────────────────────────────────────────────────────

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
      {photo.title && (
        <span className="wall__tile-reg">{photo.title}</span>
      )}
    </div>
  );
}

// ── Wall ──────────────────────────────────────────────────────────────────────

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

// ── App ───────────────────────────────────────────────────────────────────────

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

  function handleDescriptionUpdate(id, description) {
    setPhotos(ps => ps.map(p => p.id === id ? { ...p, description } : p));
  }

  function handleDelete(id) {
    setPhotos(ps => ps.filter(p => p.id !== id));
    setSelectedIndex(null);
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
          onDescriptionUpdate={handleDescriptionUpdate}
          onDelete={handleDelete}
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
