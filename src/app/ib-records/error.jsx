"use client";
export default function ErrorPage({ reset }) { return <main className="error-state"><h1>Unable to load records</h1><p>Please try again. Your saved records are unchanged.</p><button className="button primary" onClick={reset}>Try again</button></main>; }
