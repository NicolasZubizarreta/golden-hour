import { useEffect, useMemo, useState } from 'react';
import WidgetCardShell from './WidgetCardShell';
import {
  COUNTDOWN_APPEARANCE_TYPES,
  formatCountdownDate,
  getCompactCountdown,
  getCountdownProgressData,
  getRecurrenceDescription,
} from '../../utils/countdown';

const getContrastTextColor = (hexColor) => {
  if (typeof hexColor !== 'string' || !/^#([0-9a-fA-F]{6})$/.test(hexColor)) {
    return '#FFF7ED';
  }

  const red = parseInt(hexColor.slice(1, 3), 16);
  const green = parseInt(hexColor.slice(3, 5), 16);
  const blue = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * red) + (0.587 * green) + (0.114 * blue);

  return luminance > 165 ? '#1F2937' : '#FFF7ED';
};

const clamp = (value) => Math.min(1, Math.max(0, value));

function ProgressRing({
  progress,
  value,
  label = '',
  trackColor,
  progressColor,
  valueColor,
  labelColor,
  strokeWidth = 8,
  valueClassName = '',
  labelClassName = '',
}) {
  const radius = 50 - (strokeWidth / 2);
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - clamp(progress));

  return (
    <div className="flex w-full flex-col items-center">
      <div className="relative aspect-square w-full">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={progressColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center text-center">
          <span className={`font-black leading-none tracking-tight ${valueClassName}`} style={{ color: valueColor }}>
            {value}
          </span>
        </div>
      </div>

      {label ? (
        <span
          className={`mt-[7%] text-center font-semibold uppercase tracking-[0.18em] ${labelClassName}`}
          style={{ color: labelColor }}
        >
          {label}
        </span>
      ) : null}
    </div>
  );
}

export default function CountdownWidgetCard(props) {
  const { widget } = props;
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const countdown = useMemo(() => getCountdownProgressData(widget.data, now), [widget.data, now]);

  if (!countdown) {
    return (
      <WidgetCardShell
        {...props}
        showTypeLabel={false}
        style={{
          background: 'linear-gradient(135deg, #6B7280 0%, #374151 100%)',
          color: '#F9FAFB',
        }}
        controlsTone="light"
        className="p-[clamp(0.9rem,4.5vw,1.45rem)]"
        overlay={<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_42%)] pointer-events-none" />}
      >
        <div className="mt-2 flex h-full flex-col">
          <h3 className="pr-16 font-outfit text-[clamp(1rem,5.2vw,1.6rem)] font-black leading-[1.05] truncate whitespace-nowrap">
            Compte a rebours
          </h3>
          <p className="mt-auto text-sm font-medium opacity-90">
            Configuration invalide.
          </p>
        </div>
      </WidgetCardShell>
    );
  }

  const { snapshot, units, progress } = countdown;
  const compact = getCompactCountdown(units, snapshot.isComplete);
  const recurrenceLabel = snapshot.isRecurring
    ? getRecurrenceDescription(snapshot.recurrence)
    : formatCountdownDate(snapshot.targetDate);

  const isImageBackground = snapshot.appearance?.backgroundType === COUNTDOWN_APPEARANCE_TYPES.IMAGE
    && typeof snapshot.appearance?.backgroundImage === 'string'
    && snapshot.appearance.backgroundImage.trim() !== '';
  const textColor = isImageBackground
    ? '#FFF7ED'
    : getContrastTextColor(snapshot.appearance?.backgroundColor || '#EA580C');
  const controlsTone = textColor === '#1F2937' ? 'dark' : 'light';
  const trackColor = textColor === '#1F2937' ? 'rgba(31,41,55,0.15)' : 'rgba(255,247,237,0.18)';
  const progressColor = textColor === '#1F2937' ? 'rgba(31,41,55,0.96)' : 'rgba(255,247,237,0.98)';
  const labelColor = textColor === '#1F2937' ? 'rgba(31,41,55,0.72)' : 'rgba(255,247,237,0.82)';

  const widgetStyle = isImageBackground
    ? {
        backgroundImage: `url(${snapshot.appearance.backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: textColor,
      }
    : {
        background: snapshot.appearance?.backgroundColor || '#EA580C',
        color: textColor,
      };

  const overlayClassName = isImageBackground
    ? 'absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.06),rgba(15,23,42,0.42))] pointer-events-none'
    : 'absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.1),transparent_28%)] pointer-events-none';

  return (
    <WidgetCardShell
      {...props}
      showTypeLabel={false}
      style={widgetStyle}
      controlsTone={controlsTone}
      className="p-[clamp(0.9rem,4.5vw,1.45rem)]"
      overlay={<div className={overlayClassName} />}
    >
      {widget.size === 'RECT' ? (
        <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-[clamp(0.3rem,2.2%,0.85rem)] pt-[1%]">
          <div className="min-w-0 pr-[28%]">
            <h3 className="truncate whitespace-nowrap font-outfit text-[clamp(0.88rem,2.45vw,1.45rem)] font-black leading-[1.02]">
              {snapshot.title}
            </h3>
          </div>

          <div className="flex min-h-0 items-center py-[1%]">
            <div className="mx-auto grid w-[96%] min-h-0 grid-cols-4 items-start gap-[clamp(0.35rem,4%,1rem)]">
              <ProgressRing
                progress={progress.days}
                value={units.days}
                label="Jours"
                trackColor={trackColor}
                progressColor={progressColor}
                valueColor={textColor}
                labelColor={labelColor}
                strokeWidth={7}
                valueClassName="text-[clamp(0.82rem,2.9vw,1.7rem)]"
                labelClassName="text-[clamp(0.42rem,0.82vw,0.64rem)]"
              />
              <ProgressRing
                progress={progress.hours}
                value={String(units.hours).padStart(2, '0')}
                label="Heures"
                trackColor={trackColor}
                progressColor={progressColor}
                valueColor={textColor}
                labelColor={labelColor}
                strokeWidth={7}
                valueClassName="text-[clamp(0.82rem,2.9vw,1.7rem)]"
                labelClassName="text-[clamp(0.42rem,0.82vw,0.64rem)]"
              />
              <ProgressRing
                progress={progress.minutes}
                value={String(units.minutes).padStart(2, '0')}
                label="Minutes"
                trackColor={trackColor}
                progressColor={progressColor}
                valueColor={textColor}
                labelColor={labelColor}
                strokeWidth={7}
                valueClassName="text-[clamp(0.82rem,2.9vw,1.7rem)]"
                labelClassName="text-[clamp(0.42rem,0.82vw,0.64rem)]"
              />
              <ProgressRing
                progress={progress.seconds}
                value={String(units.seconds).padStart(2, '0')}
                label="Secondes"
                trackColor={trackColor}
                progressColor={progressColor}
                valueColor={textColor}
                labelColor={labelColor}
                strokeWidth={7}
                valueClassName="text-[clamp(0.82rem,2.9vw,1.7rem)]"
                labelClassName="text-[clamp(0.42rem,0.82vw,0.64rem)]"
              />
            </div>
          </div>

          <p className="max-w-[78%] truncate text-[clamp(0.4rem,0.82vw,0.66rem)] leading-[1.1] font-semibold opacity-80">
            {recurrenceLabel}
          </p>
        </div>
      ) : (
        <div className="flex h-full min-h-0 flex-col">
          <div className="min-w-0 pr-[34%] pb-[1%]">
            <h3 className="truncate whitespace-nowrap font-outfit text-[clamp(0.78rem,3.8vw,1.08rem)] font-black leading-none md:text-[clamp(0.82rem,2.8vw,1.16rem)]">
              {snapshot.title}
            </h3>
          </div>

          <div className="flex flex-1 min-h-0 flex-col items-center justify-center gap-[4%] py-[1%]">
            <div className="w-[50%] max-w-[9.2rem] min-w-0">
              <ProgressRing
                progress={progress.days}
                value={compact.value}
                trackColor={trackColor}
                progressColor={progressColor}
                valueColor={textColor}
                labelColor={labelColor}
                strokeWidth={8}
                valueClassName="text-[clamp(1rem,6vw,2.15rem)]"
              />
            </div>

            <div className="flex w-full justify-center gap-[3%] px-[2%]">
              <div className="w-[19%] max-w-[3.6rem] min-w-0">
                <ProgressRing
                  progress={progress.hours}
                  value={String(units.hours).padStart(2, '0')}
                  label="H"
                  trackColor={trackColor}
                  progressColor={progressColor}
                  valueColor={textColor}
                  labelColor={labelColor}
                  strokeWidth={7}
                  valueClassName="text-[clamp(0.62rem,2.9vw,0.92rem)]"
                  labelClassName="text-[clamp(0.38rem,1.4vw,0.52rem)]"
                />
              </div>
              <div className="w-[19%] max-w-[3.6rem] min-w-0">
                <ProgressRing
                  progress={progress.minutes}
                  value={String(units.minutes).padStart(2, '0')}
                  label="M"
                  trackColor={trackColor}
                  progressColor={progressColor}
                  valueColor={textColor}
                  labelColor={labelColor}
                  strokeWidth={7}
                  valueClassName="text-[clamp(0.62rem,2.9vw,0.92rem)]"
                  labelClassName="text-[clamp(0.38rem,1.4vw,0.52rem)]"
                />
              </div>
              <div className="w-[19%] max-w-[3.6rem] min-w-0">
                <ProgressRing
                  progress={progress.seconds}
                  value={String(units.seconds).padStart(2, '0')}
                  label="S"
                  trackColor={trackColor}
                  progressColor={progressColor}
                  valueColor={textColor}
                  labelColor={labelColor}
                  strokeWidth={7}
                  valueClassName="text-[clamp(0.62rem,2.9vw,0.92rem)]"
                  labelClassName="text-[clamp(0.38rem,1.4vw,0.52rem)]"
                />
              </div>
            </div>
          </div>

          <p className="hidden min-[1280px]:block max-w-[78%] truncate text-[clamp(0.5rem,1.2vw,0.68rem)] font-semibold opacity-80">
            {recurrenceLabel}
          </p>
        </div>
      )}
    </WidgetCardShell>
  );
}
