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

export default function Step1_Processes({
  processCountInput,
  processes,
  resources,
  allocationMatrix,
  setProcessCountInput,
  generateProcesses,
  nextStep,
  previousStep,
}) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <div className="grid min-h-0 flex-1 gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
        <section className="glass-panel flex h-fit flex-col rounded-[2rem] border border-white/10 p-6 lg:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.34em] text-blue-300/80">Step 1</p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-50">Process Configuration</h2>
              <p className="mt-3 max-w-2xl text-slate-400">
                Set the process count, then generate a priority-tagged process set for the simulation.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/70 px-5 py-4">
                <label className="mb-2 block text-xs uppercase tracking-[0.24em] text-slate-400">
                  Process Count
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setProcessCountInput(processCountInput - 1)}
                    className="h-12 w-12 rounded-2xl border border-white/10 bg-slate-900 text-xl text-slate-200"
                  >
                    -
                  </button>
                  <div className="w-16 text-center font-mono text-2xl text-slate-50">{processCountInput}</div>
                  <button
                    type="button"
                    onClick={() => setProcessCountInput(processCountInput + 1)}
                    className="h-12 w-12 rounded-2xl border border-white/10 bg-slate-900 text-xl text-slate-200"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={generateProcesses}
                className="rounded-full border border-blue-400/50 bg-blue-500 px-6 py-3.5 font-semibold text-white shadow-[0_0_22px_rgba(59,130,246,0.28)]"
              >
                Generate Processes
              </button>
            </div>
          </div>
        </section>

        <aside className="glass-panel flex min-h-0 flex-col overflow-hidden rounded-[2rem] border border-white/10 p-6">
          <div className="border-b border-white/8 pb-5">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/75">Right Panel</p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-50">Process Allocated</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Resource ownership per process lives here so the main workspace stays clean and easy to scan.
            </p>
          </div>

          <div className="process-sidebar mt-5 min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="space-y-4">
              {processes.map((process, processIndex) => {
                const { activeAllocations, totalAllocated } = getProcessAllocation(
                  processIndex,
                  resources,
                  allocationMatrix
                );

                return (
                  <div
                    key={process.id}
                    className="rounded-[1.6rem] border border-white/10 bg-slate-950/55 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="inline-flex rounded-full border border-blue-400/20 bg-blue-500/12 px-3 py-1 text-[11px] font-semibold tracking-[0.24em] text-blue-200">
                          {process.id}
                        </span>
                        <h4 className="mt-3 text-base font-semibold text-slate-100">{process.name}</h4>
                      </div>
                      <span className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-xs text-slate-300">
                        {totalAllocated} allocated
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {activeAllocations.length > 0 ? (
                        activeAllocations.map((entry) => (
                          <span
                            key={`${process.id}-${entry.id}`}
                            className="rounded-full border border-emerald-400/25 bg-emerald-500/12 px-3 py-1 text-xs font-medium text-emerald-200"
                          >
                            {entry.id}: {entry.amount}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-full border border-white/10 bg-slate-900/60 px-3 py-1 text-xs text-slate-400">
                          No resources allocated yet
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      <div className="flex shrink-0 justify-between">
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
