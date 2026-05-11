import { useEffect, useState } from 'react';

function formatRunTime(value) {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return 'Recent run';
  }
}

function formatDelta(delta) {
  if (delta === 0) {
    return 'No change';
  }

  return delta > 0 ? `+${delta}` : `${delta}`;
}

function getSafetyText(isSafe) {
  return isSafe ? 'Safe' : 'Unsafe';
}

function buildNarrative(currentSummary, previousSummary) {
  const notes = [];

  if (currentSummary.isSafe !== previousSummary.isSafe) {
    notes.push(
      `Safety changed from ${getSafetyText(previousSummary.isSafe)} to ${getSafetyText(currentSummary.isSafe)}.`
    );
  } else {
    notes.push(`Both scenarios are ${getSafetyText(currentSummary.isSafe).toLowerCase()}.`);
  }

  const processDelta = currentSummary.processCount - previousSummary.processCount;
  if (processDelta !== 0) {
    notes.push(
      `The current run uses ${Math.abs(processDelta)} ${
        Math.abs(processDelta) === 1 ? 'process' : 'processes'
      } ${processDelta > 0 ? 'more' : 'fewer'}.`
    );
  }

  const resourceDelta = currentSummary.totalResourceInstances - previousSummary.totalResourceInstances;
  if (resourceDelta !== 0) {
    notes.push(
      `The total resource pool is ${Math.abs(resourceDelta)} instance${
        Math.abs(resourceDelta) === 1 ? '' : 's'
      } ${resourceDelta > 0 ? 'larger' : 'smaller'}.`
    );
  }

  const needDelta = currentSummary.totalRemainingNeed - previousSummary.totalRemainingNeed;
  if (needDelta !== 0) {
    notes.push(
      `Outstanding demand is ${Math.abs(needDelta)} ${
        Math.abs(needDelta) === 1 ? 'unit' : 'units'
      } ${needDelta > 0 ? 'higher' : 'lower'}.`
    );
  }

  if (currentSummary.isSafe && previousSummary.isSafe) {
    notes.push(
      `Safe sequence length stayed at ${currentSummary.safeSequence?.length || 0} completion steps.`
    );
  }

  if (!currentSummary.isSafe || !previousSummary.isSafe) {
    notes.push(
      `Blocked-process count moved from ${previousSummary.blockedCount} to ${currentSummary.blockedCount}.`
    );
  }

  return notes;
}

function buildResourceChanges(currentSummary, previousSummary) {
  const names = Array.from(
    new Set([...(currentSummary.resourceNames || []), ...(previousSummary.resourceNames || [])])
  );

  return names
    .map((name, index) => {
      const currentIndex = (currentSummary.resourceNames || []).indexOf(name);
      const previousIndex = (previousSummary.resourceNames || []).indexOf(name);
      const currentTotal =
        currentIndex >= 0 ? Number(currentSummary.resourceTotals?.[currentIndex] ?? 0) : 0;
      const previousTotal =
        previousIndex >= 0 ? Number(previousSummary.resourceTotals?.[previousIndex] ?? 0) : 0;
      const currentAvailable =
        currentIndex >= 0 ? Number(currentSummary.availableVector?.[currentIndex] ?? 0) : 0;
      const previousAvailable =
        previousIndex >= 0 ? Number(previousSummary.availableVector?.[previousIndex] ?? 0) : 0;

      return {
        id: `${name}-${index}`,
        name,
        currentTotal,
        previousTotal,
        currentAvailable,
        previousAvailable,
      };
    })
    .filter(
      (entry) =>
        entry.currentTotal !== entry.previousTotal ||
        entry.currentAvailable !== entry.previousAvailable
    );
}

function ComparisonMetric({ label, currentValue, previousValue }) {
  const current = Number(currentValue ?? 0);
  const previous = Number(previousValue ?? 0);
  const delta = current - previous;

  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-slate-950/55 p-4">
      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Current</div>
          <div className="mt-1 text-2xl font-semibold text-slate-50">{current}</div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Previous</div>
          <div className="mt-1 text-lg font-medium text-slate-300">{previous}</div>
          <div
            className={`mt-2 text-sm font-semibold ${
              delta > 0 ? 'text-emerald-200' : delta < 0 ? 'text-amber-200' : 'text-slate-400'
            }`}
          >
            {formatDelta(delta)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HistoryComparisonPanel({
  currentScenario,
  historyEntries,
  isLoading,
  isSaving,
  notice,
}) {
  const comparisonCandidates = currentScenario
    ? historyEntries.filter(
        (entry) =>
          !(
            entry.signature === currentScenario.signature &&
            entry.createdAtClient === currentScenario.createdAtClient
          )
      )
    : historyEntries;
  const [selectedHistoryId, setSelectedHistoryId] = useState(comparisonCandidates[0]?.id || '');

  useEffect(() => {
    if (
      selectedHistoryId &&
      comparisonCandidates.some((entry) => entry.id === selectedHistoryId)
    ) {
      return;
    }

    setSelectedHistoryId(comparisonCandidates[0]?.id || '');
  }, [comparisonCandidates, selectedHistoryId]);

  const selectedHistory =
    comparisonCandidates.find((entry) => entry.id === selectedHistoryId) ||
    comparisonCandidates[0] ||
    null;
  const currentSummary = currentScenario?.summary || null;
  const previousSummary = selectedHistory?.summary || null;
  const narrative =
    currentSummary && previousSummary ? buildNarrative(currentSummary, previousSummary) : [];
  const resourceChanges =
    currentSummary && previousSummary
      ? buildResourceChanges(currentSummary, previousSummary)
      : [];

  return (
    <section className="glass-panel rounded-[2rem] border border-white/10 p-6">
      <div className="flex flex-col gap-3 border-b border-white/10 pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/75">User History</p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-50">Saved Scenario Comparison</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Every safety check is saved per user. Compare the current input set with an earlier run
            to see how the resource mix changed the outcome.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.24em] text-slate-400">
          <span className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1">
            {historyEntries.length} saved runs
          </span>
          <span className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1">
            {isSaving ? 'Saving current check...' : 'History ready'}
          </span>
        </div>
      </div>

      {notice ? (
        <div className="mt-5 rounded-[1.4rem] border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {notice}
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.25fr]">
        <div className="space-y-3">
          {isLoading ? (
            <div className="rounded-[1.6rem] border border-dashed border-white/10 bg-slate-950/45 p-5 text-sm text-slate-400">
              Loading this user&apos;s saved scenarios...
            </div>
          ) : comparisonCandidates.length === 0 ? (
            <div className="rounded-[1.6rem] border border-dashed border-white/10 bg-slate-950/45 p-5 text-sm text-slate-400">
              Run at least two safety checks to unlock comparative analysis for this user.
            </div>
          ) : (
            comparisonCandidates.map((entry) => {
              const active = entry.id === selectedHistory?.id;
              const summary = entry.summary || {};

              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setSelectedHistoryId(entry.id)}
                  className={`w-full rounded-[1.6rem] border p-4 text-left transition ${
                    active
                      ? 'border-blue-400/55 bg-blue-500/12 shadow-[0_0_22px_rgba(59,130,246,0.18)]'
                      : 'border-white/10 bg-slate-950/55 hover:border-blue-400/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                        {formatRunTime(entry.createdAtClient)}
                      </div>
                      <div className="mt-2 text-lg font-semibold text-slate-50">
                        {summary.label || 'Scenario'}
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        summary.isSafe
                          ? 'border border-emerald-400/20 bg-emerald-500/12 text-emerald-200'
                          : 'border border-rose-400/20 bg-rose-500/12 text-rose-200'
                      }`}
                    >
                      {getSafetyText(summary.isSafe)}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
                    <span className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1">
                      {summary.processCount} processes
                    </span>
                    <span className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1">
                      {summary.resourceCount} resources
                    </span>
                    <span className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1">
                      {summary.totalResourceInstances} total instances
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="space-y-5">
          {!currentScenario ? (
            <div className="rounded-[1.6rem] border border-dashed border-white/10 bg-slate-950/45 p-6 text-sm leading-6 text-slate-400">
              Run the safety check on the current inputs first. After that, the simulator will save
              the snapshot and compare it with older scenarios for the same user.
            </div>
          ) : !selectedHistory ? (
            <div className="rounded-[1.6rem] border border-dashed border-white/10 bg-slate-950/45 p-6 text-sm leading-6 text-slate-400">
              One scenario is saved for this user already. Run one more safety check to unlock a
              side-by-side comparison.
            </div>
          ) : (
            <>
              <div className="rounded-[1.6rem] border border-white/10 bg-slate-950/55 p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${
                      currentSummary?.isSafe
                        ? 'border border-emerald-400/20 bg-emerald-500/12 text-emerald-100'
                        : 'border border-rose-400/20 bg-rose-500/12 text-rose-100'
                    }`}
                  >
                    Current: {getSafetyText(currentSummary?.isSafe)}
                  </span>
                  <span className="rounded-full border border-white/10 bg-slate-900/70 px-4 py-2 text-sm text-slate-300">
                    Compared with {formatRunTime(selectedHistory.createdAtClient)}
                  </span>
                </div>

                <div className="mt-5 space-y-3 text-sm leading-6 text-slate-300">
                  {narrative.map((note) => (
                    <p key={note}>{note}</p>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <ComparisonMetric
                  label="Processes"
                  currentValue={currentSummary?.processCount}
                  previousValue={previousSummary?.processCount}
                />
                <ComparisonMetric
                  label="Resources"
                  currentValue={currentSummary?.resourceCount}
                  previousValue={previousSummary?.resourceCount}
                />
                <ComparisonMetric
                  label="Total Instances"
                  currentValue={currentSummary?.totalResourceInstances}
                  previousValue={previousSummary?.totalResourceInstances}
                />
                <ComparisonMetric
                  label="Allocated Units"
                  currentValue={currentSummary?.totalAllocatedInstances}
                  previousValue={previousSummary?.totalAllocatedInstances}
                />
                <ComparisonMetric
                  label="Remaining Need"
                  currentValue={currentSummary?.totalRemainingNeed}
                  previousValue={previousSummary?.totalRemainingNeed}
                />
                <ComparisonMetric
                  label="Blocked Processes"
                  currentValue={currentSummary?.blockedCount}
                  previousValue={previousSummary?.blockedCount}
                />
              </div>

              <div className="rounded-[1.6rem] border border-white/10 bg-slate-950/55 p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-slate-100">Resource-by-Resource Shift</h4>
                    <p className="mt-1 text-sm text-slate-400">
                      Totals and available units that changed between the two input sets.
                    </p>
                  </div>
                  {currentSummary?.safeSequence ? (
                    <div className="flex flex-wrap gap-2">
                      {currentSummary.safeSequence.map((processId) => (
                        <span
                          key={processId}
                          className="rounded-full border border-emerald-400/20 bg-emerald-500/12 px-3 py-1 text-xs text-emerald-100"
                        >
                          {processId}
                        </span>
                      ))}
                    </div>
                  ) : currentSummary?.blockedProcesses?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {currentSummary.blockedProcesses.map((processId) => (
                        <span
                          key={processId}
                          className="rounded-full border border-rose-400/20 bg-rose-500/12 px-3 py-1 text-xs text-rose-100"
                        >
                          {processId}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="mt-5 space-y-3">
                  {resourceChanges.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/45 p-4 text-sm text-slate-400">
                      Resource totals and free units match the selected historical run.
                    </div>
                  ) : (
                    resourceChanges.map((resource) => (
                      <div
                        key={resource.id}
                        className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3"
                      >
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div className="font-semibold text-slate-100">{resource.name}</div>
                          <div className="flex flex-wrap gap-2 text-xs text-slate-300">
                            <span className="rounded-full border border-white/10 px-3 py-1">
                              Total: {resource.previousTotal} {'->'} {resource.currentTotal}
                            </span>
                            <span className="rounded-full border border-white/10 px-3 py-1">
                              Available: {resource.previousAvailable} {'->'} {resource.currentAvailable}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
