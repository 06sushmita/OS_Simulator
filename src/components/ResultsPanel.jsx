import StepTimeline from './StepTimeline';

function Badge({ safe }) {
  return (
    <span className={`status-badge ${safe ? 'status-badge--safe' : 'status-badge--unsafe'}`}>
      {safe ? 'Safe state' : 'Unsafe state'}
    </span>
  );
}

function RequestChecklist({ requestResult }) {
  if (!requestResult?.decisionTrail?.length) {
    return null;
  }

  return (
    <div className="summary-card">
      <p className="summary-card__label">Request decision trace</p>
      <div className="decision-list">
        {requestResult.decisionTrail.map(item => (
          <div
            key={`${item.label}-${item.detail}`}
            className={`decision-item ${
              item.passed ? 'decision-item--success' : 'decision-item--error'
            }`}
          >
            <p className="decision-item__title">{item.label}</p>
            <p className="decision-item__detail">{item.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SafeSequenceFlow({ result }) {
  if (!result) {
    return null;
  }

  if (result.safeSequence.length === 0) {
    return <p className="empty-note">No process can complete from the current Work vector.</p>;
  }

  return (
    <div className="sequence-flow">
      {result.safeSequence.map((processIndex, index) => (
        <div key={`seq-${processIndex}-${index}`} className="sequence-flow__item">
          <span className="sequence-flow__step">P{processIndex}</span>
          {index < result.safeSequence.length - 1 ? (
            <span className="sequence-flow__arrow" aria-hidden="true">
              &rarr;
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function ResourceCheckGrid({ evaluation }) {
  if (!evaluation?.resourceChecks?.length) {
    return (
      <p className="empty-note">This checkpoint does not compare resource needs against Work.</p>
    );
  }

  return (
    <div className="resource-check-grid">
      {evaluation.resourceChecks.map(check => (
        <div
          key={`resource-check-${check.resourceIndex}`}
          className={`resource-check ${
            check.satisfied ? 'resource-check--success' : 'resource-check--warning'
          }`}
        >
          <p className="resource-check__title">R{check.resourceIndex}</p>
          <p className="resource-check__copy">
            Need {check.need} vs Work {check.work}
          </p>
          <p className="resource-check__copy">
            {check.satisfied ? 'Requirement satisfied.' : `Short by ${check.shortfall}.`}
          </p>
        </div>
      ))}
    </div>
  );
}

function StepInspector({ evaluation, index, totalChecks }) {
  if (!evaluation) {
    return null;
  }

  const processLabel = evaluation.process !== null ? `P${evaluation.process}` : 'System';

  return (
    <div className="summary-card summary-card--inspector">
      <div className="section-heading section-heading--tight">
        <div>
          <p className="section-kicker">Focused Explanation</p>
          <h2>
            Check {index + 1} of {totalChecks}
          </h2>
        </div>
        <span className={`mini-pill mini-pill--${evaluation.kind}`}>{processLabel}</span>
      </div>

      <p className="inspector-title">{evaluation.title}</p>
      <p className="summary-card__value">{evaluation.explanation}</p>

      <div className="inspector-grid">
        <div className="inspector-metric">
          <span className="inspector-metric__label">Need</span>
          <span className="inspector-metric__value">[{evaluation.need.join(', ')}]</span>
        </div>
        <div className="inspector-metric">
          <span className="inspector-metric__label">Work before</span>
          <span className="inspector-metric__value">[{evaluation.workBefore.join(', ')}]</span>
        </div>
        <div className="inspector-metric">
          <span className="inspector-metric__label">Release</span>
          <span className="inspector-metric__value">[{evaluation.release.join(', ')}]</span>
        </div>
        <div className="inspector-metric">
          <span className="inspector-metric__label">Work after</span>
          <span className="inspector-metric__value">[{evaluation.workAfter.join(', ')}]</span>
        </div>
      </div>

      <div className="finish-strip">
        <span className="finish-strip__label">Finish flags</span>
        <span className="finish-strip__value">{evaluation.finishSummary}</span>
      </div>

      <ResourceCheckGrid evaluation={evaluation} />
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
  const evaluations = result?.evaluations ?? [];
  const hasEvaluations = evaluations.length > 0;
  const currentEvaluation =
    hasEvaluations && activeStep >= 0 ? evaluations[activeStep] ?? null : null;
  const progressValue = result ? Math.round((result.safeSequence.length / processCount) * 100) : 0;
  const availableHighlights = new Set(updatedAvailable);

  return (
    <div className={`results-card ${hasResult ? 'results-card--visible' : ''}`}>
      <div className="section-heading">
        <div>
          <p className="section-kicker">Simulation Output</p>
          <h2>Guided Walkthrough</h2>
        </div>
        {result ? <Badge safe={result.isSafe} /> : null}
      </div>

      <p className="table-description">
        Follow the exact order used by Banker&apos;s Algorithm: each check, each blocked process,
        each successful completion, and the final verdict.
      </p>

      {requestResult ? (
        <div
          className={`request-banner ${
            requestResult.granted ? 'request-banner--success' : 'request-banner--error'
          }`}
        >
          <p className="request-banner__label">Latest request verdict</p>
          <p className="request-banner__message">{requestResult.message}</p>
        </div>
      ) : null}

      {result ? (
        <>
          <div className="results-summary">
            <div className="summary-card">
              <p className="summary-card__label">Safe sequence</p>
              <SafeSequenceFlow result={result} />
            </div>

            <div className="summary-card">
              <p className="summary-card__label">Execution progress</p>
              <div className="progress-track">
                <div className="progress-track__fill" style={{ width: `${progressValue}%` }} />
              </div>
              <p className="summary-card__value">
                {result.safeSequence.length} of {processCount} processes can complete.
              </p>
            </div>

            <div className="summary-card">
              <p className="summary-card__label">Simulation coverage</p>
              <p className="summary-card__value">
                {evaluations.length} narrated checkpoints across {result.passes} pass
                {result.passes === 1 ? '' : 'es'}.
              </p>
            </div>
          </div>

          <div className="available-strip">
            <p className="summary-card__label">Current available vector</p>
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

          <RequestChecklist requestResult={requestResult} />

          <div className="step-toolbar">
            <div>
              <p className="summary-card__label">Step-by-step navigator</p>
              <p className="toolbar-copy">
                {currentEvaluation
                  ? `Reading check ${activeStep + 1}: ${currentEvaluation.title}`
                  : 'Select a checkpoint to inspect the algorithm in plain language.'}
              </p>
            </div>

            <div className="action-row action-row--compact">
              <button
                type="button"
                className="button button--secondary"
                disabled={!hasEvaluations || activeStep <= 0}
                onClick={() => onStepChange(activeStep - 1)}
              >
                Previous
              </button>
              <button
                type="button"
                className="button button--secondary"
                disabled={!hasEvaluations || activeStep >= evaluations.length - 1}
                onClick={() => onStepChange(activeStep + 1)}
              >
                Next check
              </button>
            </div>
          </div>

          <StepInspector
            evaluation={currentEvaluation}
            index={activeStep}
            totalChecks={evaluations.length}
          />

          <StepTimeline
            evaluations={evaluations}
            activeStep={activeStep}
            onSelect={onStepChange}
          />
        </>
      ) : (
        <div className="empty-state">
          <p className="empty-state__title">No simulation yet</p>
          <p className="empty-state__copy">
            Prepare the inputs, then run the simulator to generate a narrated Banker&apos;s
            Algorithm walkthrough.
          </p>
        </div>
      )}
    </div>
  );
}
