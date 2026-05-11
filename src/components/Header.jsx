function StatPill({ label, value, tone = 'neutral' }) {
  return (
    <div className={`hero-stat hero-stat--${tone}`}>
      <span className="hero-stat__label">{label}</span>
      <span className="hero-stat__value">{value}</span>
    </div>
  );
}

export default function Header({ theme, onToggleTheme, processCount, resourceCount, result }) {
  const verdict = result ? (result.isSafe ? 'Safe state' : 'Unsafe state') : 'Awaiting simulation';

  return (
    <header className="hero-card">
      <div className="hero-copy-block">
        <p className="eyebrow">Operating Systems Learning Studio</p>
        <h1>Deadlock Avoidance Simulator</h1>
        <p className="hero-copy">
          Build a system state, run Banker&apos;s Algorithm, and follow every check in order so
          the reasoning stays clear for beginners and advanced users alike.
        </p>

        <div className="hero-stats">
          <StatPill label="Processes" value={processCount} />
          <StatPill label="Resource types" value={resourceCount} />
          <StatPill
            label="Current verdict"
            value={verdict}
            tone={result ? (result.isSafe ? 'safe' : 'unsafe') : 'neutral'}
          />
        </div>
      </div>

      <button className="theme-toggle" type="button" onClick={onToggleTheme}>
        <span className="theme-toggle__label">Theme</span>
        <span className="theme-toggle__value">{theme === 'dark' ? 'Dark' : 'Light'}</span>
      </button>
    </header>
  );
}
