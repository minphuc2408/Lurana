import { Link } from "react-router";
export function RouteError() {
  return <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-lunara-cream px-6 font-body text-lunara-body">
    <h1 className="font-display text-3xl text-lunara-ink">This page could not be loaded</h1>
    <p>Please try again or return to the home page.</p>
    <Link to="/" className="rounded-full bg-lunara-rose-strong px-6 py-3 text-white">Back to Home</Link>
  </main>;
}
