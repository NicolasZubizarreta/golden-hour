import CountdownWidgetCard from './CountdownWidgetCard';
import {
  COUNTDOWN_APPEARANCE_TYPES,
  COUNTDOWN_FREQUENCIES,
  COUNTDOWN_TYPES,
  WEEK_DAYS,
  getPreviewCountdownData,
} from '../../utils/countdown';

export default function CountdownWidgetForm({
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
    id: 'preview-countdown',
    type: 'COUNTDOWN',
    size: widgetSize,
    data: getPreviewCountdownData(draft),
  };

  const previewWidthClass = widgetSize === 'RECT' ? 'max-w-[760px]' : 'max-w-[360px]';
  const previewAspectClass = widgetSize === 'RECT' ? 'aspect-[2.08/1]' : 'aspect-square';

  const compressImageFile = (file) => new Promise((resolve, reject) => {
    const fileReader = new FileReader();

    fileReader.onerror = () => reject(new Error("Impossible de lire l'image."));
    fileReader.onload = () => {
      if (typeof fileReader.result !== 'string') {
        reject(new Error("Impossible de lire l'image."));
        return;
      }

      const image = new Image();
      image.onerror = () => reject(new Error("Impossible de charger l'image."));
      image.onload = () => {
        const maxDimension = 1600;
        const ratio = Math.min(1, maxDimension / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * ratio));
        const height = Math.max(1, Math.round(image.height * ratio));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error("Impossible de traiter l'image."));
          return;
        }

        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };

      image.src = fileReader.result;
    };

    fileReader.readAsDataURL(file);
  });

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const compressedImage = await compressImageFile(file);
      onChange('backgroundType', COUNTDOWN_APPEARANCE_TYPES.IMAGE);
      onChange('backgroundImage', compressedImage);
    } catch {
      onChange('backgroundType', COUNTDOWN_APPEARANCE_TYPES.COLOR);
    }

    event.target.value = '';
  };

  return (
    <div className="flex min-h-0 w-full flex-col overflow-y-auto px-3 pt-3 pb-6 pr-5 sm:px-4 sm:pt-2 sm:pb-8 sm:pr-6 lg:overflow-hidden lg:px-0 lg:pt-2 lg:pb-0 lg:pr-0">
      <div className="flex items-center justify-between gap-4 pr-0 sm:pr-16">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 whitespace-nowrap text-sm font-bold text-golden-muted transition cursor-pointer hover:text-golden-text"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
          Retour aux widgets
        </button>

        <div className="hidden rounded-golden bg-golden-input px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-golden-text shadow-creuse sm:block">
          {widgetSize === 'RECT' ? 'Rectangle' : 'Carre'}
        </div>
      </div>

      <div className="mt-6 flex min-h-0 flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)] lg:gap-8">
        <form className="flex min-h-0 flex-col gap-6 pb-8 pr-2 sm:pr-3 lg:overflow-y-auto lg:pb-2 lg:pr-4" onSubmit={onSubmit}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-golden-muted">Widget</p>
            <h2 className="mt-2 text-3xl font-black text-golden-text">
              {isEditing ? 'Modifier le compte a rebours' : 'Compte a rebours'}
            </h2>
            <p className="mt-2 text-sm font-medium text-golden-muted">
              {isEditing
                ? 'Ajuste le titre, la date ou la regle de recurrence du widget.'
                : 'Configure un evenement unique ou un rendez-vous qui revient automatiquement.'}
            </p>
          </div>

          {modalError && (
            <div className="rounded-golden bg-red-100 px-4 py-3 text-sm font-bold text-red-700 shadow-halo">
              {modalError}
            </div>
          )}

          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold text-golden-text">Titre</span>
            <input
              type="text"
              value={draft.title}
              onChange={(event) => onChange('title', event.target.value)}
              placeholder="Ex: Soiree Jeux"
              className="w-full rounded-golden bg-golden-input px-5 py-3 text-sm font-medium text-golden-text shadow-creuse focus:outline-none focus:ring-2 focus:ring-golden-primary"
            />
          </label>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-bold text-golden-text">Type d'evenement</span>
            <div className="bg-golden-input shadow-creuse rounded-golden flex items-center">
              <button
                type="button"
                onClick={() => onChange('type', COUNTDOWN_TYPES.SINGLE)}
                className={`flex-1 py-3 rounded-golden text-sm font-bold transition-all duration-300 cursor-pointer ${
                  draft.type === COUNTDOWN_TYPES.SINGLE
                    ? 'bg-golden-primary text-gray-900 shadow-halo'
                    : 'text-gray-500 hover:text-gray-900 bg-transparent'
                }`}
              >
                <span className="sm:hidden">Unique</span>
                <span className="hidden sm:inline">Evenement unique</span>
              </button>
              <button
                type="button"
                onClick={() => onChange('type', COUNTDOWN_TYPES.RECURRING)}
                className={`flex-1 py-3 rounded-golden text-sm font-bold transition-all duration-300 cursor-pointer ${
                  draft.type === COUNTDOWN_TYPES.RECURRING
                    ? 'bg-golden-primary text-gray-900 shadow-halo'
                    : 'text-gray-500 hover:text-gray-900 bg-transparent'
                }`}
              >
                <span className="sm:hidden">Regulier</span>
                <span className="hidden sm:inline">Evenement regulier</span>
              </button>
            </div>
          </div>

          {draft.type === COUNTDOWN_TYPES.SINGLE ? (
            <label className="flex flex-col gap-2">
              <span className="text-sm font-bold text-golden-text">Date et heure</span>
              <input
                type="datetime-local"
                value={draft.targetDateInput}
                onChange={(event) => onChange('targetDateInput', event.target.value)}
                className="w-full rounded-golden bg-golden-input px-5 py-3 text-sm font-medium text-golden-text shadow-creuse focus:outline-none focus:ring-2 focus:ring-golden-primary"
              />
            </label>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-bold text-golden-text">Frequence</span>
                <div className="relative">
                  <select
                    value={draft.frequency}
                    onChange={(event) => onChange('frequency', event.target.value)}
                    className="w-full appearance-none rounded-golden bg-golden-input px-5 pr-14 py-3 text-sm font-medium text-golden-text shadow-creuse focus:outline-none focus:ring-2 focus:ring-golden-primary cursor-pointer"
                  >
                    <option value={COUNTDOWN_FREQUENCIES.WEEKLY}>Toutes les semaines</option>
                    <option value={COUNTDOWN_FREQUENCIES.MONTHLY_FIRST}>Le premier jour choisi du mois</option>
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-5 flex items-center text-golden-muted">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </div>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-bold text-golden-text">Jour</span>
                <div className="relative">
                  <select
                    value={draft.dayOfWeek}
                    onChange={(event) => onChange('dayOfWeek', event.target.value)}
                    className="w-full appearance-none rounded-golden bg-golden-input px-5 pr-14 py-3 text-sm font-medium text-golden-text shadow-creuse focus:outline-none focus:ring-2 focus:ring-golden-primary cursor-pointer"
                  >
                    {WEEK_DAYS.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-5 flex items-center text-golden-muted">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </div>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-bold text-golden-text">Heure</span>
                <input
                  type="time"
                  value={draft.time}
                  onChange={(event) => onChange('time', event.target.value)}
                  className="w-full rounded-golden bg-golden-input px-5 py-3 text-sm font-medium text-golden-text shadow-creuse focus:outline-none focus:ring-2 focus:ring-golden-primary"
                />
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-golden bg-golden-primary px-6 py-4 text-sm font-black text-gray-900 shadow-halo transition hover:brightness-105 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (isEditing ? 'Mise a jour...' : 'Creation...') : (isEditing ? 'Enregistrer les modifications' : 'Ajouter au Dashboard')}
          </button>

          <div className="border-t border-black/10 pt-6 lg:hidden">
            <div className={`mx-auto w-full ${previewWidthClass}`}>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-golden-muted">Apercu</p>
              <div className={`mt-4 w-full ${previewAspectClass}`}>
                <CountdownWidgetCard
                  widget={previewWidget}
                  canManageWidgets={false}
                  canDrag={false}
                  isDeleting={false}
                  onDelete={() => {}}
                />
              </div>

              <div className="mt-6 w-full border-t border-black/10 pt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-golden-muted">Apparence</p>

                <div className="mt-4 bg-golden-input shadow-creuse rounded-golden flex items-center">
                  <button
                    type="button"
                    onClick={() => onChange('backgroundType', COUNTDOWN_APPEARANCE_TYPES.COLOR)}
                    className={`flex-1 py-3 rounded-golden text-sm font-bold transition-all duration-300 cursor-pointer ${
                      draft.backgroundType === COUNTDOWN_APPEARANCE_TYPES.COLOR
                        ? 'bg-golden-primary text-gray-900 shadow-halo'
                        : 'text-gray-500 hover:text-gray-900 bg-transparent'
                    }`}
                  >
                    Couleur
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange('backgroundType', COUNTDOWN_APPEARANCE_TYPES.IMAGE)}
                    className={`flex-1 py-3 rounded-golden text-sm font-bold transition-all duration-300 cursor-pointer ${
                      draft.backgroundType === COUNTDOWN_APPEARANCE_TYPES.IMAGE
                        ? 'bg-golden-primary text-gray-900 shadow-halo'
                        : 'text-gray-500 hover:text-gray-900 bg-transparent'
                    }`}
                  >
                    Image
                  </button>
                </div>

                {draft.backgroundType === COUNTDOWN_APPEARANCE_TYPES.COLOR ? (
                  <div className="mt-4 flex items-center gap-4">
                    <label className="relative block h-14 w-20 overflow-hidden rounded-golden shadow-halo cursor-pointer">
                      <span
                        className="absolute inset-0 rounded-golden"
                        style={{ backgroundColor: draft.backgroundColor }}
                      />
                      <input
                        type="color"
                        value={draft.backgroundColor}
                        onChange={(event) => onChange('backgroundColor', event.target.value)}
                        className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                      />
                    </label>
                    <div className="rounded-golden bg-golden-input px-4 py-3 text-sm font-bold text-golden-text shadow-creuse">
                      {draft.backgroundColor}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-col gap-3">
                    <label className="inline-flex items-center justify-center rounded-golden bg-golden-primary px-5 py-3 text-sm font-black text-gray-900 shadow-halo cursor-pointer transition hover:brightness-105">
                      Choisir une image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </label>

                    {draft.backgroundImage ? (
                      <>
                        <div className="aspect-[16/9] w-full overflow-hidden rounded-golden shadow-halo">
                          <img src={draft.backgroundImage} alt="Fond du widget" className="h-full w-full object-cover" />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            onChange('backgroundImage', '');
                            onChange('backgroundType', COUNTDOWN_APPEARANCE_TYPES.COLOR);
                          }}
                          className="mb-2 inline-flex items-center justify-center rounded-golden bg-white px-5 py-3 text-sm font-black text-gray-900 shadow-halo cursor-pointer transition hover:bg-gray-50"
                        >
                          Retirer l'image
                        </button>
                      </>
                    ) : (
                      <div className="rounded-golden bg-golden-input px-4 py-4 text-sm font-bold text-golden-muted shadow-creuse">
                        Aucune image selectionnee pour le moment.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>

        <div className="hidden min-h-0 flex-col gap-5 px-2 pb-3 lg:flex lg:overflow-y-auto">
          <div className={`w-full ${previewWidthClass}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-golden-muted">Apercu</p>
            <div className={`mt-4 w-full ${previewAspectClass}`}>
              <CountdownWidgetCard
                widget={previewWidget}
                canManageWidgets={false}
                canDrag={false}
                isDeleting={false}
                onDelete={() => {}}
              />
            </div>

            <div className="mt-6 w-full border-t border-black/10 pt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-golden-muted">Apparence</p>

              <div className="mt-4 bg-golden-input shadow-creuse rounded-golden flex items-center">
                <button
                  type="button"
                  onClick={() => onChange('backgroundType', COUNTDOWN_APPEARANCE_TYPES.COLOR)}
                  className={`flex-1 py-3 rounded-golden text-sm font-bold transition-all duration-300 cursor-pointer ${
                    draft.backgroundType === COUNTDOWN_APPEARANCE_TYPES.COLOR
                      ? 'bg-golden-primary text-gray-900 shadow-halo'
                      : 'text-gray-500 hover:text-gray-900 bg-transparent'
                  }`}
                >
                  Couleur
                </button>
                <button
                  type="button"
                  onClick={() => onChange('backgroundType', COUNTDOWN_APPEARANCE_TYPES.IMAGE)}
                  className={`flex-1 py-3 rounded-golden text-sm font-bold transition-all duration-300 cursor-pointer ${
                    draft.backgroundType === COUNTDOWN_APPEARANCE_TYPES.IMAGE
                      ? 'bg-golden-primary text-gray-900 shadow-halo'
                      : 'text-gray-500 hover:text-gray-900 bg-transparent'
                  }`}
                >
                  Image
                </button>
              </div>

              {draft.backgroundType === COUNTDOWN_APPEARANCE_TYPES.COLOR ? (
                <div className="mt-4 flex items-center gap-4">
                  <label className="relative block h-14 w-20 overflow-hidden rounded-golden shadow-halo cursor-pointer">
                    <span
                      className="absolute inset-0 rounded-golden"
                      style={{ backgroundColor: draft.backgroundColor }}
                    />
                    <input
                      type="color"
                      value={draft.backgroundColor}
                      onChange={(event) => onChange('backgroundColor', event.target.value)}
                      className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                    />
                  </label>
                  <div className="rounded-golden bg-golden-input px-4 py-3 text-sm font-bold text-golden-text shadow-creuse">
                    {draft.backgroundColor}
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex flex-col gap-3">
                  <label className="inline-flex items-center justify-center rounded-golden bg-golden-primary px-5 py-3 text-sm font-black text-gray-900 shadow-halo cursor-pointer transition hover:brightness-105">
                    Choisir une image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>

                  {draft.backgroundImage ? (
                    <>
                      <div className="aspect-[16/9] w-full overflow-hidden rounded-golden shadow-halo">
                        <img src={draft.backgroundImage} alt="Fond du widget" className="h-full w-full object-cover" />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onChange('backgroundImage', '');
                          onChange('backgroundType', COUNTDOWN_APPEARANCE_TYPES.COLOR);
                        }}
                        className="mb-2 inline-flex items-center justify-center rounded-golden bg-white px-5 py-3 text-sm font-black text-gray-900 shadow-halo cursor-pointer transition hover:bg-gray-50"
                      >
                        Retirer l'image
                      </button>
                    </>
                  ) : (
                    <div className="rounded-golden bg-golden-input px-4 py-4 text-sm font-bold text-golden-muted shadow-creuse">
                      Aucune image selectionnee pour le moment.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
