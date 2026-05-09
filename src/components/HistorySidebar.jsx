import { AnimatePresence, motion } from 'framer-motion';

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

export default function HistorySidebar({
  isOpen,
  historyEntries,
  isLoading,
  notice,
  onClose,
  onLoadEntry,
}) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.button
            key="history-overlay"
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm"
            aria-label="Close history drawer"
          />
          <motion.aside
            key="history-drawer"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
            className="fixed left-0 top-0 z-50 flex h-screen w-full max-w-md flex-col border-r border-white/10 bg-[linear-gradient(180deg,rgba(2,6,23,0.98)_0%,rgba(15,23,42,0.96)_100%)] p-5 shadow-[0_0_50px_rgba(2,6,23,0.55)]"
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Scenario History</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-50">Previous Inputs</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Load an older Firebase snapshot back into the simulator.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 transition hover:border-blue-400/40"
              >
                Close
              </button>
            </div>

            {notice ? (
              <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                {notice}
              </div>
            ) : null}

            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-sm text-slate-300">
              Clicking a saved run restores processes, resources, allocation, and max matrices.
            </div>

            <div className="mt-5 flex-1 space-y-3 overflow-y-auto pr-1">
              {isLoading ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/45 p-5 text-sm text-slate-400">
                  Loading saved scenarios from Firebase...
                </div>
              ) : historyEntries.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/45 p-5 text-sm text-slate-400">
                  No saved runs yet. Run a safety check once and it will appear here.
                </div>
              ) : (
                historyEntries.map((entry) => {
                  const summary = entry.summary || {};

                  return (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => onLoadEntry(entry)}
                      className="w-full rounded-[1.5rem] border border-white/10 bg-slate-950/55 p-4 text-left transition hover:border-blue-400/35 hover:bg-blue-500/10"
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
                          {summary.isSafe ? 'Safe' : 'Unsafe'}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
                        <span className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1">
                          {summary.processCount || 0} processes
                        </span>
                        <span className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1">
                          {summary.resourceCount || 0} resources
                        </span>
                        <span className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1">
                          {summary.totalAllocatedInstances || 0} allocated
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
