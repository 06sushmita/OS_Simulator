import { motion } from 'framer-motion';
import RAGCanvas from '../RAGCanvas';
import StepHeader from '../StepHeader';

export default function Step5_SafetyCheck({
  processes,
  resources,
  allocationMatrix,
  needMatrix,
  availableVector,
  isSafe,
  safeSequence,
  simulationSteps,
  runSafetyCheck,
  startSimulation,
  setCurrentStep,
  previousStep,
  historyPanel,
  isSavingHistory,
}) {
  const blocked = [...new Set(simulationSteps.filter((step) => !step.canProceed).map((step) => step.process))];

  return (
    <div className="space-y-6">
      <StepHeader step="5" title="Safety Status Check">
        <div className="flex flex-col items-start gap-3 xl:items-end">
          <p className="max-w-md text-sm text-slate-400 xl:text-right">
            Evaluate the current matrices with Banker's Algorithm and inspect the first blocked process directly on the graph.
          </p>
          <button
            type="button"
            onClick={runSafetyCheck}
            disabled={isSavingHistory}
            className="rounded-full border border-blue-400/50 bg-blue-500 px-7 py-3 font-semibold text-white shadow-[0_0_24px_rgba(59,130,246,0.35)] disabled:cursor-not-allowed disabled:opacity-70"
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
          className={`glass-panel rounded-[2rem] border p-8 text-center ${
            isSafe
              ? 'border-emerald-400/35 bg-emerald-500/10 shadow-[0_0_26px_rgba(34,197,94,0.18)]'
              : 'border-rose-400/35 bg-rose-500/10 shadow-[0_0_26px_rgba(239,68,68,0.18)]'
          }`}
        >
          <div className={`mx-auto inline-flex rounded-full px-5 py-2 text-sm font-semibold tracking-[0.24em] ${
            isSafe ? 'bg-emerald-500/15 text-emerald-200' : 'bg-rose-500/15 text-rose-200'
          }`}>
            {isSafe ? 'SAFE STATE' : 'UNSAFE STATE - DEADLOCK DETECTED'}
          </div>

          {!isSafe && blocked.length > 0 ? (
            <p className="mt-5 text-sm text-rose-100/80">
              Blocked processes: {blocked.join(', ')}
            </p>
          ) : null}

          {isSafe ? (
            <>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                {safeSequence.map((processId) => (
                  <span key={processId} className="rounded-full border border-emerald-400/25 bg-emerald-500/15 px-4 py-2 text-emerald-100">
                    {processId}
                  </span>
                ))}
              </div>
              <button type="button" onClick={startSimulation} className="mt-8 rounded-full border border-emerald-400/35 bg-emerald-500 px-7 py-3 font-semibold text-slate-950">
                Begin Simulation
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setCurrentStep(7)} className="mt-8 rounded-full border border-rose-400/35 bg-rose-500 px-7 py-3 font-semibold text-white">
              Activate Recovery
            </button>
          )}
        </motion.div>
      )}

      {historyPanel}

      <div className="flex justify-between">
        <button type="button" onClick={previousStep} className="nav-button">
          Back
        </button>
        <button
          type="button"
          onClick={() => (isSafe ? startSimulation() : setCurrentStep(7))}
          disabled={isSafe === null}
          className="nav-button nav-button--primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSafe ? 'Go To Simulation' : 'Go To Recovery'}
        </button>
      </div>
    </div>
  );
}
