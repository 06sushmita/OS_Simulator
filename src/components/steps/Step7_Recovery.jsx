import { motion } from 'framer-motion';
import MessageLog from '../MessageLog';
import ProcessCard from '../ProcessCard';
import RAGCanvas from '../RAGCanvas';
import StepHeader from '../StepHeader';

function StrategyCard({ title, copy, tone = 'slate', children }) {
  const toneClasses = {
    slate: 'border-white/10 bg-slate-950/45',
    blue: 'border-blue-400/25 bg-blue-500/10',
    amber: 'border-amber-400/25 bg-amber-500/10',
    emerald: 'border-emerald-400/25 bg-emerald-500/10',
  };

  return (
    <div className={`rounded-3xl border p-5 ${toneClasses[tone] || toneClasses.slate}`}>
      <h3 className="text-xl font-semibold text-slate-100">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-300">{copy}</p>
      {children}
    </div>
  );
}

export default function Step7_Recovery({
  processes,
  resources,
  allocationMatrix,
  needMatrix,
  availableVector,
  messageLog,
  blockedProcessIds,
  analysisNarration,
  lastRecoveryAction,
  setRecoveryMode,
  recoveryMode,
  terminateProcess,
  preemptLowestPriority,
  isSafe,
  safeSequence,
  startSimulation,
  previousStep,
}) {
  const activeProcesses = processes.filter((process) => process.active !== false);
  const recoverySucceeded = isSafe === true;

  return (
    <div className="space-y-6">
      <StepHeader
        step="7"
        title="Recovery Mode"
        description="Resolve the unsafe state either by terminating selected processes or by automated priority-based preemption, then review the explanation of what changed."
      />

      {analysisNarration?.recoveryHint && !lastRecoveryAction ? (
        <StrategyCard
          title="Recovery Goal"
          copy={analysisNarration.recoveryHint}
          tone={recoverySucceeded ? 'emerald' : 'amber'}
        />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.8fr]">
        <RAGCanvas
          processes={processes}
          resources={resources}
          allocationMatrix={allocationMatrix}
          needMatrix={needMatrix}
          availableVector={availableVector}
          currentProcess={blockedProcessIds?.[0] || null}
          isSafe={isSafe}
          blockedProcessIds={blockedProcessIds}
        />
        <MessageLog entries={messageLog} />
      </div>

      {lastRecoveryAction ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <StrategyCard
            title="Applied Strategy"
            copy={lastRecoveryAction.explanation}
            tone={lastRecoveryAction.mode === 'terminate' ? 'blue' : 'amber'}
          >
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-200">
              <span className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1">
                Target: {lastRecoveryAction.processId}
              </span>
              <span className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1">
                Released: {lastRecoveryAction.releasedText}
              </span>
              {lastRecoveryAction.priority !== null ? (
                <span className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1">
                  Priority: {lastRecoveryAction.priority}
                </span>
              ) : null}
            </div>
          </StrategyCard>

          <StrategyCard
            title={recoverySucceeded ? 'Why Recovery Worked' : 'Why The System Is Still Blocked'}
            copy={lastRecoveryAction.outcomeSummary}
            tone={recoverySucceeded ? 'emerald' : 'amber'}
          />
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          className={`glass-panel ui-card border ${
            recoveryMode === 'terminate' ? 'border-blue-400/50' : 'border-white/10'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-2xl font-semibold text-slate-100">Option A: Process Termination</h3>
              <p className="mt-2 text-slate-400">
                Abort one blocked process to release its allocations immediately and break the resource chain.
              </p>
            </div>
            <button type="button" onClick={() => setRecoveryMode('terminate')} className="nav-button">
              Select
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {activeProcesses.map((process) => (
              <ProcessCard
                key={process.id}
                process={process}
                selectable={recoveryMode === 'terminate'}
                onSelect={() => terminateProcess(process.id)}
              />
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          className={`glass-panel ui-card border ${
            recoveryMode === 'preempt' ? 'border-amber-400/50' : 'border-white/10'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-2xl font-semibold text-slate-100">Option B: Resource Preemption</h3>
              <p className="mt-2 text-slate-400">
                The simulator selects the lowest-priority active holder and reclaims its resources.
              </p>
            </div>
            <button type="button" onClick={() => setRecoveryMode('preempt')} className="nav-button">
              Select
            </button>
          </div>

          <button
            type="button"
            onClick={preemptLowestPriority}
            className="mt-6 rounded-3xl border border-amber-400/35 bg-amber-500/14 px-5 py-4 text-left text-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.14)]"
          >
            Run Automated Preemption
          </button>
        </motion.div>
      </div>

      {recoverySucceeded && (
        <div className="glass-panel ui-card border border-emerald-400/35 bg-emerald-500/10">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h3 className="text-2xl font-semibold text-emerald-100">Recovery Successful</h3>
              <p className="mt-2 text-emerald-50/80">
                The system is safe again. Continue to the simulation to review the recovered state.
              </p>
            </div>
            {Array.isArray(safeSequence) && safeSequence.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {safeSequence.map((processId) => (
                  <span
                    key={processId}
                    className="rounded-full border border-emerald-300/25 bg-emerald-500/15 px-4 py-2 text-emerald-50"
                  >
                    {processId}
                  </span>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-emerald-300/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-50/85">
                No runnable processes remain after recovery, but the deadlock has been cleared.
              </div>
            )}
            <button type="button" onClick={startSimulation} className="nav-button nav-button--primary">
              Proceed To Simulation
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button type="button" onClick={previousStep} className="nav-button nav-button--back">
          Back
        </button>
      </div>
    </div>
  );
}
