import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

function ResourceDots({ count, isInvalid }) {
  if (isInvalid) {
    return (
      <div className="flex min-h-10 items-center gap-2 rounded-[12px] border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-rose-200">
        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-rose-300/60 bg-rose-500/20 text-sm font-semibold">
          X
        </span>
        <span className="text-xs">Invalid count. No instances created.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          className="h-2.5 w-2.5 rounded-full border border-cyan-300/50 bg-cyan-400/70 shadow-[0_0_8px_rgba(34,211,238,0.35)]"
        />
      ))}
    </div>
  );
}

export default function Step2_Resources({
  resourceCountInput,
  resources,
  validationErrors,
  setResourceCountInput,
  updateResourceField,
  lockResources,
  unlockResources,
  resourcesLocked,
  nextStep,
  previousStep,
}) {
  const [isPending, setIsPending] = useState(false);
  const hasResourceRangeErrors = Object.keys(validationErrors).some((key) =>
    key.startsWith('resource-range-')
  );

  function handleNext() {
    if (hasResourceRangeErrors || isPending) {
      return;
    }

    setIsPending(true);
    window.setTimeout(() => {
      nextStep();
      setIsPending(false);
    }, 300);
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <div className="grid min-h-0 flex-1 gap-6 xl:grid-cols-[minmax(320px,0.82fr)_minmax(0,1.18fr)]">
        <section className="glass-panel ui-card flex h-fit flex-col gap-6">
          <div className="max-w-2xl">
            <p className="ui-kicker">Step 2</p>
            <h2 className="ui-heading mt-8">Resource Configuration</h2>
            <p className="ui-body mt-8">
              Define the resource types in the system and tune how many total instances exist for each one.
            </p>
          </div>

          <div className="rounded-[12px] border border-white/8 bg-slate-950/70 p-5">
            <label className="ui-kicker block">Resource Types</label>
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setResourceCountInput(resourceCountInput - 1)}
                className="flex h-12 w-12 items-center justify-center rounded-[12px] border border-white/10 bg-slate-900 text-xl text-slate-200 transition hover:-translate-y-0.5 hover:border-white/30"
              >
                -
              </button>
              <div className="flex-1 rounded-[12px] border border-white/8 bg-slate-900/80 px-4 py-3 text-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={resourceCountInput}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="font-mono text-3xl font-semibold text-slate-50"
                  >
                    {resourceCountInput}
                  </motion.div>
                </AnimatePresence>
              </div>
              <button
                type="button"
                onClick={() => setResourceCountInput(resourceCountInput + 1)}
                className="flex h-12 w-12 items-center justify-center rounded-[12px] border border-white/10 bg-slate-900 text-xl text-slate-200 transition hover:-translate-y-0.5 hover:border-white/30"
              >
                +
              </button>
            </div>
            <p className="ui-body mt-3">Choose between 1 and 5 resource types.</p>
          </div>
        </section>

        <section className="glass-panel ui-card flex min-h-0 max-h-[34rem] flex-col xl:max-h-[calc(100vh-14rem)]">
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
            className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1"
          >
            {resources.map((resource, index) => {
              const totalInstancesError = validationErrors[`resource-range-${index}`];
              const previewCount = totalInstancesError ? 0 : Number(resource.totalInstances) || 0;

              return (
                <motion.div
                  key={resource.id}
                  variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
                  className="rounded-[12px] border border-white/8 bg-slate-950/55 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                >
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="grid gap-2 text-sm text-slate-300">
                        <span className="ui-kicker">Resource Name</span>
                        <input
                          value={resource.name}
                          disabled={resourcesLocked}
                          onChange={(event) => updateResourceField(index, 'name', event.target.value)}
                          className="rounded-[12px] border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none disabled:opacity-60"
                        />
                      </label>
                      <label className="grid gap-2 text-sm text-slate-300">
                        <span className="ui-kicker">Total Instances</span>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          disabled={resourcesLocked}
                          value={resource.totalInstances}
                          onFocus={(event) => event.target.select()}
                          onChange={(event) =>
                            updateResourceField(index, 'totalInstances', event.target.value)
                          }
                          className={`rounded-[12px] border px-4 py-3 text-slate-100 outline-none disabled:opacity-60 ${
                            totalInstancesError
                              ? 'border-rose-400/70 bg-rose-500/12'
                              : 'border-white/10 bg-slate-950/70'
                          }`}
                        />
                        {totalInstancesError ? (
                          <span className="text-xs text-rose-300">{totalInstancesError}</span>
                        ) : null}
                      </label>
                    </div>

                    <div className="rounded-[12px] border border-white/10 bg-slate-900/45 px-3 py-3">
                      <div className="ui-kicker">Instance Preview</div>
                      <div className="mt-2">
                        <ResourceDots count={previewCount} isInvalid={Boolean(totalInstancesError)} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {hasResourceRangeErrors && (
            <div className="mt-4 rounded-[12px] border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-200">
              Keep each resource total between 1 and 10 before moving ahead.
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/8 pt-4">
            <button type="button" onClick={previousStep} className="nav-button nav-button--back">
              Back
            </button>
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={resourcesLocked ? unlockResources : lockResources} className="nav-button">
                {resourcesLocked ? 'Unlock Config' : 'Confirm Resources'}
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={hasResourceRangeErrors || isPending}
                className={`nav-button nav-button--primary ${isPending ? 'nav-button--pending' : ''}`}
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
