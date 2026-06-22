import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import WidgetCardShell from './WidgetCardShell';

const createPinIcon = (isActive) =>
  L.divIcon({
    className: '',
    html: `<svg width="26" height="34" viewBox="0 0 26 34" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 0C5.82 0 0 5.82 0 13C0 22.75 13 34 13 34C13 34 26 22.75 26 13C26 5.82 20.18 0 13 0Z"
        fill="${isActive ? '#F59E0B' : '#FBBD23'}"
        stroke="${isActive ? '#92400E' : '#B45309'}"
        stroke-width="1.5"/>
      <circle cx="13" cy="13" r="4.5" fill="${isActive ? '#78350F' : '#1F2937'}"/>
    </svg>`,
    iconSize: [26, 34],
    iconAnchor: [13, 34],
    popupAnchor: [0, -36],
  });

function FlyToLocation({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo([target.lat, target.lng], 15, { animate: true, duration: 0.7 });
    }
  }, [target, map]);
  return null;
}

function FitBounds({ locations }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (fitted.current || locations.length < 2) return;
    fitted.current = true;
    const bounds = L.latLngBounds(locations.map((loc) => [loc.lat, loc.lng]));
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 13 });
  }, [locations, map]);
  return null;
}

function ZoomControls() {
  const map = useMap();
  return (
    <div className="absolute bottom-3 left-3 z-[1001] flex flex-col gap-1.5">
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => map.zoomIn()}
        aria-label="Zoom avant"
        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-[14px] bg-white text-base font-bold leading-none text-gray-600 shadow-halo transition hover:text-gray-900"
      >
        +
      </button>
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => map.zoomOut()}
        aria-label="Zoom arrière"
        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-[14px] bg-white text-base font-bold leading-none text-gray-600 shadow-halo transition hover:text-gray-900"
      >
        −
      </button>
    </div>
  );
}

export default function MapWidgetCard(props) {
  const { widget } = props;
  const title = widget?.data?.title || 'Carte';
  const locations = useMemo(
    () => (Array.isArray(widget?.data?.locations) ? widget.data.locations : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [widget?.data?.locations],
  );

  const [activeIndex, setActiveIndex] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);

  const handleLocationClick = (location, index) => {
    setActiveIndex(index);
    setFlyTarget({ lat: location.lat, lng: location.lng, ts: Date.now() });
  };

  // Computed once on mount — MapContainer does not support changing center/zoom props
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initialView = useMemo(() => {
    if (!locations.length) return { center: [46.6, 2.0], zoom: 5 };
    if (locations.length === 1) return { center: [locations[0].lat, locations[0].lng], zoom: 13 };
    const avgLat = locations.reduce((s, l) => s + l.lat, 0) / locations.length;
    const avgLng = locations.reduce((s, l) => s + l.lng, 0) / locations.length;
    return { center: [avgLat, avgLng], zoom: 8 };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (widget?.size !== 'RECT') {
    return (
      <WidgetCardShell
        {...props}
        typeLabel="Carte"
        controlsTone="dark"
        style={{ backgroundColor: '#F0FDF9' }}
      >
        <div className="flex h-full items-center justify-center text-center">
          <p className="max-w-[14rem] text-sm font-black leading-snug text-teal-900">
            La carte est disponible uniquement en format rectangle.
          </p>
        </div>
      </WidgetCardShell>
    );
  }

  return (
    <WidgetCardShell
      {...props}
      showTypeLabel={false}
      overlayControls
      controlsTone="dark"
      style={{ backgroundColor: '#ffffff', padding: 0 }}
    >
      <div className="flex min-h-0 flex-1 overflow-hidden rounded-golden">

        {/* ── Map pane ─────────────────────────────────── */}
        {/*
          `isolate` creates a new stacking context so Leaflet's internal
          z-indices (200–700) are scoped here and don't bleed above the
          widget controls (z-20) in the parent stacking context.
        */}
        <div className="relative isolate min-w-0 flex-1">
          {locations.length === 0 ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[#f5f5f3]">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-halo">
                <svg className="h-5 w-5 text-golden-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-golden-text">Aucun lieu ajouté</p>
                <p className="mt-0.5 text-xs font-medium text-golden-muted">
                  Modifie le widget pour ajouter des lieux.
                </p>
              </div>
            </div>
          ) : (
            <MapContainer
              center={initialView.center}
              zoom={initialView.zoom}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
              attributionControl={false}
              scrollWheelZoom={false}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              />
              <FlyToLocation target={flyTarget} />
              <FitBounds locations={locations} />
              <ZoomControls />
              {locations.map((location, index) => (
                <Marker
                  key={location.id || index}
                  position={[location.lat, location.lng]}
                  icon={createPinIcon(activeIndex === index)}
                  eventHandlers={{ click: () => handleLocationClick(location, index) }}
                />
              ))}
            </MapContainer>
          )}
        </div>

        {/* ── Divider ──────────────────────────────────── */}
        <div className="w-px shrink-0 bg-gray-100" />

        {/* ── List panel ───────────────────────────────── */}
        <div className="flex w-[38%] max-w-[240px] min-w-[150px] shrink-0 flex-col bg-white">

          <div className="border-b border-gray-100 px-4 pb-3 pt-4">
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-golden-muted">Carte</p>
            <h3 className="mt-0.5 truncate font-outfit text-sm font-black text-golden-text">{title}</h3>
            <p className="mt-0.5 text-[10px] font-medium text-golden-muted">
              {locations.length} lieu{locations.length !== 1 ? 'x' : ''}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-2">
            {locations.length === 0 ? (
              <p className="px-2 py-3 text-xs font-medium text-golden-muted">Aucun lieu pour l'instant.</p>
            ) : (
              <div className="flex flex-col gap-0.5">
                {locations.map((location, index) => (
                  <button
                    key={location.id || index}
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => handleLocationClick(location, index)}
                    className={`flex w-full cursor-pointer flex-col items-start gap-0.5 rounded-[22px] px-3 py-2.5 text-left transition ${
                      activeIndex === index
                        ? 'bg-golden-primary/15 ring-1 ring-golden-primary/40'
                        : 'hover:bg-black/[0.04]'
                    }`}
                  >
                    <div className="flex w-full min-w-0 items-start gap-2">
                      <div
                        className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                          activeIndex === index ? 'bg-amber-500' : 'bg-golden-primary'
                        }`}
                      />
                      <p className="min-w-0 break-words text-[11px] font-black text-golden-text">
                        {location.description}
                      </p>
                    </div>
                    {location.description !== location.address && (
                      <p className="min-w-0 break-words pl-4 text-[10px] font-medium text-golden-muted">
                        {location.address}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <p className="shrink-0 border-t border-gray-100 px-3 py-1.5 text-[8px] font-medium text-gray-300">
            © OpenStreetMap / CARTO
          </p>
        </div>

      </div>
    </WidgetCardShell>
  );
}
