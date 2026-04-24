export default function Header({ theme, onToggleTheme }) {
  return (
    <header className="hero-card">
      <div>
        <p className="eyebrow">System Dashboard</p>
        <h1>Deadlock Avoidance Simulator (Banker&apos;s Algorithm)</h1>
        <p className="hero-copy">
          Monitor safe-state evaluation, inspect matrix relationships, and validate live
          resource requests from a structured control panel.
        </p>
      </div>

      <button className="theme-toggle" type="button" onClick={onToggleTheme}>
        <span className="theme-toggle__label">Theme</span>
        <span className="theme-toggle__value">{theme === 'dark' ? 'Dark' : 'Light'}</span>
      </button>
    </header>
  );
}
