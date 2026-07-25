import { lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import { useLenis } from "./hooks/useLenis";

const ResultsPage = lazy(() => import("./pages/ResultsPage"));
const HistoryPage = lazy(() => import("./pages/HistoryPage"));

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
          <Route path="/trips/:id" element={<ResultsPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;
