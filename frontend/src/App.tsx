import { lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import { useLenis } from "./hooks/useLenis";

// HistoryPage exists at ./pages/HistoryPage but isn't routed — the app runs
// stateless (no database), so there's nothing to list. Re-add its route when
// trip history comes back (see backend/trips/urls.py for the matching note).
const ResultsPage = lazy(() => import("./pages/ResultsPage"));

function PageFallback() {
  return (
    <div className="flex min-h-[60svh] items-center justify-center">
      <Loader2 className="animate-spin text-[var(--color-accent)]" size={28} />
    </div>
  );
}

function App() {
  useLenis();
  const location = useLocation();

  return (
    <div className="grain min-h-svh bg-[var(--color-bg)]">
      <Header />
      <Suspense fallback={<PageFallback />}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<HomePage />} />
          <Route path="/results" element={<ResultsPage />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;
