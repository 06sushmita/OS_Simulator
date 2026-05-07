import { motion } from 'framer-motion';
import { STEP_LABELS } from '../store/simulationStore';

const statusClasses = {
  Ready: 'border-white/10 bg-slate-900/70 text-slate-300',
  Safe: 'border-emerald-400/25 bg-emerald-500/12 text-emerald-200',
  Unsafe: 'border-rose-400/25 bg-rose-500/12 text-rose-200',
};

export default function StepProgressBar({
  currentStep,
  onJump,
  processCount,
  resourceCount,
  safetyLabel,
  onRestart,
  userLabel,
  onSignOut,
  isSigningOut,
}) {
  const progress = (currentStep / (STEP_LABELS.length - 1)) * 100;
  const stageNumber = currentStep + 1;

  return (
    <div className="glass-panel sticky top-4 z-30 mx-auto mb-6 w-full max-w-7xl overflow-hidden rounded-3xl border border-white/10 bg-slate-950/65 px-5 py-4 backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.34em] text-blue-300/80">Simulation Flow</p>
          <h2 className="text-lg font-semibold text-slate-100">Deadlock Detection & Recovery</h2>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {userLabel ? (
            <div className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-sm text-slate-300">
              {userLabel}
            </div>
          ) : null}
          <div className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-sm text-slate-300">
            Stage {stageNumber} / {STEP_LABELS.length}
          </div>
          <div
            className={`rounded-full border px-3 py-1 text-sm ${
              statusClasses[safetyLabel] || statusClasses.Ready
            }`}
          >
            {safetyLabel}
          </div>
          <button type="button" onClick={onRestart} className="nav-button px-4 py-2 text-sm">
            New Session
          </button>
          {onSignOut ? (
            <button
              type="button"
              onClick={onSignOut}
              disabled={isSigningOut}
              className="nav-button px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSigningOut ? 'Signing Out...' : 'Logout'}
            </button>
          ) : null}
        </div>
      </div>

      <div className="relative mb-4 h-2 rounded-full bg-slate-800">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-green-400 shadow-[0_0_24px_rgba(59,130,246,0.6)]"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.24em] text-slate-400">
        <span className="rounded-full border border-white/10 bg-slate-900/60 px-3 py-1">
          {processCount} processes
        </span>
        <span className="rounded-full border border-white/10 bg-slate-900/60 px-3 py-1">
          {resourceCount} resources
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        {STEP_LABELS.map((label, index) => {
          const active = index === currentStep;
          const reached = index <= currentStep;

          return (
            <button
              key={label}
              type="button"
              onClick={() => onJump(index)}
              className={`rounded-2xl border px-3 py-2 text-left transition ${
                active
                  ? 'border-blue-400/70 bg-blue-500/12 text-slate-50 shadow-[0_0_18px_rgba(59,130,246,0.25)]'
                  : reached
                    ? 'border-white/10 bg-slate-900/60 text-slate-300 hover:border-blue-400/40'
                    : 'border-white/5 bg-slate-950/40 text-slate-500 hover:border-white/10'
              }`}
            >
              <div className="text-[11px] uppercase tracking-[0.25em] text-slate-400">
                {index + 1}
              </div>
              <div className="mt-1 text-sm font-medium">{label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
