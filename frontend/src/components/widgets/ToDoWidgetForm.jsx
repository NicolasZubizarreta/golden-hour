import ToDoWidgetCard from './ToDoWidgetCard';

export default function ToDoWidgetForm({
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
    id: 'preview-todo',
    type: 'TODO',
    size: widgetSize,
    data: { title: draft.title || 'Liste de tâches' },
  };

  const previewWidthClass = widgetSize === 'RECT' ? 'max-w-[760px]' : 'max-w-[360px]';
  const previewAspectClass = widgetSize === 'RECT' ? 'aspect-[2.08/1]' : 'aspect-square';

  const PreviewCard = (
    <div className={`w-full ${previewWidthClass}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-golden-muted">Apercu</p>
      <div className={`mt-4 w-full ${previewAspectClass}`}>
        <ToDoWidgetCard
          widget={previewWidget}
          canManageWidgets={false}
          canDrag={false}
          isDeleting={false}
          onDelete={() => {}}
          groupMembers={[]}
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
          {widgetSize === 'RECT' ? 'Rectangle' : 'Carre'}
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
              {isEditing ? 'Modifier la liste' : 'Liste de tâches'}
            </h2>
            <p className="mt-2 text-sm font-medium text-golden-muted">
              {isEditing
                ? 'Modifie le titre de la liste. Les tâches se gèrent directement sur le widget.'
                : 'Donne un titre à ta liste. Tu pourras ensuite ajouter des tâches et assigner des membres directement sur le widget.'}
            </p>
          </div>

          {modalError && (
            <div className="rounded-golden bg-red-100 px-4 py-3 text-sm font-bold text-red-700 shadow-halo">
              {modalError}
            </div>
          )}

          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold text-golden-text">Titre de la liste</span>
            <input
              type="text"
              value={draft.title}
              onChange={(event) => onChange('title', event.target.value)}
              placeholder="Ex: Préparatifs du voyage"
              className="w-full rounded-golden bg-golden-input px-5 py-3 text-sm font-medium text-golden-text shadow-creuse focus:outline-none focus:ring-2 focus:ring-golden-primary"
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-golden bg-golden-primary px-6 py-4 text-sm font-black text-gray-900 shadow-halo transition hover:brightness-105 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? (isEditing ? 'Mise a jour...' : 'Creation...')
              : (isEditing ? 'Enregistrer les modifications' : 'Ajouter au Dashboard')}
          </button>

          {/* Mobile preview */}
          <div className="border-t border-black/10 pt-6 lg:hidden">
            {PreviewCard}
          </div>
        </form>

        {/* Desktop preview */}
        <div className="hidden min-h-0 flex-col gap-5 px-2 pb-3 lg:flex lg:overflow-y-auto">
          {PreviewCard}
        </div>
      </div>
    </div>
  );
}
