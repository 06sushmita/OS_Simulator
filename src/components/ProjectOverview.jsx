const statusStyles = {
  Ready: 'border-white/10 bg-slate-950/70 text-slate-200',
  Safe: 'border-emerald-400/25 bg-emerald-500/12 text-emerald-200',
  Unsafe: 'border-rose-400/25 bg-rose-500/12 text-rose-200',
};

function MetricCard({ label, value, accent = 'text-slate-50' }) {
  return (
    <div className="rounded-[1.6rem] border border-white/10 bg-slate-950/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <p className={`mt-3 text-2xl font-semibold ${accent}`}>{value}</p>
    </div>
  );
}

export default function ProjectOverview({
  processCount,
  activeProcessCount,
  resourceCount,
  freeInstanceCount,
  safetyLabel,
}) {
  return (
    <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <MetricCard label="Processes" value={processCount} />
      <MetricCard label="Active" value={activeProcessCount} accent="text-cyan-200" />
      <MetricCard label="Resources" value={resourceCount} accent="text-blue-200" />
      <MetricCard label="Free Instances" value={freeInstanceCount} accent="text-emerald-200" />
      <div
        className={`rounded-[1.6rem] border p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ${
          statusStyles[safetyLabel] || statusStyles.Ready
        }`}
      >
        <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">System State</p>
        <p className="mt-3 text-2xl font-semibold">{safetyLabel}</p>
      </div>
    </section>
  );
}
