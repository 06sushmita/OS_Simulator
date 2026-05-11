import { motion } from 'framer-motion';
import { STEP_LABELS } from '../store/simulationStore';

const STEP_DESCRIPTIONS = [
  'Configure how many processes participate in the system.',
  'Set resource types and total instance counts.',
  'Fill in Max, Allocation, and derived Need values.',
  'Inspect the live resource-allocation graph.',
  'Run the safety check and inspect blocked processes.',
  'Replay the safe execution sequence step by step.',
  'Apply recovery actions to resolve deadlock.',
];

export default function StepProgressBar({
  currentStep,
  onJump,
}) {
  const workflowSteps = STEP_LABELS.slice(1);
  const activeIndex = Math.max(0, currentStep - 1);
  const progress =
    workflowSteps.length > 1 ? (activeIndex / (workflowSteps.length - 1)) * 100 : 0;

  return (
    <div className="glass-panel ui-card sticky top-4 z-30 mx-auto mb-6 w-full max-w-7xl overflow-visible bg-slate-950/65 backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="ui-kicker">Simulation Flow</p>
          <h2 className="mt-2 text-[22px] font-semibold text-slate-100">Deadlock Detection & Recovery</h2>
        </div>
        <div className="rounded-full border border-white/10 bg-slate-900/72 px-4 py-2 text-sm font-medium text-slate-300">
          {Math.round(progress)}% complete
        </div>
      </div>

      <div className="relative mb-4 h-2 rounded-full bg-slate-800/80">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-green-400 shadow-[0_0_24px_rgba(59,130,246,0.6)]"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        {workflowSteps.map((label, index) => {
          const actualStep = index + 1;
          const active = actualStep === currentStep;
          const reached = actualStep <= currentStep;

          return (
            <button
              key={label}
              type="button"
              onClick={() => onJump(actualStep)}
              className={`group relative rounded-[12px] border px-3 py-3 text-left transition ${
                active
                  ? 'border-blue-400/70 bg-blue-500/12 text-slate-50 shadow-[0_0_18px_rgba(59,130,246,0.25)]'
                  : reached
                    ? 'border-white/10 bg-slate-900/60 text-slate-300 hover:border-blue-400/40'
                    : 'border-white/5 bg-slate-950/40 text-slate-500 hover:border-white/10'
              }`}
            >
              <div className="text-[11px] uppercase tracking-[0.25em] text-slate-400">
                {actualStep}
              </div>
              <div className="mt-1 text-sm font-semibold">{label}</div>
              <div className="step-tooltip">
                {STEP_DESCRIPTIONS[index]}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
