import StepTimeline from './StepTimeline';

function Badge({ safe }) {
  return (
    <span className={`status-badge ${safe ? 'status-badge--safe' : 'status-badge--unsafe'}`}>
      {safe ? 'Safe State' : 'Unsafe State'}
    </span>
  );
}

function RequestBanner({ requestResult }) {
  if (!requestResult) {
    return null;
  }

  return (
    <div
      className={`request-banner ${
        requestResult.granted ? 'request-banner--success' : 'request-banner--error'
      }`}
    >
      <p className="request-banner__label">Request Check</p>
      <p className="request-banner__message">{requestResult.message}</p>
    </div>
  );
}

function SafeSequenceFlow({ result }) {
  if (!result) {
    return null;
  }

  if (result.safeSequence.length === 0) {
    return <p className="empty-note">No executable process was found from the current Work vector.</p>;
  }

  return (
    <div className="sequence-flow">
      {result.safeSequence.map((processIndex, index) => (
        <div key={`seq-${processIndex}-${index}`} className="sequence-flow__item">
          <span className="sequence-flow__step">P{processIndex}</span>
          {index < result.safeSequence.length - 1 ? (
            <span className="sequence-flow__arrow" aria-hidden="true">
              →
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export default function ResultsPanel({
  result,
  requestResult,
  processCount,
  activeStep,
  onStepChange,
  updatedAvailable,
  available,
}) {
  const hasResult = Boolean(result);
  const hasSteps = Boolean(result?.steps?.length);
  const currentStep = hasSteps && activeStep >= 0 ? result.steps[activeStep] : null;
  const progressValue = result ? Math.round((result.safeSequence.length / processCount) * 100) : 0;
  const availableHighlights = new Set(updatedAvailable);

  return (
    <div className={`results-card ${hasResult ? 'results-card--visible' : ''}`}>
      <div className="section-heading">
        <div>
          <p className="section-kicker">Simulation Output</p>
          <h2>Results &amp; Safe Sequence</h2>
        </div>
        {result ? <Badge safe={result.isSafe} /> : null}
      </div>

      <p className="table-description">
        Review the current safety verdict, walk through each execution step, and inspect the
        resulting Work and Finish vectors.
      </p>

      <RequestBanner requestResult={requestResult} />

      {result ? (
        <>
          <div className="results-summary">
            <div className="summary-card">
              <p className="summary-card__label">Safe Sequence</p>
              <SafeSequenceFlow result={result} />
            </div>

            <div className="summary-card">
              <p className="summary-card__label">Execution Progress</p>
              <div className="progress-track">
                <div className="progress-track__fill" style={{ width: `${progressValue}%` }} />
              </div>
              <p className="summary-card__value">
                {result.safeSequence.length} of {processCount} processes can complete ({progressValue}%)
              </p>
            </div>
          </div>

          <div className="available-strip">
            <p className="summary-card__label">Current Available Vector</p>
            <div className="available-strip__values">
              {available.map((value, resourceIndex) => (
                <span
                  key={`available-chip-${resourceIndex}`}
                  className={`vector-chip ${
                    availableHighlights.has(resourceIndex) ? 'vector-chip--updated' : ''
                  }`}
                >
                  R{resourceIndex}: {value}
                </span>
              ))}
            </div>
          </div>

          <div className="step-toolbar">
            <div>
              <p className="summary-card__label">Step-by-Step Mode</p>
              <p className="toolbar-copy">
                {currentStep
                  ? `Focused on P${currentStep.process}. Click any timeline entry to inspect it.`
                  : result.isSafe
                    ? 'Run the algorithm to generate executable steps.'
                    : 'No executable step is currently available.'}
              </p>
            </div>

            <div className="action-row action-row--compact">
              <button
                type="button"
                className="button button--secondary"
                disabled={!hasSteps || activeStep <= 0}
                onClick={() => onStepChange(activeStep - 1)}
              >
                Previous
              </button>
              <button
                type="button"
                className="button button--secondary"
                disabled={!hasSteps || activeStep >= result.steps.length - 1}
                onClick={() => onStepChange(activeStep + 1)}
              >
                Next Step
              </button>
            </div>
          </div>

          <StepTimeline
            steps={result.steps}
            blockedProcesses={result.blockedProcesses}
            activeStep={activeStep}
            onSelect={onStepChange}
          />
        </>
      ) : (
        <div className="empty-state">
          <p className="empty-state__title">No results yet</p>
          <p className="empty-state__copy">
            Configure the system, then run the algorithm to generate the safe-state analysis.
          </p>
        </div>
      )}
    </div>
  );
}
