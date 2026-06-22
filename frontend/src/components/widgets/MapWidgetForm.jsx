import { useEffect, useRef, useState } from 'react';
import MapWidgetCard from './MapWidgetCard';

const fetchSuggestions = async (query, signal) => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&accept-language=fr&addressdetails=1`,
    { headers: { 'User-Agent': 'GoldenHour/1.0 (school project)' }, signal },
  );
  if (!response.ok) return [];
  const results = await response.json();
  return results.map((hit) => ({
    label: hit.display_name.split(',').slice(0, 4).join(',').trim(),
    lat: parseFloat(hit.lat),
    lng: parseFloat(hit.lon),
  }));
};

function AddressAutocomplete({ value, onChange, onSelect, placeholder }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const abortRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const query = value.trim();
    if (query.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const timer = setTimeout(async () => {
      try {
        const results = await fetchSuggestions(query, controller.signal);
        setSuggestions(results);
        setOpen(results.length > 0);
        setHighlighted(-1);
      } catch {
        // aborted or network — stay silent
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleKeyDown = (e) => {
    if (!open || !suggestions.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter' && highlighted >= 0) {
      e.preventDefault();
      const picked = suggestions[highlighted];
      onChange(picked.label);
      onSelect(picked);
      setOpen(false);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const handlePick = (suggestion) => {
    onChange(suggestion.label);
    onSelect(suggestion);
    setOpen(false);
    setSuggestions([]);
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full rounded-golden bg-white px-4 py-2.5 text-sm font-medium text-golden-text shadow-halo focus:outline-none focus:ring-2 focus:ring-golden-primary"
      />

      {open && (
        <ul
          className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-52 overflow-y-auto rounded-[20px] bg-white shadow-halo"
          onWheel={(e) => e.stopPropagation()}
        >
          {suggestions.map((s, i) => (
            <li key={`${s.lat}-${s.lng}`}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handlePick(s)}
                className={`flex w-full cursor-pointer items-start gap-2.5 px-4 py-2.5 text-left transition ${
                  highlighted === i ? 'bg-golden-input' : 'hover:bg-golden-input/60'
                }`}
              >
                <svg
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-golden-muted"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="min-w-0 text-xs font-medium leading-snug text-golden-text">
                  {s.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function MapWidgetForm({
  draft,
  widgetSize,
  modalError,
  isSubmitting,
  isEditing = false,
  onBack,
  onChange,
  onSubmit,
}) {
  const [addressInput, setAddressInput] = useState('');
  const [descInput, setDescInput] = useState('');
  // Stores the geocoded result from a picked suggestion so we skip the fetch on "Ajouter"
  const [pendingGeocode, setPendingGeocode] = useState(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState('');

  const previewWidget = {
    id: 'preview-map',
    type: 'MAP',
    size: widgetSize,
    data: { title: draft.title || 'Ma carte', locations: draft.locations || [] },
  };

  // Called when user picks a suggestion — coordinates already known, no extra fetch needed
  const handleSuggestionSelect = (suggestion) => {
    setPendingGeocode({ lat: suggestion.lat, lng: suggestion.lng, address: suggestion.label });
    setGeocodeError('');
  };

  // Called when address field changes manually (clears any pending geocode from suggestion)
  const handleAddressChange = (value) => {
    setAddressInput(value);
    setPendingGeocode(null);
  };

  const handleAddLocation = async () => {
    const address = addressInput.trim();
    if (!address || isGeocoding) return;

    setIsGeocoding(true);
    setGeocodeError('');

    try {
      let geocoded = pendingGeocode;

      if (!geocoded) {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&accept-language=fr`,
          { headers: { 'User-Agent': 'GoldenHour/1.0 (school project)' } },
        );
        if (!response.ok) throw new Error('Service de géocodage indisponible.');
        const results = await response.json();
        if (!results.length) throw new Error('Adresse introuvable. Essaie un nom plus précis.');
        const hit = results[0];
        geocoded = {
          lat: parseFloat(hit.lat),
          lng: parseFloat(hit.lon),
          address: hit.display_name.split(',').slice(0, 3).join(',').trim(),
        };
      }

      const newLocation = {
        id: crypto.randomUUID(),
        address: geocoded.address,
        description: descInput.trim() || address,
        lat: geocoded.lat,
        lng: geocoded.lng,
      };

      onChange('locations', [...(draft.locations || []), newLocation]);
      setAddressInput('');
      setDescInput('');
      setPendingGeocode(null);
    } catch (err) {
      setGeocodeError(err.message || "Impossible de localiser cette adresse.");
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleDescKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddLocation();
    }
  };

  const handleRemoveLocation = (id) => {
    onChange('locations', (draft.locations || []).filter((loc) => loc.id !== id));
  };

  const PreviewCard = (
    <div className="w-full max-w-[760px]">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-golden-muted">Aperçu</p>
      <div className="mt-4 w-full aspect-[2.08/1]">
        <MapWidgetCard
          widget={previewWidget}
          canManageWidgets={false}
          canDrag={false}
          isDeleting={false}
          onDelete={() => {}}
        />
      </div>
    </div>
  );

  return (
    <div className="flex min-h-0 w-full flex-col overflow-y-auto px-3 pt-3 pb-6 pr-5 sm:px-4 sm:pt-2 sm:pb-8 sm:pr-6 lg:overflow-hidden lg:px-0 lg:pt-2 lg:pb-0 lg:pr-0">
      <div className="flex items-center justify-between gap-4 pr-0 sm:pr-16">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 whitespace-nowrap text-sm font-bold text-golden-muted transition cursor-pointer hover:text-golden-text"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
          Retour aux widgets
        </button>

        <div className="hidden rounded-golden bg-golden-input px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-golden-text shadow-creuse sm:block">
          Rectangle
        </div>
      </div>

      <div className="mt-6 flex min-h-0 flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(300px,0.95fr)] lg:gap-8">
        <form
          className="flex min-h-0 flex-col gap-6 pb-8 pr-2 sm:pr-3 lg:overflow-y-auto lg:pb-2 lg:pr-4"
          onSubmit={onSubmit}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-golden-muted">Widget</p>
            <h2 className="mt-2 text-3xl font-black text-golden-text">
              {isEditing ? 'Modifier la carte' : 'Widget carte'}
            </h2>
            <p className="mt-2 text-sm font-medium text-golden-muted">
              Ajoute des lieux avec une description. Dans le widget, clique sur un lieu dans la liste pour zoomer dessus sur la carte.
            </p>
          </div>

          {modalError && (
            <div className="rounded-golden bg-red-100 px-4 py-3 text-sm font-bold text-red-700 shadow-halo">
              {modalError}
            </div>
          )}

          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold text-golden-text">Titre de la carte</span>
            <input
              type="text"
              value={draft.title}
              onChange={(e) => onChange('title', e.target.value)}
              placeholder="Nos spots à Tokyo"
              className="w-full rounded-golden bg-golden-input px-5 py-3 text-sm font-medium text-golden-text shadow-creuse focus:outline-none focus:ring-2 focus:ring-golden-primary"
            />
          </label>

          {/* Add location block */}
          <div className="flex flex-col gap-3 rounded-golden bg-golden-input p-4 shadow-creuse">
            <p className="text-sm font-bold text-golden-text">Ajouter un lieu</p>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-golden-muted">Adresse ou nom du lieu</span>
              <AddressAutocomplete
                value={addressInput}
                onChange={handleAddressChange}
                onSelect={handleSuggestionSelect}
                placeholder="Tour Eiffel, Paris"
              />
              {pendingGeocode && (
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-teal-700">
                  <svg className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  Lieu localisé
                </p>
              )}
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-golden-muted">Description de l'activité</span>
              <input
                type="text"
                value={descInput}
                onChange={(e) => setDescInput(e.target.value)}
                onKeyDown={handleDescKeyDown}
                placeholder="Pique-nique au coucher du soleil"
                className="w-full rounded-golden bg-white px-4 py-2.5 text-sm font-medium text-golden-text shadow-halo focus:outline-none focus:ring-2 focus:ring-golden-primary"
              />
            </label>

            {geocodeError && (
              <p className="text-xs font-bold text-red-600">{geocodeError}</p>
            )}

            <button
              type="button"
              onClick={handleAddLocation}
              disabled={isGeocoding || !addressInput.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-golden bg-golden-text px-5 py-3 text-sm font-black text-white shadow-halo transition hover:brightness-110 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGeocoding ? (
                'Recherche en cours...'
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                  </svg>
                  Ajouter ce lieu
                </>
              )}
            </button>
          </div>

          {/* Added locations */}
          {draft.locations?.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-bold text-golden-text">
                Lieux ajoutés ({draft.locations.length})
              </p>
              <div className="flex flex-col gap-2">
                {draft.locations.map((location, index) => (
                  <div
                    key={location.id}
                    className="flex items-start gap-3 rounded-golden bg-white px-4 py-3 shadow-halo"
                  >
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-golden-primary text-[9px] font-black text-gray-900">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-golden-text">{location.description}</p>
                      <p className="mt-0.5 truncate text-xs font-medium text-golden-muted">{location.address}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveLocation(location.id)}
                      className="mt-0.5 shrink-0 cursor-pointer text-golden-muted transition hover:text-red-500"
                      aria-label="Supprimer ce lieu"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-golden bg-golden-primary px-6 py-4 text-sm font-black text-gray-900 shadow-halo transition hover:brightness-105 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? isEditing ? 'Mise à jour...' : 'Création...'
              : isEditing ? 'Enregistrer les modifications' : 'Ajouter au Dashboard'}
          </button>

          <div className="border-t border-black/10 pt-6 lg:hidden">
            {PreviewCard}
          </div>
        </form>

        <div className="hidden min-h-0 flex-col gap-5 px-2 pb-3 lg:flex lg:overflow-y-auto">
          {PreviewCard}
        </div>
      </div>
    </div>
  );
}
