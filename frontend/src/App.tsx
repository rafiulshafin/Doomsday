import React, { useState, useEffect } from "react";
import { Navbar, ViewType } from "./components/Navbar";
import { MoviesView } from "./views/MoviesView";
import { RewatchPlanView } from "./views/RewatchPlanView";
import { BookingView } from "./views/BookingView";
import { Movie, Cinema } from "./types";
import { api } from "./api/client";

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>("movies");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      const [moviesData, cinemasData] = await Promise.all([
        api.getMovies(),
        api.getCinemas(),
      ]);
      setMovies(moviesData);
      setCinemas(cinemasData);
    } catch (err) {
      console.error("Failed to load initial data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans">
      <Navbar currentView={currentView} onSelectView={setCurrentView} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
            <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
            <p className="text-zinc-500 text-sm">Connecting to Doomsday Ready API...</p>
          </div>
        ) : (
          <>
            {currentView === "movies" && (
              <MoviesView movies={movies} onRefresh={loadData} />
            )}
            {currentView === "rewatch" && (
              <RewatchPlanView movies={movies} onRefreshMovies={loadData} />
            )}
            {currentView === "booking" && (
              <BookingView cinemas={cinemas} onRefreshCinemas={loadData} />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950/60 py-6 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Doomsday Ready • Blinto Talent Accelerator 2027 Assessment</span>
          <span className="text-emerald-500/80">Custom Topological Sort & Coin-Change Algorithms</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
