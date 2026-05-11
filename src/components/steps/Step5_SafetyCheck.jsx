import { motion } from 'framer-motion';
import RAGCanvas from '../RAGCanvas';
import StepActionBar from '../StepActionBar';
import StepHeader from '../StepHeader';

function CoffmanConditionCard({ condition }) {
  return (
    <div
      className={`rounded-3xl border p-4 ${
        condition.active
          ? 'border-rose-400/25 bg-rose-500/10'
          : 'border-emerald-400/25 bg-emerald-500/10'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-base font-semibold text-slate-100">{condition.label}</h4>
        <span
          className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] ${
            condition.active ? 'bg-rose-500/15 text-rose-100' : 'bg-emerald-500/15 text-emerald-100'
          }`}
        >
          {condition.active ? 'Present' : 'Clear'}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-300">{condition.detail}</p>
    </div>
  );
}

function BlockedProcessCard({ detail }) {
  const heldText =
    detail.heldResources.length > 0
      ? detail.heldResources.map((resource) => `${resource.resourceId} x${resource.amount}`).join(', ')
      : 'No currently held resources';
  const shortageText =
    detail.shortageResources.length > 0
      ? detail.shortageResources
          .map(
            (resource) =>
              `${resource.resourceId}: need ${resource.need}, work ${resource.work}, short by ${resource.shortBy}`
          )
          .join(' | ')
      : 'No shortages';

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-5">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-lg font-semibold text-slate-100">{detail.processId}</h4>
        <span className="rounded-full border border-rose-400/20 bg-rose-500/12 px-3 py-1 text-xs text-rose-100">
          Blocked
        </span>
      </div>
      <p className="mt-4 text-sm text-slate-400">Holding</p>
      <p className="mt-1 text-sm leading-6 text-slate-200">{heldText}</p>
      <p className="mt-4 text-sm text-slate-400">Waiting For</p>
      <p className="mt-1 text-sm leading-6 text-slate-200">{shortageText}</p>
    </div>
  );
}

export default function Step5_SafetyCheck({
  processes,
  resources,
  allocationMatrix,
  needMatrix,
  availableVector,
  isSafe,
  safeSequence,
  simulationSteps,
  analysisNarration,
  runSafetyCheck,
  startSimulation,
  setCurrentStep,
  previousStep,
  isSavingHistory,
}) {
  const blocked = [
    ...new Set(simulationSteps.filter((step) => !step.canProceed).map((step) => step.process)),
  ];

  return (
    <div className="space-y-10">
      <StepHeader
        step="5"
        title="Safety Status Check"
        description="Evaluate the current matrices with Banker's Algorithm, inspect the blocked graph path, and read the system's explanation in plain language."
      >
        <div className="flex flex-col items-start gap-3 xl:items-end">
          <button
            type="button"
            onClick={runSafetyCheck}
            disabled={isSavingHistory}
            className="nav-button nav-button--primary"
          >
            {isSavingHistory ? 'Saving And Checking...' : 'Check Safe Status'}
          </button>
        </div>
      </StepHeader>

      <RAGCanvas
        processes={processes}
        resources={resources}
        allocationMatrix={allocationMatrix}
        needMatrix={needMatrix}
        availableVector={availableVector}
        currentProcess={blocked[0] || null}
        isSafe={isSafe}
        blockedProcessIds={blocked}
      />

      {isSafe !== null && (
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`glass-panel ui-card text-center ${
            isSafe
              ? 'border-emerald-400/35 bg-emerald-500/10 shadow-[0_0_26px_rgba(34,197,94,0.18)]'
              : 'border-rose-400/35 bg-rose-500/10 shadow-[0_0_26px_rgba(239,68,68,0.18)]'
          }`}
        >
          <div
            className={`mx-auto inline-flex rounded-full px-5 py-2 text-sm font-semibold tracking-[0.24em] ${
              isSafe ? 'bg-emerald-500/15 text-emerald-200' : 'bg-rose-500/15 text-rose-200'
            }`}
          >
            {isSafe ? 'SAFE STATE' : 'UNSAFE STATE'}
          </div>

          {!isSafe && blocked.length > 0 ? (
            <p className="mt-5 text-sm text-rose-100/80">Blocked processes: {blocked.join(', ')}</p>
          ) : null}

          {isSafe ? (
            <>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                {safeSequence.map((processId) => (
                  <span
                    key={processId}
                    className="rounded-full border border-emerald-400/25 bg-emerald-500/15 px-4 py-2 text-emerald-100"
                  >
                    {processId}
                  </span>
                ))}
              </div>
              <p className="mt-8 text-sm text-emerald-100/85">
                Safe sequence found. Open the simulation when you are ready.
              </p>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setCurrentStep(7)}
              className="mt-8 rounded-full border border-rose-400/35 bg-rose-500 px-7 py-3 font-semibold text-white"
            >
              Activate Recovery
            </button>
          )}
        </motion.div>
      )}

      {analysisNarration ? (
        <>
          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="glass-panel ui-card">
              <p className="ui-kicker">Educational Narration</p>
              <h3 className="mt-3 text-2xl font-semibold text-slate-50">
                {analysisNarration.headline}
              </h3>
              <p className="mt-4 text-sm leading-7 text-slate-300">{analysisNarration.summary}</p>

              {analysisNarration.deadlockReason ? (
                <div className="mt-5 rounded-3xl border border-rose-400/20 bg-rose-500/10 p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-100">
                    Why Deadlock Occurred
                  </p>
                  <p className="mt-3 text-sm leading-7 text-rose-50/90">
                    {analysisNarration.deadlockReason}
                  </p>
                </div>
              ) : null}

              {analysisNarration.safeSequenceFailure ? (
                <div className="mt-5 rounded-3xl border border-amber-400/20 bg-amber-500/10 p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-100">
                    Why Safe Sequence Failed
                  </p>
                  <p className="mt-3 text-sm leading-7 text-amber-50/90">
                    {analysisNarration.safeSequenceFailure}
                  </p>
                </div>
              ) : null}

              {analysisNarration.whySafeSequence ? (
                <div className="mt-5 rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-100">
                    Why The State Is Safe
                  </p>
                  <p className="mt-3 text-sm leading-7 text-emerald-50/90">
                    {analysisNarration.whySafeSequence}
                  </p>
                </div>
              ) : null}

              <div className="mt-5 rounded-3xl border border-blue-400/20 bg-blue-500/10 p-4">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-100">
                  Recovery Strategy Hint
                </p>
                <p className="mt-3 text-sm leading-7 text-blue-50/90">
                  {analysisNarration.recoveryHint}
                </p>
              </div>
            </div>

            <div className="glass-panel ui-card">
              <p className="ui-kicker">Coffman Conditions</p>
              <h3 className="mt-3 text-2xl font-semibold text-slate-50">
                Which Conditions Are Present
              </h3>
              <div className="mt-5 space-y-4">
                {analysisNarration.coffmanConditions.map((condition) => (
                  <CoffmanConditionCard key={condition.key} condition={condition} />
                ))}
              </div>
            </div>
          </div>

          {analysisNarration.blockedProcessDetails?.length ? (
            <div className="glass-panel ui-card">
              <p className="ui-kicker">Process-Level Explanation</p>
              <h3 className="mt-3 text-2xl font-semibold text-slate-50">
                Who Is Holding And Waiting
              </h3>
              <div className="mt-6 grid gap-4 xl:grid-cols-2">
                {analysisNarration.blockedProcessDetails.map((detail) => (
                  <BlockedProcessCard key={detail.processId} detail={detail} />
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      <StepActionBar
        onBack={previousStep}
        onNext={() => (isSafe ? startSimulation() : setCurrentStep(7))}
        nextDisabled={isSafe === null}
        nextLabel={isSafe ? 'Open Simulation' : 'Go To Recovery'}
      />
    </div>
  );
}
