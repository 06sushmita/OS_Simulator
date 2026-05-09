export default function StepHeader({ step, title, description, children }) {
  return (
    <div className="glass-panel ui-card">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="ui-kicker">Step {step}</p>
          <h2 className="ui-heading mt-2">{title}</h2>
          {description ? (
            <p className="ui-body mt-3 max-w-3xl">{description}</p>
          ) : null}
        </div>

        {children ? <div className="shrink-0">{children}</div> : null}
      </div>
    </div>
  );
}
