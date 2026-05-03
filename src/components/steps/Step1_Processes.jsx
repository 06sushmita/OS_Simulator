import { motion } from 'framer-motion';
import ProcessCard from '../ProcessCard';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function Step1_Processes({
  processCountInput,
  processes,
  setProcessCountInput,
  generateProcesses,
  nextStep,
  previousStep,
}) {
  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-[2rem] border border-white/10 p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.34em] text-blue-300/80">Step 1</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-50">Process Configuration</h2>
            <p className="mt-3 max-w-2xl text-slate-400">
              Set the process count, then generate a priority-tagged process set for the simulation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="rounded-3xl border border-white/10 bg-slate-950/70 px-4 py-3">
              <label className="mb-2 block text-xs uppercase tracking-[0.24em] text-slate-400">
                Process Count
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setProcessCountInput(processCountInput - 1)}
                  className="h-11 w-11 rounded-2xl border border-white/10 bg-slate-900 text-xl text-slate-200"
                >
                  -
                </button>
                <div className="w-16 text-center font-mono text-2xl text-slate-50">{processCountInput}</div>
                <button
                  type="button"
                  onClick={() => setProcessCountInput(processCountInput + 1)}
                  className="h-11 w-11 rounded-2xl border border-white/10 bg-slate-900 text-xl text-slate-200"
                >
                  +
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={generateProcesses}
              className="rounded-full border border-blue-400/50 bg-blue-500 px-6 py-3 font-semibold text-white shadow-[0_0_22px_rgba(59,130,246,0.28)]"
            >
              Generate Processes
            </button>
          </div>
        </div>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {processes.map((process) => (
          <motion.div key={process.id} variants={item}>
            <ProcessCard process={process} />
          </motion.div>
        ))}
      </motion.div>

      <div className="flex justify-between">
        <button type="button" onClick={previousStep} className="nav-button">
          Back
        </button>
        <button type="button" onClick={nextStep} className="nav-button nav-button--primary">
          Next
        </button>
      </div>
    </div>
  );
}
