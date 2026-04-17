/* eslint-disable react-refresh/only-export-components */
import { useEffect, useId, useMemo, useRef, useState } from "react";
import WidgetCardShell from "./WidgetCardShell";

const WEATHER_BACKGROUND =
  "linear-gradient(160deg,#1D4ED8 0%,#2563EB 42%,#38BDF8 100%)";

const normalizeText = (value) =>
  typeof value === "string" ? value.trim() : "";
const isPlainObject = (value) =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const normalizeForMatch = (value) =>
  normalizeText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

const toInt = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number) : null;
};

const formatCitySuggestion = (city) => {
  const parts = [
    normalizeText(city?.name),
    normalizeText(city?.country),
  ].filter(Boolean);

  return parts.join(", ");
};

const mapCitySuggestion = (city) => ({
  label: formatCitySuggestion(city),
  name: normalizeText(city?.name),
  state: normalizeText(city?.admin1),
  country: normalizeText(city?.country),
  lat: typeof city?.latitude === "number" ? city.latitude : null,
  lon: typeof city?.longitude === "number" ? city.longitude : null,
});

const weatherVisualFromCode = (weatherCode) => {
  const code = Number(weatherCode);

  if (code === 0 || code === 1) {
    return { key: "clear", label: "Ciel dégagé" };
  }

  if (code === 2 || code === 3) {
    return { key: "cloud", label: "Nuageux" };
  }

  if (code === 45 || code === 48) {
    return { key: "mist", label: "Brouillard" };
  }

  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return { key: "rain", label: "Pluie" };
  }

  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return { key: "snow", label: "Neige" };
  }

  if (code >= 95 && code <= 99) {
    return { key: "storm", label: "Orage" };
  }

  return { key: "cloud", label: "Conditions variables" };
};

const fetchJson = async (url, fallbackMessage) => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(fallbackMessage);
  }

  try {
    return await response.json();
  } catch {
    throw new Error(fallbackMessage);
  }
};

const fetchCitySuggestions = async (query) => {
  const normalizedQuery = normalizeText(query);

  if (normalizedQuery.length < 2) {
    return [];
  }

  try {
    const payload = await fetchJson(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(normalizedQuery)}&count=8&language=fr&format=json`,
      "Impossible de rechercher cette ville.",
    );

    if (!Array.isArray(payload?.results)) {
      return [];
    }

    const dedupe = new Set();

    return payload.results
      .map((city) => mapCitySuggestion(city))
      .filter((city) => {
        if (!city.label || dedupe.has(city.label)) return false;
        dedupe.add(city.label);
        return true;
      })
      .slice(0, 8);
  } catch {
    return [];
  }
};

const useCitySuggestions = (inputValue) => {
  const [suggestions, setSuggestions] = useState([]);
  const normalizedQuery = normalizeText(inputValue);

  useEffect(() => {
    if (normalizedQuery.length < 2) {
      return () => {};
    }

    let cancelled = false;
    const timeout = setTimeout(async () => {
      const nextSuggestions = await fetchCitySuggestions(normalizedQuery);
      if (!cancelled) {
        setSuggestions(nextSuggestions);
      }
    }, 260);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [normalizedQuery]);

  return normalizedQuery.length < 2 ? [] : suggestions;
};

const resolveCityFromGeocoding = async (query) => {
  const payload = await fetchJson(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=20&language=fr&format=json`,
    "Impossible de rechercher cette ville.",
  );

  if (!Array.isArray(payload?.results) || payload.results.length === 0) {
    throw new Error("Ville introuvable. Vérifie le nom saisi.");
  }

  const queryParts = normalizeText(query)
    .split(",")
    .map((part) => normalizeForMatch(part))
    .filter(Boolean);

  const scoreCandidate = (candidate) => {
    const name = normalizeForMatch(candidate?.name);
    const state = normalizeForMatch(candidate?.admin1);
    const country = normalizeForMatch(candidate?.country);
    const label = normalizeForMatch(formatCitySuggestion(candidate));
    let score = 0;

    if (queryParts.length > 0 && queryParts[0] === name) score += 100;
    if (queryParts.length > 1 && queryParts[1] === state) score += 60;
    if (queryParts.length > 1 && queryParts[1] === country) score += 70;
    if (queryParts.length > 2 && queryParts[2] === country) score += 70;
    if (label === queryParts.join(", ")) score += 120;

    return score;
  };

  const ranked = payload.results
    .map((city) => ({ city, score: scoreCandidate(city) }))
    .sort((a, b) => b.score - a.score);

  const selected = ranked[0]?.city || payload.results[0];

  if (
    typeof selected?.latitude !== "number" ||
    typeof selected?.longitude !== "number"
  ) {
    throw new Error("Ville introuvable. Vérifie le nom saisi.");
  }

  return {
    name: selected.name,
    country: selected.country,
    lat: selected.latitude,
    lon: selected.longitude,
  };
};

const fetchCityWeather = async (city, preferredCandidate = null) => {
  const query = normalizeText(city);

  if (!query) {
    throw new Error("Merci de renseigner une ville.");
  }

  const resolvedCity =
    preferredCandidate &&
    typeof preferredCandidate.lat === "number" &&
    typeof preferredCandidate.lon === "number"
      ? preferredCandidate
      : await resolveCityFromGeocoding(query);

  const weatherPayload = await fetchJson(
    `https://api.open-meteo.com/v1/forecast?latitude=${resolvedCity.lat}&longitude=${resolvedCity.lon}&timezone=auto&forecast_days=5&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min`,
    "Service météo indisponible. Réessaie dans un instant.",
  );

  const current = weatherPayload?.current;
  const daily = weatherPayload?.daily;

  if (!current || !Array.isArray(daily?.time) || daily.time.length < 2) {
    throw new Error("Données météo indisponibles pour cette ville.");
  }

  const forecast = daily.time.slice(1, 5).map((dayTime, index) => {
    const dayIndex = index + 1;
    const date = new Date(dayTime);

    return {
      dayKey: dayTime,
      label: new Intl.DateTimeFormat("fr-FR", { weekday: "short" })
        .format(date)
        .replace(".", ""),
      tempMin: toInt(daily.temperature_2m_min?.[dayIndex]),
      tempMax: toInt(daily.temperature_2m_max?.[dayIndex]),
      weatherCode: Number(daily.weather_code?.[dayIndex]),
    };
  });

  return {
    location: {
      city: normalizeText(resolvedCity.name) || query,
      country: normalizeText(resolvedCity.country),
      lat: resolvedCity.lat,
      lon: resolvedCity.lon,
    },
    current: {
      temp: toInt(current.temperature_2m),
      feelsLike: toInt(current.apparent_temperature),
      humidity: toInt(current.relative_humidity_2m),
      wind: toInt(current.wind_speed_10m),
      weatherCode: Number(current.weather_code),
    },
    forecast,
  };
};

export const createDefaultWeatherDraft = () => ({ city: "" });

export const createWeatherDraftFromData = (rawData) => {
  if (!isPlainObject(rawData)) {
    return createDefaultWeatherDraft();
  }

  return {
    city: normalizeText(rawData.city),
  };
};

export const buildWeatherPayloadFromDraft = (draft) => {
  if (!isPlainObject(draft)) {
    return { error: "Configuration du widget météo invalide." };
  }

  const city = normalizeText(draft.city);
  if (!city) {
    return { error: "Merci de renseigner une ville." };
  }

  return { payload: { city } };
};

function WeatherGlyph({ code, size = 54 }) {
  const visual = weatherVisualFromCode(code);
  const glyphByKey = {
    clear: "☀️",
    cloud: "☁️",
    mist: "🌫️",
    rain: "🌧️",
    snow: "❄️",
    storm: "⛈️",
  };

  return (
    <span
      aria-hidden="true"
      style={{ fontSize: `${size}px`, lineHeight: 1 }}
      className="select-none"
    >
      {glyphByKey[visual.key] || "☁️"}
    </span>
  );
}

export function WeatherWidgetCard(props) {
  const { widget } = props;
  const layoutRef = useRef(null);
  const initialCity = useMemo(
    () => normalizeText(widget?.data?.city),
    [widget?.data?.city],
  );

  const [city, setCity] = useState(initialCity);
  const [weather, setWeather] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(initialCity));
  const [error, setError] = useState("");
  const [contentScale, setContentScale] = useState(1);
  const squareBaseSize = 300;

  useEffect(() => {
    setCity(initialCity);
  }, [initialCity]);

  useEffect(() => {
    const query = normalizeText(city);

    if (!query) {
      setWeather(null);
      setIsLoading(false);
      setError("");
      return () => {};
    }

    let cancelled = false;

    const run = async () => {
      setIsLoading(true);
      setError("");

      try {
        const result = await fetchCityWeather(query, null);
        if (!cancelled) {
          setWeather(result);
        }
      } catch (err) {
        if (!cancelled) {
          setWeather(null);
          setError(err instanceof Error ? err.message : "Erreur météo.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [city]);

  useEffect(() => {
    if (
      widget?.size === "RECT" ||
      !layoutRef.current ||
      typeof ResizeObserver === "undefined"
    ) {
      return undefined;
    }

    const node = layoutRef.current;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      const { width = 0, height = 0 } = entry?.contentRect || {};

      if (!width || !height) return;

      const nextScale = Math.min(
        1,
        width / squareBaseSize,
        height / squareBaseSize,
      );
      setContentScale(nextScale);
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, [widget?.size]);

  const currentVisual = weatherVisualFromCode(weather?.current?.weatherCode);
  const locationLabel = weather
    ? `${weather.location.city}${weather.location.country ? `, ${weather.location.country}` : ""}`
    : city || "Choisis une ville";
  const isCompactSquare = widget?.size !== "RECT" && contentScale < 0.9;

  return (
    <WidgetCardShell
      {...props}
      showTypeLabel={false}
      controlsTone="light"
      className="p-[clamp(0.72rem,3.2vw,1.12rem)]"
      style={{ background: WEATHER_BACKGROUND, color: "#EFF6FF" }}
      overlay={
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.22),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.12),transparent_34%)]" />
      }
    >
      {widget?.size === "RECT" ? (
        <div
          ref={layoutRef}
          className="grid h-full w-full grid-cols-2 items-center gap-x-[clamp(0.3rem,1.8vw,0.6rem)] p-[clamp(0.3rem,1.2vw,0.5rem)]"
        >
          {/* Left Column: Current Weather */}
          <div className="flex h-full flex-col items-start justify-between">
            {isLoading ? (
              <p className="text-sm font-bold text-white/85">Chargement...</p>
            ) : error ? (
              <p className="text-sm font-bold text-red-100">{error}</p>
            ) : weather ? (
              <>
                <div className="min-w-0 w-full">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/75">
                    Météo
                  </p>
                  <h3 className="mt-0.5 truncate font-outfit text-[clamp(0.7rem,2.3vw,1rem)] font-black leading-tight">
                    {locationLabel}
                  </h3>
                </div>

                <div className="flex w-full items-center justify-start gap-[clamp(0.2rem,1vw,0.35rem)] -my-1">
                  <WeatherGlyph code={weather.current.weatherCode} size={46} />
                  <div className="min-w-0">
                    <p className="font-black leading-none text-[clamp(1.25rem,4.2vw,1.8rem)]">
                      {weather.current.temp ?? "--"}°C
                    </p>
                    <p className="mt-0.5 truncate text-sm font-semibold text-white/85">
                      {currentVisual.label}
                    </p>
                  </div>
                </div>

                <div className="grid w-full max-w-[12rem] grid-cols-3 gap-x-1.5 gap-y-1 text-center">
                  <div>
                    <p className="text-[8.5px] font-bold uppercase tracking-wider text-white/70">
                      Ressenti
                    </p>
                    <p className="mt-0.5 text-xs font-black text-white/95">
                      {weather.current.feelsLike ?? "--"}°
                    </p>
                  </div>
                  <div>
                    <p className="text-[8.5px] font-bold uppercase tracking-wider text-white/70">
                      Humidité
                    </p>
                    <p className="mt-0.5 text-xs font-black text-white/95">
                      {weather.current.humidity ?? "--"}%
                    </p>
                  </div>
                  <div>
                    <p className="text-[8.5px] font-bold uppercase tracking-wider text-white/70">
                      Vent
                    </p>
                    <p className="mt-0.5 text-xs font-black text-white/95">
                      {weather.current.wind ?? "--"} km/h
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm font-bold text-white/85">
                Ajoute une ville.
              </p>
            )}
          </div>

          {/* Right Column: Forecast */}
          <div className="flex h-full items-center justify-center">
            {isLoading ? (
              <p className="text-center text-sm font-bold text-white/85">
                Prévisions...
              </p>
            ) : error ? (
              <p className="text-center text-sm font-bold text-red-100">--</p>
            ) : weather?.forecast?.length ? (
              <div className="grid h-full w-full max-w-[9.5rem] grid-cols-2 grid-rows-2 place-content-center gap-[clamp(0.15rem,0.6vw,0.25rem)]">
                {weather.forecast.slice(0, 4).map((day) => (
                  <div
                    key={day.dayKey}
                    className="mx-auto flex aspect-square min-h-0 w-[88%] max-w-[4.2rem] flex-col items-center justify-center rounded-[8px] border border-white/20 bg-white/10 p-0.5 text-center shadow-inner"
                  >
                    <p className="text-[clamp(0.38rem,1.2vw,0.48rem)] font-black uppercase text-white/95">
                      {day.label}
                    </p>
                    <WeatherGlyph code={day.weatherCode} size={18} />
                    <p className="text-[clamp(0.38rem,1.2vw,0.48rem)] font-bold text-white/95">
                      {day.tempMax ?? "--"}°
                    </p>
                    <p className="text-[clamp(0.32rem,1vw,0.4rem)] font-semibold text-white/75">
                      {day.tempMin ?? "--"}°
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm font-bold text-white/85">
                Aucune prévision.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div ref={layoutRef} className="h-full w-full overflow-hidden">
          <div className="flex h-full w-full items-center justify-center">
            <div
              className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-1.5 pt-2"
              style={{
                width: `${squareBaseSize}px`,
                height: `${squareBaseSize}px`,
                transform: `scale(${contentScale})`,
                transformOrigin: "center center",
              }}
            >
              <div className="flex items-start justify-center gap-2 w-full text-center">
                <p className="truncate text-[11px] font-semibold uppercase tracking-[0.2em] text-white/78 text-center">
                  Météo
                </p>
              </div>

              <div className="flex min-h-0 flex-col items-center justify-center rounded-golden px-4 text-center">
                {isLoading ? (
                  <p className="text-sm font-bold text-white/85">
                    Chargement...
                  </p>
                ) : error ? (
                  <p className="text-sm font-bold text-red-100">{error}</p>
                ) : weather ? (
                  <>
                    <WeatherGlyph
                      code={weather.current.weatherCode}
                      size={isCompactSquare ? 132 : 116}
                    />
                    <p
                      className={`mt-1 font-black leading-none ${isCompactSquare ? "text-[clamp(2.35rem,8.6vw,3.2rem)]" : "text-[clamp(2.1rem,7.8vw,2.85rem)]"}`}
                    >
                      {weather.current.temp ?? "--"} °C
                    </p>
                    <p
                      className={`mt-0.5 font-semibold text-white/86 ${isCompactSquare ? "text-[1.08rem]" : "text-base"}`}
                    >
                      {currentVisual.label}
                    </p>
                    {!isCompactSquare && (
                      <div className="mt-1.5 grid w-full max-w-[14.5rem] grid-cols-3 gap-1 text-center">
                        <div className="px-1 py-0.5">
                          <p className="text-[8.5px] font-bold uppercase tracking-[0.05em] text-white/70">
                            Ressenti
                          </p>
                          <p className="text-[11px] font-black text-white/92">
                            {weather.current.feelsLike ?? "--"} °C
                          </p>
                        </div>
                        <div className="px-1 py-0.5">
                          <p className="text-[8.5px] font-bold uppercase tracking-[0.05em] text-white/70">
                            Humidité
                          </p>
                          <p className="text-[11px] font-black text-white/92">
                            {weather.current.humidity ?? "--"}%
                          </p>
                        </div>
                        <div className="px-1 py-0.5">
                          <p className="text-[8.5px] font-bold uppercase tracking-[0.05em] text-white/70">
                            Vent
                          </p>
                          <p className="text-[11px] font-black text-white/92">
                            {weather.current.wind ?? "--"} km/h
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm font-bold text-white/85">
                    Ajoute une ville.
                  </p>
                )}
              </div>

              <p className="truncate text-center text-[clamp(1.08rem,3.7vw,1.3rem)] font-black tracking-[0.03em] text-white/92">
                {locationLabel}
              </p>
            </div>
          </div>
        </div>
      )}
    </WidgetCardShell>
  );
}

export function WeatherWidgetForm({
  draft,
  widgetSize,
  modalError,
  isSubmitting,
  isEditing = false,
  onBack,
  onChange,
  onSubmit,
}) {
  const formCityDatalistId = useId();
  const formCitySuggestions = useCitySuggestions(draft.city);
  const previewWidget = {
    id: "preview-weather",
    type: "WEATHER",
    size: widgetSize,
    data: { city: draft.city },
  };

  const previewWidthClass =
    widgetSize === "RECT" ? "max-w-[760px]" : "max-w-[360px]";
  const previewAspectClass =
    widgetSize === "RECT" ? "aspect-[2.08/1]" : "aspect-square";

  const PreviewCard = (
    <div className={`w-full ${previewWidthClass}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-golden-muted">
        Aperçu
      </p>
      <div className={`mt-4 w-full ${previewAspectClass}`}>
        <WeatherWidgetCard
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
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Retour aux widgets
        </button>

        <div className="hidden rounded-golden bg-golden-input px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-golden-text shadow-creuse sm:block">
          {widgetSize === "RECT" ? "Rectangle" : "Carré"}
        </div>
      </div>

      <div className="mt-6 flex min-h-0 flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(300px,0.95fr)] lg:gap-8">
        <form
          className="flex min-h-0 flex-col gap-6 pb-8 pr-2 sm:pr-3 lg:overflow-y-auto lg:pb-2 lg:pr-4"
          onSubmit={onSubmit}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-golden-muted">
              Widget
            </p>
            <h2 className="mt-2 text-3xl font-black text-golden-text">
              {isEditing ? "Modifier la météo" : "Widget météo"}
            </h2>
            <p className="mt-2 text-sm font-medium text-golden-muted">
              Renseigne uniquement le nom de la ville (ex: Annecy).
            </p>
          </div>

          {modalError && (
            <div className="rounded-golden bg-red-100 px-4 py-3 text-sm font-bold text-red-700 shadow-halo">
              {modalError}
            </div>
          )}

          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold text-golden-text">Ville</span>
            <input
              type="text"
              list={formCityDatalistId}
              value={draft.city}
              onChange={(event) => onChange("city", event.target.value)}
              placeholder="Annecy"
              className="w-full rounded-golden bg-golden-input px-5 py-3 text-sm font-medium text-golden-text shadow-creuse focus:outline-none focus:ring-2 focus:ring-golden-primary"
            />
            <datalist id={formCityDatalistId}>
              {formCitySuggestions.map((suggestion) => (
                <option key={suggestion.label} value={suggestion.label} />
              ))}
            </datalist>
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-golden bg-golden-primary px-6 py-4 text-sm font-black text-gray-900 shadow-halo transition hover:brightness-105 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? isEditing
                ? "Mise à jour..."
                : "Création..."
              : isEditing
                ? "Enregistrer les modifications"
                : "Ajouter au Dashboard"}
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

export default WeatherWidgetCard;
