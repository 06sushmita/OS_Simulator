function getKindLabel(kind) {
  if (kind === 'execute') {
    return 'Runs';
  }

  if (kind === 'blocked') {
    return 'Blocked';
  }

  if (kind === 'skip') {
    return 'Skip';
  }

  return 'Stop';
}

export default function StepTimeline({ evaluations, activeStep, onSelect }) {
  return (
    <div className="timeline">
      {evaluations.map((entry, index) => (
        <button
          key={`timeline-${entry.kind}-${entry.process ?? 'system'}-${index}`}
          type="button"
          className={[
            'timeline-item',
            `timeline-item--${entry.kind}`,
            index === activeStep ? 'timeline-item--active' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={() => onSelect(index)}
        >
          <span className="timeline-item__marker" />
          <div className="timeline-item__content">
            <div className="timeline-item__head">
              <p className="timeline-item__title">{entry.title}</p>
              <span className="timeline-item__step">
                Check {index + 1} · {getKindLabel(entry.kind)}
              </span>
            </div>
            <p className="timeline-item__meta">
              Pass {entry.pass}
              {entry.process !== null ? ` · P${entry.process}` : ' · System'}
            </p>
            <p className="timeline-item__meta">{entry.summary}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
