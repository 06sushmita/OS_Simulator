export default function StepTimeline({ steps, blockedProcesses, activeStep, onSelect }) {
  return (
    <div className="timeline">
      {steps.map((step, index) => (
        <button
          key={`timeline-${step.process}-${index}`}
          type="button"
          className={`timeline-item ${index === activeStep ? 'timeline-item--active' : ''}`}
          onClick={() => onSelect(index)}
        >
          <span className="timeline-item__marker" />
          <div className="timeline-item__content">
            <div className="timeline-item__head">
              <p className="timeline-item__title">P{step.process} can complete</p>
              <span className="timeline-item__step">Step {index + 1}</span>
            </div>
            <p className="timeline-item__meta">
              Need [{step.need.join(', ')}] | Work [{step.workBefore.join(', ')}] → [
              {step.workAfter.join(', ')}]
            </p>
            <p className="timeline-item__meta">
              Release [{step.release.join(', ')}] | Finish {step.finishSummary}
            </p>
          </div>
        </button>
      ))}

      {blockedProcesses.length > 0 ? (
        <div className="timeline-item timeline-item--blocked">
          <span className="timeline-item__marker" />
          <div className="timeline-item__content">
            <div className="timeline-item__head">
              <p className="timeline-item__title">Unsafe termination point</p>
              <span className="timeline-item__step">Blocked</span>
            </div>
            <p className="timeline-item__meta">
              No further process can satisfy Need ≤ Work. Remaining processes:{' '}
              {blockedProcesses.map(processIndex => `P${processIndex}`).join(', ')}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
