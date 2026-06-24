import React, { useEffect, useRef, useState } from 'react';
import './App.css';

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

function DetailInfo({ photo, onDescriptionUpdate, onDelete, onBack, onPostedUpdate, onStarredUpdate }) {
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
  const [adminOpen, setAdminOpen] = useState(false);
  const [localPosted, setLocalPosted] = useState(photo.posted ? 1 : 0);
  const [postedSaving, setPostedSaving] = useState(false);
  const [postedError, setPostedError] = useState(null);
  const [localStarred, setLocalStarred] = useState(photo.starred ? 1 : 0);
  const [starredSaving, setStarredSaving] = useState(false);
  const [starredError, setStarredError] = useState(null);

  useEffect(() => {
    setEditMode(false);
    setEditText('');
    setEditError(null);
    setDeleteStep('idle');
    setDeleteError(null);
    setCopyState('idle');
    setAdminOpen(false);
    setLocalPosted(photo.posted ? 1 : 0);
    setPostedError(null);
    setLocalStarred(photo.starred ? 1 : 0);
    setStarredError(null);
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

  async function handlePostedToggle() {
    if (postedSaving) return;
    const newPosted = localPosted ? 0 : 1;
    setLocalPosted(newPosted);
    setPostedSaving(true);
    setPostedError(null);
    try {
      const res = await fetch(`/api/photos/${photo.id}/posted`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ posted: newPosted }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Update failed');
      onPostedUpdate(photo.id, newPosted);
    } catch (err) {
      setLocalPosted(newPosted ? 0 : 1);
      setPostedError(err.message || 'Update failed');
    } finally {
      setPostedSaving(false);
    }
  }

  async function handleStarredToggle() {
    if (starredSaving) return;
    const newStarred = localStarred ? 0 : 1;
    setLocalStarred(newStarred);
    setStarredSaving(true);
    setStarredError(null);
    try {
      const res = await fetch(`/api/photos/${photo.id}/starred`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starred: newStarred }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Update failed');
      onStarredUpdate(photo.id, newStarred);
    } catch (err) {
      setLocalStarred(newStarred ? 0 : 1);
      setStarredError(err.message || 'Update failed');
    } finally {
      setStarredSaving(false);
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
          <div className="detail__controls">
            <button
              type="button"
              className={`detail__admin-toggle${adminOpen ? ' detail__admin-toggle--open' : ''}`}
              onClick={() => setAdminOpen(v => !v)}
              aria-label="Admin tools"
            >
              ⚙
            </button>
            <button
              type="button"
              className="detail__posted-btn"
              onClick={handlePostedToggle}
              disabled={postedSaving}
              aria-label={localPosted ? 'Mark as unposted' : 'Mark as posted'}
            >
              <img
                className="detail__posted-icon"
                src={localPosted ? '/icon-posted-on.png' : '/icon-posted-off.png'}
                alt={localPosted ? 'Posted' : 'Not posted'}
                onError={e => { e.currentTarget.style.display = 'none'; }}
              />
            </button>
            <button
              type="button"
              className="detail__posted-btn"
              onClick={handleStarredToggle}
              disabled={starredSaving}
              aria-label={localStarred ? 'Mark as not starred' : 'Mark as starred'}
            >
              <img
                className="detail__posted-icon"
                src={localStarred ? '/icon-star-on.png' : '/icon-star-off.png'}
                alt={localStarred ? 'Starred' : 'Not starred'}
                onError={e => { e.currentTarget.style.display = 'none'; }}
              />
            </button>
          </div>
          {adminOpen && (
            <div className="detail__admin-btns">
              <button type="button" className="detail__action-btn" onClick={handleCopy} disabled={!photo.description}>{copyState === 'copied' ? 'Copied ✓' : 'Copy'}</button>
              <button type="button" className="detail__action-btn" onClick={handleEditStart}>Edit</button>
              <button type="button" className="detail__action-btn detail__action-btn--danger" onClick={() => setDeleteStep('confirm')}>Del</button>
            </div>
          )}
          {postedError && <p className="detail__action-error">{postedError}</p>}
          {starredError && <p className="detail__action-error">{starredError}</p>}
        </>
      )}
      <section>
        <h3 className="exif__header">TECHNICAL</h3>
        <div className="exif__grid">
          <ExifCell icon={<img className="exif__icon-img" src="/icon-camera.png" alt="" onError={e => { e.currentTarget.style.display = 'none'; }} />} label="CAMERA" value={photo.camera} />
          <ExifCell icon={<img className="exif__icon-img" src="/icon-lens.png" alt="" onError={e => { e.currentTarget.style.display = 'none'; }} />} label="LENS" value={photo.lens} />
          <ExifCell icon={<img className="exif__icon-img" src="/icon-aperture.png" alt="" onError={e => { e.currentTarget.style.display = 'none'; }} />} label="APERTURE" value={photo.aperture} />
          <ExifCell icon={<img className="exif__icon-img" src="/icon-iso.png" alt="" onError={e => { e.currentTarget.style.display = 'none'; }} />} label="ISO" value={photo.iso} />
          <ExifCell icon={<img className="exif__icon-img" src="/icon-shutter.png" alt="" onError={e => { e.currentTarget.style.display = 'none'; }} />} label="SHUTTER SPEED" value={photo.shutter} />
          <ExifCell icon={<img className="exif__icon-img" src="/icon-focal.png" alt="" onError={e => { e.currentTarget.style.display = 'none'; }} />} label="FOCAL LENGTH" value={focalDisplay} />
          <ExifCell icon={<img className="exif__icon-img" src="/icon-metering.png" alt="" onError={e => { e.currentTarget.style.display = 'none'; }} />} label="METERING" value={photo.metering} />
          <ExifCell icon={<img className="exif__icon-img" src="/icon-megapixels.png" alt="" onError={e => { e.currentTarget.style.display = 'none'; }} />} label="MEGAPIXELS" value={photo.megapixels} />
          <ExifCell icon={<img className="exif__icon-img" src="/icon-aspect-ratio.png" alt="" onError={e => { e.currentTarget.style.display = 'none'; }} />} label="ASPECT RATIO" value={photo.aspect_ratio} />
          <ExifCell icon={<img className="exif__icon-img" src="/icon-filesize.png" alt="" onError={e => { e.currentTarget.style.display = 'none'; }} />} label="FILE SIZE" value={photo.file_size} />
        </div>
      </section>
    </div>
  );
}

// ── TopBar ────────────────────────────────────────────────────────────────────

function TopBar({ onUpload, uploading, filterOpen, onToggleFilter, activeFilters, onTogglePill }) {
  const inputRef = useRef(null);
  const hasActiveFilter = activeFilters.size > 0;

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
          src="/hangar24-logo.PNG"
          alt=""
          className={`topbar__hangar-img${uploading ? ' topbar__hangar-img--uploading' : ''}`}
        />
      </button>
      <div className="topbar__filter-wrap">
        <button
          type="button"
          className="topbar__num-btn"
          onClick={onToggleFilter}
          aria-label="Toggle photo filters"
          aria-expanded={filterOpen}
        >
          <span className="topbar__num">24</span>
          {hasActiveFilter && <span className="topbar__num-dot" />}
        </button>
        {filterOpen && (
          <div className="topbar__filter-tray">
            <button
              type="button"
              className={`filter-pill${activeFilters.has('posted') ? ' filter-pill--active' : ''}`}
              onClick={() => onTogglePill('posted')}
              aria-label="Filter: Posted"
              aria-pressed={activeFilters.has('posted')}
            >
              <img className="filter-pill__icon" src="/icon-posted-on.png" alt="Posted" onError={e => { e.currentTarget.style.display = 'none'; }} />
            </button>
            <button
              type="button"
              className={`filter-pill${activeFilters.has('notPosted') ? ' filter-pill--active' : ''}`}
              onClick={() => onTogglePill('notPosted')}
              aria-label="Filter: Not posted"
              aria-pressed={activeFilters.has('notPosted')}
            >
              <img className="filter-pill__icon" src="/icon-posted-off.png" alt="Not posted" onError={e => { e.currentTarget.style.display = 'none'; }} />
            </button>
            <button
              type="button"
              className={`filter-pill${activeFilters.has('starred') ? ' filter-pill--active' : ''}`}
              onClick={() => onTogglePill('starred')}
              aria-label="Filter: Starred"
              aria-pressed={activeFilters.has('starred')}
            >
              <img className="filter-pill__icon" src="/icon-star-on.png" alt="Starred" onError={e => { e.currentTarget.style.display = 'none'; }} />
            </button>
            <button
              type="button"
              className={`filter-pill${activeFilters.has('notStarred') ? ' filter-pill--active' : ''}`}
              onClick={() => onTogglePill('notStarred')}
              aria-label="Filter: Not starred"
              aria-pressed={activeFilters.has('notStarred')}
            >
              <img className="filter-pill__icon" src="/icon-star-off.png" alt="Not starred" onError={e => { e.currentTarget.style.display = 'none'; }} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

// ── DetailView ────────────────────────────────────────────────────────────────

function DetailView({ photos, index, onBack, onPrev, onNext, onDescriptionUpdate, onDelete, onPostedUpdate, onStarredUpdate }) {
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
      {chromeVisible && (
        <DetailInfo
          photo={photo}
          onDescriptionUpdate={onDescriptionUpdate}
          onDelete={onDelete}
          onBack={onBack}
          onPostedUpdate={onPostedUpdate}
          onStarredUpdate={onStarredUpdate}
        />
      )}
      {chromeVisible && (
        <button type="button" className="detail__back-corner" onClick={onBack} aria-label="Back">‹</button>
      )}
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

function Wall({ displayPhotos, onSelect }) {
  if (displayPhotos.length === 0) {
    return (
      <section className="wall">
        <p className="wall__empty">No photos match</p>
      </section>
    );
  }
  return (
    <section className="wall">
      <div className="wall__grid">
        {displayPhotos.map(({ photo, origIdx }) => (
          <PhotoTile key={photo.id} photo={photo} onClick={() => onSelect(origIdx)} />
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
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState(new Set());

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

  function handlePostedUpdate(id, posted) {
    setPhotos(ps => ps.map(p => p.id === id ? { ...p, posted } : p));
  }

  function handleStarredUpdate(id, starred) {
    setPhotos(ps => ps.map(p => p.id === id ? { ...p, starred } : p));
  }

  function handleTogglePill(pill) {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(pill)) { next.delete(pill); } else { next.add(pill); }
      return next;
    });
  }

  const hasPosted = activeFilters.has('posted');
  const hasNotPosted = activeFilters.has('notPosted');
  const hasStarred = activeFilters.has('starred');
  const hasNotStarred = activeFilters.has('notStarred');

  const displayPhotos = photos.map((p, i) => ({ photo: p, origIdx: i })).filter(({ photo }) => {
    if (hasPosted && !hasNotPosted && !photo.posted) return false;
    if (hasNotPosted && !hasPosted && photo.posted) return false;
    if (hasStarred && !hasNotStarred && !photo.starred) return false;
    if (hasNotStarred && !hasStarred && photo.starred) return false;
    return true;
  });

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
          onPostedUpdate={handlePostedUpdate}
          onStarredUpdate={handleStarredUpdate}
        />
      </div>
    );
  }

  return (
    <div className="app">
      <TopBar onUpload={handleUpload} uploading={uploading} filterOpen={filterOpen} onToggleFilter={() => setFilterOpen(v => !v)} activeFilters={activeFilters} onTogglePill={handleTogglePill} />
      {uploadError && (
        <p className="app__message app__message--error">{uploadError}</p>
      )}
      {status === 'loading' && <p className="app__message">Loading…</p>}
      {status === 'error' && <p className="app__message app__message--error">Failed to load photos.</p>}
      {status === 'ready' && <Wall displayPhotos={displayPhotos} onSelect={setSelectedIndex} />}
    </div>
  );
}
