import { useState } from 'react';

export default function StepActionBar({
  onBack,
  onNext,
  nextLabel = 'Next',
  nextDisabled = false,
  actions = null,
}) {
  const [isPending, setIsPending] = useState(false);

  function handleNext() {
    if (!onNext || nextDisabled || isPending) {
      return;
    }

    setIsPending(true);
    window.setTimeout(() => {
      onNext();
      setIsPending(false);
    }, 300);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/8 pt-4">
      <button type="button" onClick={onBack} className="nav-button nav-button--back">
        Back
      </button>
      <div className="flex flex-wrap items-center gap-3">
        {actions}
        {onNext ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={nextDisabled || isPending}
            className={`nav-button nav-button--primary ${isPending ? 'nav-button--pending' : ''}`}
          >
            {nextLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
