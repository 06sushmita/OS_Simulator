import { motion } from 'framer-motion';

function ResourceDots({ count }) {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          className="h-3 w-3 rounded-full border border-cyan-300/50 bg-cyan-400/70 shadow-[0_0_10px_rgba(34,211,238,0.45)]"
        />
      ))}
    </div>
  );
}

export default function Step2_Resources({
  resourceCountInput,
  resources,
  setResourceCountInput,
  updateResourceField,
  lockResources,
  unlockResources,
  resourcesLocked,
  nextStep,
  previousStep,
}) {
  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-[2rem] border border-white/10 p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.34em] text-blue-300/80">Step 2</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-50">Resource Configuration</h2>
            <p className="mt-3 max-w-2xl text-slate-400">
              Define resource types and total instance counts. The live dot matrix previews each pool.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/70 px-4 py-3">
            <label className="mb-2 block text-xs uppercase tracking-[0.24em] text-slate-400">
              Resource Types
            </label>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setResourceCountInput(resourceCountInput - 1)} className="h-11 w-11 rounded-2xl border border-white/10 bg-slate-900 text-xl text-slate-200">
                -
              </button>
              <input
                type="number"
                min="1"
                max="5"
                value={resourceCountInput}
                onChange={(event) => setResourceCountInput(event.target.value)}
                className="w-20 rounded-2xl border border-white/10 bg-slate-900 px-3 py-2 text-center font-mono text-2xl text-slate-50 outline-none focus:border-blue-400/70"
              />
              <button type="button" onClick={() => setResourceCountInput(resourceCountInput + 1)} className="h-11 w-11 rounded-2xl border border-white/10 bg-slate-900 text-xl text-slate-200">
                +
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">Enter any value from 1 to 5.</p>
          </div>
        </div>
      </div>

      <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }} className="space-y-4">
        {resources.map((resource, index) => (
          <motion.div
            key={resource.id}
            variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
            className="glass-panel flex flex-col gap-5 rounded-3xl border border-white/10 p-5 xl:flex-row xl:items-center xl:justify-between"
          >
            <div className="grid gap-4 md:grid-cols-2 xl:w-2/3">
              <label className="grid gap-2 text-sm text-slate-300">
                <span className="uppercase tracking-[0.22em] text-slate-400">Resource Name</span>
                <input
                  value={resource.name}
                  disabled={resourcesLocked}
                  onChange={(event) => updateResourceField(index, 'name', event.target.value)}
                  className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none disabled:opacity-60"
                />
              </label>
              <label className="grid gap-2 text-sm text-slate-300">
                <span className="uppercase tracking-[0.22em] text-slate-400">Total Instances</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  disabled={resourcesLocked}
                  value={resource.totalInstances}
                  onChange={(event) => updateResourceField(index, 'totalInstances', event.target.value)}
                  className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none disabled:opacity-60"
                />
              </label>
            </div>
            <div className="space-y-3">
              <div className="text-xs uppercase tracking-[0.22em] text-cyan-200">Instance Preview</div>
              <ResourceDots count={resource.totalInstances} />
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="flex flex-wrap justify-between gap-3">
        <button type="button" onClick={previousStep} className="nav-button">
          Back
        </button>
        <div className="flex gap-3">
          <button type="button" onClick={resourcesLocked ? unlockResources : lockResources} className="nav-button">
            {resourcesLocked ? 'Unlock Config' : 'Confirm Resources'}
          </button>
          <button type="button" onClick={nextStep} className="nav-button nav-button--primary">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
