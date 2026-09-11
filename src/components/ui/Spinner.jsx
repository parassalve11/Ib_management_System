export default function Spinner({ size = 15 }) {
  return <svg className="spinner" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity=".2"/><path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>;
}
