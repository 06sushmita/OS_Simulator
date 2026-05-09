import { AnimatePresence, motion } from 'framer-motion';

const typeClasses = {
  success: 'text-emerald-300 border-emerald-400/20 bg-emerald-500/10',
  info: 'text-blue-200 border-blue-400/20 bg-blue-500/10',
  warning: 'text-amber-200 border-amber-400/20 bg-amber-500/10',
  error: 'text-rose-200 border-rose-400/20 bg-rose-500/10',
};

export default function MessageLog({ entries }) {
  return (
    <div className="glass-panel flex min-h-[28rem] max-h-[32rem] flex-col overflow-hidden rounded-3xl border border-white/10 xl:max-h-[calc(100vh-14rem)]">
      <div className="border-b border-white/10 px-5 py-4">
        <h3 className="text-lg font-semibold text-slate-100">Message Log</h3>
        <p className="mt-1 text-sm text-slate-400">Live system narration with step timestamps.</p>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4 pr-3 font-mono text-sm">
        <AnimatePresence initial={false}>
          {entries.map((entry) => (
            <motion.div
              key={`${entry.step}-${entry.text}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              className={`rounded-2xl border p-4 ${typeClasses[entry.type] || typeClasses.info}`}
            >
              <div className="mb-2 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.2em] text-slate-400">
                <span>{entry.icon} Step {entry.step}</span>
                <span>{entry.type}</span>
              </div>
              <p className="leading-6">{entry.text}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
