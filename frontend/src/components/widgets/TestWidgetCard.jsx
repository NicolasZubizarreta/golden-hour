import WidgetCardShell from './WidgetCardShell';

const getWidgetText = (widget) => {
  const fallbackTitle = widget.size === 'RECT' ? 'Widget Large' : 'Widget Test';
  const fallbackSubtitle = widget.size === 'RECT' ? 'Deux colonnes' : 'Une colonne';

  if (!widget.data || typeof widget.data !== 'object' || Array.isArray(widget.data)) {
    return {
      title: fallbackTitle,
      subtitle: fallbackSubtitle,
      background: widget.size === 'RECT' ? '#1D4ED8' : '#F59E0B',
      text: widget.size === 'RECT' ? '#EFF6FF' : '#111827',
      badge: widget.size === 'RECT' ? 'RECT' : 'SQUARE',
    };
  }

  return {
    title: typeof widget.data.title === 'string' ? widget.data.title : fallbackTitle,
    subtitle: typeof widget.data.subtitle === 'string' ? widget.data.subtitle : fallbackSubtitle,
    background: typeof widget.data.background === 'string' ? widget.data.background : (widget.size === 'RECT' ? '#1D4ED8' : '#F59E0B'),
    text: typeof widget.data.text === 'string' ? widget.data.text : (widget.size === 'RECT' ? '#EFF6FF' : '#111827'),
    badge: typeof widget.data.badge === 'string' ? widget.data.badge : (widget.size === 'RECT' ? 'RECT' : 'SQUARE'),
  };
};

export default function TestWidgetCard(props) {
  const { widget } = props;
  const content = getWidgetText(widget);

  return (
    <WidgetCardShell
      {...props}
      typeLabel={widget.type}
      style={{
        background: content.background,
        color: content.text,
      }}
      overlay={<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.28),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.2),transparent_35%)] pointer-events-none" />}
    >
      <div className="mt-auto">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] opacity-75">{content.badge}</p>
        <h3 className="mt-2 text-2xl font-black leading-tight tracking-wide">{content.title}</h3>
        <p className="mt-2 max-w-[16rem] text-sm opacity-85 font-medium">{content.subtitle}</p>
      </div>
    </WidgetCardShell>
  );
}
