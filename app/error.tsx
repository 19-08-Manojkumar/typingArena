"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="empty-state panel" role="alert">
      <h1>Let’s reset the arena.</h1>
      <p>Something interrupted this screen. Your saved progress stays on this browser.</p>
      <button className="button primary" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
