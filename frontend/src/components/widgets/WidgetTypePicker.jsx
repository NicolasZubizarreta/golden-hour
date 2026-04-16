export default function WidgetTypePicker({
  widgetSearch,
  onWidgetSearchChange,
  widgetModalError,
  filteredWidgetOptions,
  widgetSize,
  onWidgetSizeChange,
  onSelectWidgetType,
}) {
  const visibleWidgetOptions = filteredWidgetOptions.filter((option) => {
    const isAllowedForSize = typeof option.isSizeAllowed === 'function'
      ? option.isSizeAllowed(widgetSize)
      : true;

    return isAllowedForSize || !option.hideWhenSizeInvalid;
  });

  return (
    <>
      <h2 className="font-outfit font-black text-3xl text-gray-900 mb-6 w-full text-left">Ajouter un widget</h2>

      <div className="w-full relative mb-6">
        <svg className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
        <input
          type="text"
          value={widgetSearch}
          onChange={(event) => onWidgetSearchChange(event.target.value)}
          placeholder="Rechercher un widget..."
          className="w-full bg-golden-input shadow-creuse rounded-golden py-3.5 pl-12 pr-5 text-sm font-medium focus:outline-none text-golden-text placeholder-gray-400 transition-all"
        />
      </div>

      {widgetModalError && (
        <div className="mb-6 rounded-golden bg-red-100 px-4 py-3 text-sm font-bold text-red-700 shadow-halo">
          {widgetModalError}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2 pr-4 mb-8">
        <div className={`grid gap-4 w-full transition-all duration-300 ${widgetSize === 'SQUARE' ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {visibleWidgetOptions.map((option) => {
            const isAllowedForSize = typeof option.isSizeAllowed === 'function'
              ? option.isSizeAllowed(widgetSize)
              : true;
            const isSelectable = option.enabled && isAllowedForSize;

            return (
              <button
                key={option.type}
                type="button"
                onClick={() => isSelectable && onSelectWidgetType(option.type)}
                disabled={!isSelectable}
                className={`${option.surfaceClassName} rounded-golden p-5 flex flex-col items-start text-left transition duration-200 shadow-halo ${widgetSize === 'SQUARE' ? 'aspect-square' : 'aspect-[2.08/1]'} ${isSelectable ? 'hover:-translate-y-1 hover:brightness-[1.02] cursor-pointer' : 'opacity-65 cursor-not-allowed'}`}
              >
                <div className={`w-10 h-10 rounded-golden flex items-center justify-center mb-auto shadow-halo ${option.iconClassName}`}>
                  {typeof option.renderCatalogIcon === 'function' ? option.renderCatalogIcon() : null}
                </div>

                <div className="mt-auto">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] opacity-75">{option.previewValue}</p>
                  <h3 className="mt-2 text-xl font-black leading-tight">{option.title}</h3>
                  <p className="mt-2 text-sm opacity-85 font-medium">
                    {isAllowedForSize
                      ? option.subtitle
                      : `Disponible uniquement en ${option.requiredSize === 'RECT' ? 'rectangle' : 'carré'}`}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {visibleWidgetOptions.length === 0 && (
        <div className="w-full rounded-golden bg-golden-input px-5 py-8 text-center text-sm font-bold text-golden-muted shadow-creuse">
          Aucun widget ne correspond à cette recherche.
        </div>
      )}

      <div className="bg-golden-input shadow-creuse rounded-golden flex items-center w-full max-w-[280px] self-center">
        <button
          type="button"
          onClick={() => onWidgetSizeChange('SQUARE')}
          className={`flex-1 py-2.5 rounded-golden text-sm font-bold transition-all duration-300 cursor-pointer ${
            widgetSize === 'SQUARE' ? 'bg-golden-primary text-gray-900 shadow-halo' : 'text-gray-500 hover:text-gray-900 bg-transparent'
          }`}
        >
          Carré
        </button>
        <button
          type="button"
          onClick={() => onWidgetSizeChange('RECT')}
          className={`flex-1 py-2.5 rounded-golden text-sm font-bold transition-all duration-300 cursor-pointer ${
            widgetSize === 'RECT' ? 'bg-golden-primary text-gray-900 shadow-halo' : 'text-gray-500 hover:text-gray-900 bg-transparent'
          }`}
        >
          Rectangle
        </button>
      </div>
    </>
  );
}
