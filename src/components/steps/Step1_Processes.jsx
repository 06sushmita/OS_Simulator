import { AnimatePresence, motion } from 'framer-motion';
import StepActionBar from '../StepActionBar';

const RESOURCE_BADGE_TONES = [
  'border-cyan-400/25 bg-cyan-500/12 text-cyan-200',
  'border-emerald-400/25 bg-emerald-500/12 text-emerald-200',
  'border-amber-400/25 bg-amber-500/12 text-amber-200',
  'border-fuchsia-400/25 bg-fuchsia-500/12 text-fuchsia-200',
  'border-rose-400/25 bg-rose-500/12 text-rose-200',
];

function getProcessAllocation(processIndex, resources, allocationMatrix) {
  const row = allocationMatrix[processIndex] ?? [];
  const activeAllocations = resources
    .map((resource, resourceIndex) => ({
      id: resource.id,
      amount: Number(row[resourceIndex] ?? 0),
    }))
    .filter((entry) => entry.amount > 0);

  return {
    activeAllocations,
    totalAllocated: activeAllocations.reduce((sum, entry) => sum + entry.amount, 0),
  };
}

function getResourceBadgeTone(index) {
  return RESOURCE_BADGE_TONES[index % RESOURCE_BADGE_TONES.length];
}

export default function Step1_Processes({
  processCountInput,
  processes,
  resources,
  allocationMatrix,
  setProcessCountInput,
  nextStep,
  previousStep,
}) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <div className="grid min-h-0 flex-1 gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.92fr)]">
        <section className="glass-panel ui-card flex min-h-0 flex-col justify-between">
          <div className="flex flex-col gap-6">
            <div className="max-w-2xl">
              <p className="ui-kicker">Step 1</p>
              <h2 className="ui-heading mt-8">Process Configuration</h2>
              <p className="ui-body mt-8">
                Set the process count and use the live preview to confirm how many process lanes the simulation will generate.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(260px,300px)_minmax(0,1fr)]">
              <div className="rounded-[12px] border border-white/8 bg-slate-950/68 p-5">
                <label className="ui-kicker block">Process Count</label>
                <div className="mt-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setProcessCountInput(processCountInput - 1)}
                    className="flex h-12 w-12 items-center justify-center rounded-[12px] border border-white/10 bg-slate-900 text-xl text-slate-100 transition hover:-translate-y-0.5 hover:border-white/30"
                  >
                    -
                  </button>
                  <div className="flex-1 rounded-[12px] border border-white/8 bg-slate-900/80 px-4 py-3 text-center">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={processCountInput}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="font-mono text-3xl font-semibold text-slate-50"
                      >
                        {processCountInput}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProcessCountInput(processCountInput + 1)}
                    className="flex h-12 w-12 items-center justify-center rounded-[12px] border border-white/10 bg-slate-900 text-xl text-slate-100 transition hover:-translate-y-0.5 hover:border-white/30"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="rounded-[12px] border border-white/8 bg-slate-950/56 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="ui-kicker">Live Preview</p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-100">Process badges</h3>
                  </div>
                  <div className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">
                    {processCountInput} total
                  </div>
                </div>
                <p className="ui-body mt-3">
                  These are the process lanes that will appear in later matrices, the graph, and the simulation playback.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {Array.from({ length: processCountInput }, (_, index) => (
                    <motion.span
                      key={`preview-${index}`}
                      layout
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="rounded-full border border-cyan-400/22 bg-cyan-500/12 px-3 py-1.5 text-sm font-semibold text-cyan-100"
                    >
                      P{index}
                    </motion.span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <StepActionBar onBack={previousStep} onNext={nextStep} />
        </section>

        <aside className="glass-panel ui-card flex min-h-0 max-h-[30rem] flex-col overflow-hidden xl:max-h-[calc(100vh-14rem)]">
          <div className="border-b border-white/8 pb-4">
            <p className="ui-kicker">Right Panel</p>
            <h3 className="mt-2 text-[22px] font-semibold text-slate-50">Process allocation snapshot</h3>
            <p className="ui-body mt-2">
              Compact cards keep ownership visible while letting you scan several processes at once.
            </p>
          </div>

          <div className="process-sidebar mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="space-y-3">
              {processes.map((process, processIndex) => {
                const { activeAllocations, totalAllocated } = getProcessAllocation(
                  processIndex,
                  resources,
                  allocationMatrix
                );
                const isFeatured = processIndex === processes.length - 1;

                return (
                  <motion.div
                    key={process.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`relative rounded-[12px] border border-white/8 bg-slate-950/55 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ${
                      isFeatured ? 'shadow-[0_0_22px_rgba(45,212,191,0.08)]' : ''
                    }`}
                  >
                    {isFeatured ? (
                      <div className="absolute inset-y-3 left-0 w-px rounded-full bg-gradient-to-b from-cyan-300 via-blue-400 to-transparent shadow-[0_0_10px_rgba(45,212,191,0.8)]" />
                    ) : null}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="inline-flex rounded-full border border-blue-400/20 bg-blue-500/12 px-3 py-1 text-[11px] font-semibold tracking-[0.24em] text-blue-200">
                          {process.id}
                        </span>
                        <h4 className="mt-2 text-sm font-semibold leading-5 text-slate-100">{process.name}</h4>
                      </div>
                      <span className="rounded-full border border-white/10 bg-slate-900/72 px-3 py-1 text-[11px] text-slate-300">
                        {totalAllocated} allocated
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {activeAllocations.length > 0 ? (
                        activeAllocations.map((entry) => (
                          <span
                            key={`${process.id}-${entry.id}`}
                            className={`rounded-full border px-3 py-1 text-[11px] font-medium ${getResourceBadgeTone(
                              resources.findIndex((resource) => resource.id === entry.id)
                            )}`}
                          >
                            {entry.id}:{entry.amount}
                          </span>
                        ))
                      ) : (
                          <span className="rounded-full border border-white/10 bg-slate-900/60 px-3 py-1 text-[11px] text-slate-400">
                          No resources allocated yet
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
