import { motion } from 'framer-motion';
import MessageLog from '../MessageLog';
import ProcessCard from '../ProcessCard';
import RAGCanvas from '../RAGCanvas';

export default function Step7_Recovery({
  processes,
  resources,
  allocationMatrix,
  needMatrix,
  availableVector,
  messageLog,
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

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-[2rem] border border-white/10 p-8">
        <p className="text-xs uppercase tracking-[0.34em] text-blue-300/80">Step 7</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-50">Recovery Mode</h2>
        <p className="mt-3 max-w-3xl text-slate-400">
          Resolve the unsafe state either by terminating selected processes or by automated priority-based preemption.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.8fr]">
        <RAGCanvas
          processes={processes}
          resources={resources}
          allocationMatrix={allocationMatrix}
          needMatrix={needMatrix}
          availableVector={availableVector}
        />
        <MessageLog entries={messageLog} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} className={`glass-panel rounded-[2rem] border p-6 ${
          recoveryMode === 'terminate' ? 'border-blue-400/50' : 'border-white/10'
        }`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-2xl font-semibold text-slate-100">Option A: Process Termination</h3>
              <p className="mt-2 text-slate-400">Pick one or more processes to kill and free their allocations immediately.</p>
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

        <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} className={`glass-panel rounded-[2rem] border p-6 ${
          recoveryMode === 'preempt' ? 'border-amber-400/50' : 'border-white/10'
        }`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-2xl font-semibold text-slate-100">Option B: Resource Preemption</h3>
              <p className="mt-2 text-slate-400">
                The simulator selects the lowest-priority process and reclaims its currently held resources.
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

      {isSafe && safeSequence && (
        <div className="glass-panel rounded-[2rem] border border-emerald-400/35 bg-emerald-500/10 p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h3 className="text-2xl font-semibold text-emerald-100">Recovery Successful</h3>
              <p className="mt-2 text-emerald-50/80">The system is safe again. Resume with the resulting safe sequence.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {safeSequence.map((processId) => (
                <span key={processId} className="rounded-full border border-emerald-300/25 bg-emerald-500/15 px-4 py-2 text-emerald-50">
                  {processId}
                </span>
              ))}
            </div>
            <button type="button" onClick={startSimulation} className="nav-button nav-button--primary">
              Proceed To Simulation
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button type="button" onClick={previousStep} className="nav-button">
          Back
        </button>
      </div>
    </div>
  );
}
