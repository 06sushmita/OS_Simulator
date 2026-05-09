import { motion } from 'framer-motion';

function getPriorityTone(priority) {
  if (priority >= 7) return 'bg-emerald-500/18 text-emerald-300 border-emerald-400/35';
  if (priority >= 4) return 'bg-amber-500/18 text-amber-300 border-amber-400/35';
  return 'bg-rose-500/18 text-rose-300 border-rose-400/35';
}

export default function ProcessCard({ process, selectable = false, selected = false, onSelect }) {
  return (
    <motion.button
      type="button"
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={selectable ? onSelect : undefined}
      className={`glass-panel group relative overflow-hidden rounded-[12px] border p-5 text-left ${
        selected
          ? 'border-blue-400/70 shadow-[0_0_22px_rgba(59,130,246,0.22)]'
          : 'border-white/8'
      } ${
        process.active === false ? 'opacity-55' : ''
      }`}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/60 to-transparent" />
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex rounded-full border border-blue-400/25 bg-blue-500/12 px-3 py-1 text-xs font-semibold tracking-[0.24em] text-blue-200">
            {process.id}
          </div>
          <h3 className="mt-3 text-lg font-semibold text-slate-50">{process.name}</h3>
        </div>
        {process.status !== 'ready' && (
          <span className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
            {process.status}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-slate-400">Priority</span>
        <span className={`rounded-full border px-3 py-1 text-sm font-medium ${getPriorityTone(process.priority)}`}>
          {process.priority}
        </span>
      </div>
    </motion.button>
  );
}
