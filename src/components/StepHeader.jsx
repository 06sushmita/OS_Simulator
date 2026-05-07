export default function StepHeader({ step, title, description, children }) {
  return (
    <div className="glass-panel rounded-[2rem] border border-white/10 p-8">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.34em] text-blue-300/80">Step {step}</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-50">{title}</h2>
          {description ? (
            <p className="mt-3 max-w-3xl text-slate-400">{description}</p>
          ) : null}
        </div>

        {children ? <div className="shrink-0">{children}</div> : null}
      </div>
    </div>
  );
}
