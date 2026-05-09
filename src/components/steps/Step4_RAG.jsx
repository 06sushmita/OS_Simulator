import RAGCanvas from '../RAGCanvas';
import StepActionBar from '../StepActionBar';
import StepHeader from '../StepHeader';

export default function Step4_RAG({
  processes,
  resources,
  allocationMatrix,
  needMatrix,
  availableVector,
  nextStep,
  previousStep,
}) {
  const totalOutstandingNeed = needMatrix
    .flat()
    .reduce((sum, value) => sum + Math.max(0, Number(value ?? 0)), 0);

  return (
    <div className="space-y-6">
      <StepHeader
        step="4"
        title="Resource Allocation Graph"
        description="This graph maps held resources and unresolved requests directly from the matrices."
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.75fr)_22rem]">
        <RAGCanvas
          processes={processes}
          resources={resources}
          allocationMatrix={allocationMatrix}
          needMatrix={needMatrix}
          availableVector={availableVector}
        />
        <div className="glass-panel ui-card overflow-hidden xl:self-start">
          <div className="border-b border-white/10 pb-16">
            <p className="ui-kicker">Live Need Matrix</p>
            <h3 className="mt-2 text-[22px] font-semibold text-slate-100">Outstanding requests</h3>
            <p className="ui-body mt-2">
              A compact live board beside the graph so you can read need values without leaving this screen.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <div className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-sm text-amber-100">
                Total Need {totalOutstandingNeed}
              </div>
              <div className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-sm text-slate-300">
                {processes.length}P / {resources.length}R
              </div>
            </div>
          </div>

          <div className="max-h-[36rem] overflow-auto pt-4">
            <div className="divide-y divide-white/10">
              {processes.map((process, rowIndex) => {
                const rowTotal = (needMatrix[rowIndex] || []).reduce(
                  (sum, value) => sum + Math.max(0, Number(value ?? 0)),
                  0
                );

                return (
                  <div
                    key={process.id}
                    className="py-3 first:pt-0 last:pb-0"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-slate-100">{process.id}</div>
                      <div className="w-full max-w-[10rem] rounded-[12px] border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-center font-mono text-[15px] font-semibold text-cyan-100">
                        Row Total {rowTotal}
                      </div>
                    </div>

                    {rowTotal === 0 ? (
                      <div className="rounded-[12px] border border-white/10 bg-slate-950/45 px-3 py-3 text-[13px] font-normal text-slate-500">
                        No outstanding requests
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1">
                        {resources.map((resource, colIndex) => {
                          const value = Math.max(0, Number(needMatrix[rowIndex]?.[colIndex] ?? 0));
                          const hasNeed = value > 0;

                          return (
                            <div
                              key={resource.id}
                              className={`flex items-center justify-between rounded-[12px] border px-3 py-2 text-[13px] ${
                                hasNeed
                                  ? 'border-amber-400/30 bg-amber-500/10 text-amber-100'
                                  : 'border-white/10 bg-slate-950/60 text-slate-500'
                              }`}
                            >
                              <span className="font-normal">{resource.name}</span>
                              <span className="font-mono font-normal">{value}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <StepActionBar onBack={previousStep} onNext={nextStep} />
    </div>
  );
}
