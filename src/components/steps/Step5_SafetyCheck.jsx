import { useEffect } from 'react';
import { motion } from 'framer-motion';
import RAGCanvas from '../RAGCanvas';
import StepActionBar from '../StepActionBar';
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
  isSavingHistory,
}) {
  const blocked = [...new Set(simulationSteps.filter((step) => !step.canProceed).map((step) => step.process))];
  const hasSafeSequence = isSafe && Array.isArray(safeSequence) && safeSequence.length > 0;

  useEffect(() => {
    if (hasSafeSequence) {
      startSimulation();
    }
  }, [hasSafeSequence, startSimulation]);

  return (
    <div className="space-y-24">
      <StepHeader
        step="5"
        title="Safety Status Check"
        description="Evaluate the current matrices with Banker's Algorithm and inspect the first blocked process directly on the graph."
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
              <p className="mt-8 text-sm text-emerald-100/85">
                Safe sequence found. Opening the simulation automatically.
              </p>
            </>
          ) : (
            <button type="button" onClick={() => setCurrentStep(7)} className="mt-8 rounded-full border border-rose-400/35 bg-rose-500 px-7 py-3 font-semibold text-white">
              Activate Recovery
            </button>
          )}
        </motion.div>
      )}
      <StepActionBar
        onBack={previousStep}
        onNext={() => (isSafe ? startSimulation() : setCurrentStep(7))}
        nextDisabled={isSafe === null}
        nextLabel={isSafe ? 'Open Simulation' : 'Go To Recovery'}
      />
    </div>
  );
}
