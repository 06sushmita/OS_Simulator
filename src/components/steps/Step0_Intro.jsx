import { motion } from 'framer-motion';

const words = 'Deadlock Detection & Recovery Simulator'.split(' ');

export default function Step0_Intro({ onBegin }) {
  return (
    <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/75 px-8 py-16">
      <div className="grid-overlay absolute inset-0 opacity-40" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.12),transparent_25%)]" />

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <div className="mb-6 inline-flex rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-xs uppercase tracking-[0.34em] text-blue-200">
          OS Simulation Tool
        </div>
        <h1 className="text-5xl font-semibold leading-tight text-slate-50 md:text-7xl">
          {words.map((word, index) => (
            <motion.span
              key={word + index}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.08 }}
              className="mr-4 inline-block"
            >
              {word}
            </motion.span>
          ))}
        </h1>
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.45 }}
          className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-slate-300 md:text-xl"
        >
          Deadlock occurs when processes wait forever on resources held by one another. This
          simulator visualizes detection, safe execution, and recovery through animated system
          state transitions.
        </motion.p>
        <motion.button
          type="button"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.65 }}
          whileHover={{ scale: 1.03, boxShadow: '0 0 36px rgba(59,130,246,0.45)' }}
          whileTap={{ scale: 0.99 }}
          onClick={onBegin}
          className="mt-10 rounded-full border border-blue-400/60 bg-blue-500 px-8 py-4 text-lg font-semibold text-white shadow-[0_0_28px_rgba(59,130,246,0.35)]"
        >
          Begin Simulation
        </motion.button>
      </div>
    </div>
  );
}
