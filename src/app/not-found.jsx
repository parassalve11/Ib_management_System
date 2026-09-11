import Link from "next/link";
export default function NotFound() { return <main className="error-state"><h1>Record not found</h1><p>This record or page is no longer available.</p><Link className="button primary" href="/ib-records">Back to Records</Link></main>; }
