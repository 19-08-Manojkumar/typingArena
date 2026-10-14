import Link from "next/link";
export default function NotFound() {
  return (
    <div className="empty-state panel">
      <div className="eyebrow">OUTSIDE THE ARENA</div>
      <h1>This route took a wrong turn.</h1>
      <p>Head back to the menu and choose your next challenge.</p>
      <Link className="button primary" href="/">
        Return to menu
      </Link>
    </div>
  );
}
