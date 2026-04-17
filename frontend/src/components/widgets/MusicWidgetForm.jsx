import MusicWidgetCard from "./MusicWidgetCard";
import { MUSIC_PLATFORMS } from "../../utils/musicWidget";

const platformButtonClass = (isActive, isDisabled = false) =>
  `flex flex-1 items-center justify-center px-4 py-3 rounded-golden text-sm font-bold transition-all duration-300 ${
    isDisabled ? "cursor-not-allowed opacity-45" : "cursor-pointer"
  } ${
    isActive
      ? "bg-golden-primary text-gray-900 shadow-halo"
      : `text-gray-500 bg-transparent ${isDisabled ? "" : "hover:text-gray-900"}`
  }`;

const PlatformBadge = ({ platform }) => {
  if (platform === MUSIC_PLATFORMS.DEEZER) {
    return (
      <div className="flex w-full items-center justify-center gap-3">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-golden bg-[#111827] text-[11px] font-black text-white shadow-halo">
          D
        </span>
        <span>Deezer</span>
      </div>
    );
  }

  if (platform === MUSIC_PLATFORMS.YOUTUBE_MUSIC) {
    return (
      <div className="flex w-full items-center justify-center gap-3">
        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-golden bg-[#FF0033] px-2 text-[10px] font-black text-white shadow-halo">
          YT
        </span>
        <span>YouTube Music</span>
      </div>
    );
  }

  return (
    <div className="flex w-full items-center justify-center gap-3">
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-golden bg-[#1DB954] text-[11px] font-black text-white shadow-halo">
        D
      </span>
      <span>Deezer</span>
    </div>
  );
};

export default function MusicWidgetForm({
  draft,
  widgetSize,
  modalError,
  isSubmitting,
  isEditing = false,
  onBack,
  onChange,
  onSubmit,
}) {
  const previewWidget = {
    id: "preview-music",
    type: "MUSIC",
    size: widgetSize,
    data: {
      platform: draft.platform,
      url: draft.url,
    },
  };

  const previewWidthClass =
    widgetSize === "RECT" ? "max-w-[760px]" : "max-w-[360px]";
  const previewAspectClass =
    widgetSize === "RECT" ? "aspect-[2.08/1]" : "aspect-square";

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
            ></path>
          </svg>
          Retour aux widgets
        </button>

        <div className="hidden rounded-golden bg-golden-input px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-golden-text shadow-creuse sm:block">
          {widgetSize === "RECT" ? "Rectangle" : "Carre"}
        </div>
      </div>

      <div className="mt-6 flex min-h-0 flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)] lg:gap-8">
        <form
          className="flex min-h-0 flex-col gap-6 pb-8 pr-2 sm:pr-3 lg:overflow-y-auto lg:pb-2 lg:pr-4"
          onSubmit={onSubmit}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-golden-muted">
              Widget
            </p>
            <h2 className="mt-2 text-3xl font-black text-golden-text">
              {isEditing ? "Modifier le widget musique" : "Widget musique"}
            </h2>
            <p className="mt-2 text-sm font-medium text-golden-muted">
              Colle un lien YouTube Music ou Deezer et le lecteur s'integrera
              automatiquement dans le dashboard.
            </p>
          </div>

          {modalError && (
            <div className="rounded-golden bg-red-100 px-4 py-3 text-sm font-bold text-red-700 shadow-halo">
              {modalError}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <span className="text-sm font-bold text-golden-text">
              Plateforme
            </span>
            <div className="bg-golden-input shadow-creuse rounded-golden flex items-center">
              <button
                type="button"
                onClick={() =>
                  onChange("platform", MUSIC_PLATFORMS.YOUTUBE_MUSIC)
                }
                className={platformButtonClass(
                  draft.platform === MUSIC_PLATFORMS.YOUTUBE_MUSIC,
                )}
              >
                <PlatformBadge platform={MUSIC_PLATFORMS.YOUTUBE_MUSIC} />
              </button>
              <button
                type="button"
                onClick={() => onChange("platform", MUSIC_PLATFORMS.DEEZER)}
                className={platformButtonClass(
                  draft.platform === MUSIC_PLATFORMS.DEEZER,
                )}
              >
                <PlatformBadge platform={MUSIC_PLATFORMS.DEEZER} />
              </button>
            </div>
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold text-golden-text">Lien</span>
            <input
              type="url"
              value={draft.url}
              onChange={(event) => onChange("url", event.target.value)}
              placeholder={
                draft.platform === MUSIC_PLATFORMS.DEEZER
                  ? "https://www.deezer.com/playlist/123456789"
                  : "https://music.youtube.com/watch?v=dQw4w9WgXcQ"
              }
              className="w-full rounded-golden bg-golden-input px-5 py-3 text-sm font-medium text-golden-text shadow-creuse focus:outline-none focus:ring-2 focus:ring-golden-primary"
            />
            <span className="text-xs font-medium text-golden-muted">
              Tu peux coller un lien de partage classique, il sera converti
              automatiquement en lecteur integre.
            </span>
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-golden bg-golden-primary px-6 py-4 text-sm font-black text-gray-900 shadow-halo transition hover:brightness-105 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? isEditing
                ? "Mise a jour..."
                : "Creation..."
              : isEditing
                ? "Enregistrer les modifications"
                : "Ajouter au Dashboard"}
          </button>

          <div className="border-t border-black/10 pt-6 lg:hidden">
            <div className={`mx-auto w-full ${previewWidthClass}`}>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-golden-muted">
                Apercu
              </p>
              <div className={`mt-4 w-full ${previewAspectClass}`}>
                <MusicWidgetCard
                  widget={previewWidget}
                  canManageWidgets={false}
                  canDrag={false}
                  isDeleting={false}
                  onDelete={() => {}}
                />
              </div>
            </div>
          </div>
        </form>

        <div className="hidden min-h-0 flex-col gap-5 px-2 pb-3 lg:flex lg:overflow-y-auto">
          <div className={`w-full ${previewWidthClass}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-golden-muted">
              Apercu
            </p>
            <div className={`mt-4 w-full ${previewAspectClass}`}>
              <MusicWidgetCard
                widget={previewWidget}
                canManageWidgets={false}
                canDrag={false}
                isDeleting={false}
                onDelete={() => {}}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
