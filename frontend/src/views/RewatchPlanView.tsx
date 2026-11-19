import React, { useState, useEffect } from "react";
import { Movie, RewatchOrderResponse } from "../types";
import { api } from "../api/client";
import {
  ListOrdered,
  Clock,
  CheckCircle2,
  Circle,
  Calendar,
  Sparkles,
  AlertCircle,
  Film,
} from "lucide-react";

interface RewatchPlanViewProps {
  movies: Movie[];
  onRefreshMovies: () => void;
}

export const RewatchPlanView: React.FC<RewatchPlanViewProps> = ({
  movies,
  onRefreshMovies,
}) => {
  const defaultMovie =
    movies.find((m) => m.title.toLowerCase().includes("doomsday")) || movies[0];

  const [selectedMovieId, setSelectedMovieId] = useState<string>(
    defaultMovie ? defaultMovie.id : ""
  );
  const [planData, setPlanData] = useState<RewatchOrderResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedMovieId && movies.length > 0) {
      const match =
        movies.find((m) => m.title.toLowerCase().includes("doomsday")) || movies[0];
      setSelectedMovieId(match.id);
    }
  }, [movies, selectedMovieId]);

  const fetchPlan = async (movieId: string) => {
    if (!movieId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getRewatchOrder(movieId);
      setPlanData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load rewatch order.");
      setPlanData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedMovieId) {
      fetchPlan(selectedMovieId);
    }
  }, [selectedMovieId]);

  const handleToggleWatched = async (movieId: string, currentWatched: boolean) => {
    try {
      await api.updateMovie(movieId, { watched: !currentWatched });
      await fetchPlan(selectedMovieId);
      onRefreshMovies();
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  const totalMovies = planData ? planData.movies.length : 0;
  const watchedCount = planData ? planData.watchedCount : 0;
  const progressPercent =
    totalMovies > 0 ? Math.round((watchedCount / totalMovies) * 100) : 0;
  const unwatchedMinutes = planData ? planData.unwatchedRuntime : 0;
  const unwatchedHours = Math.floor(unwatchedMinutes / 60);
  const unwatchedRemainingMins = unwatchedMinutes % 60;

  return (
    <div className="space-y-5 sm:space-y-6 w-full max-w-full">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <ListOrdered className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
            Rewatch Roadmap & Watch Order
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Pick your target movie to get the exact watch order and track remaining binge time.
          </p>
        </div>

        {/* Target Movie Dropdown */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 w-full sm:w-auto">
          <label className="text-xs font-semibold uppercase text-zinc-400 shrink-0">
            Target Movie:
          </label>
          <select
            value={selectedMovieId}
            onChange={(e) => setSelectedMovieId(e.target.value)}
            className="w-full sm:w-auto max-w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 font-medium focus:outline-none focus:border-emerald-500 cursor-pointer truncate"
          >
            {movies.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title} ({m.releaseYear})
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading && (
        <div className="p-10 text-center text-zinc-500">
          <div className="inline-block animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full mb-2"></div>
          <p className="text-xs sm:text-sm">Calculating topological rewatch order...</p>
        </div>
      )}

      {error && (
        <div className="p-3 sm:p-4 bg-red-950/40 border border-red-500/40 rounded-xl flex items-center gap-3 text-red-200 text-xs sm:text-sm">
          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {planData && !isLoading && (
        <div className="space-y-5 sm:space-y-6">
          {/* Target Movie Banner & Progress Stats Card */}
          <div className="bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 pb-4 sm:pb-6 border-b border-zinc-800/80">
              <div className="space-y-1">
                <span className="text-[10px] sm:text-xs uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Target Premiere Movie
                </span>
                <h2 className="text-xl sm:text-3xl font-extrabold text-white leading-tight">
                  {planData.targetMovie.title}
                </h2>
                <p className="text-xs text-zinc-400">
                  Target is excluded from prerequisites. All movies below must be watched prior to this premiere.
                </p>
              </div>

              {/* Stat Chips (Responsive 3-Column Grid on Mobile) */}
              <div className="grid grid-cols-3 gap-2 w-full sm:flex sm:w-auto sm:gap-4 shrink-0">
                <div className="px-2 sm:px-4 py-2 sm:py-3 bg-zinc-950/80 border border-zinc-800 rounded-xl text-center">
                  <div className="text-[10px] sm:text-xs text-zinc-400 font-medium">Prereqs</div>
                  <div className="text-sm sm:text-xl font-bold text-white">{totalMovies} movies</div>
                </div>

                <div className="px-2 sm:px-4 py-2 sm:py-3 bg-zinc-950/80 border border-zinc-800 rounded-xl text-center">
                  <div className="text-[10px] sm:text-xs text-zinc-400 font-medium">Progress</div>
                  <div className="text-sm sm:text-xl font-bold text-emerald-400">
                    {watchedCount} of {totalMovies}
                  </div>
                </div>

                <div className="px-2 sm:px-4 py-2 sm:py-3 bg-zinc-950/80 border border-zinc-800 rounded-xl text-center">
                  <div className="text-[10px] sm:text-xs text-zinc-400 font-medium">Remaining</div>
                  <div className="text-sm sm:text-xl font-bold text-amber-400">
                    {unwatchedHours}h {unwatchedRemainingMins}m
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="mt-4 sm:mt-6 space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-300 font-medium">
                <span>Rewatch Completion</span>
                <span className="font-semibold text-emerald-400">
                  {watchedCount} of {totalMovies} ({progressPercent}%)
                </span>
              </div>
              <div className="h-2.5 sm:h-3 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800 p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all duration-500 ease-out shadow-sm shadow-emerald-500/50"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Ordered Roadmap Section */}
          <div className="space-y-3">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Film className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
              Chronological & Dependency Watch Order
            </h3>

            {planData.movies.length === 0 ? (
              <div className="p-6 sm:p-8 text-center bg-zinc-900/50 border border-zinc-800/80 rounded-xl text-zinc-400">
                <p className="text-xs sm:text-sm">
                  ✨ An empty list — no prerequisites required for{" "}
                  <strong className="text-zinc-200">{planData.targetMovie.title}</strong>!
                </p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-2.5">
                {planData.movies.map((movie, index) => (
                  <div
                    key={movie.id}
                    onClick={() => handleToggleWatched(movie.id, movie.watched)}
                    className={`flex items-center justify-between p-3 sm:p-4 rounded-xl border cursor-pointer transition-all ${
                      movie.watched
                        ? "bg-emerald-950/20 border-emerald-900/40 hover:border-emerald-800/60"
                        : "bg-zinc-900/70 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1 pr-2">
                      {/* Step Number Badge */}
                      <div
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                          movie.watched
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-zinc-800 text-zinc-300 border border-zinc-700"
                        }`}
                      >
                        #{index + 1}
                      </div>

                      <div className="space-y-0.5 min-w-0">
                        <h4
                          className={`font-semibold text-sm sm:text-base leading-tight truncate ${
                            movie.watched ? "text-emerald-200 line-through decoration-emerald-500/50" : "text-white"
                          }`}
                        >
                          {movie.title}
                        </h4>
                        <div className="flex items-center gap-2 sm:gap-3 text-xs text-zinc-400">
                          <span>{movie.releaseYear}</span>
                          <span>•</span>
                          <span>{movie.runtime}m</span>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Checkbox */}
                    <div className="shrink-0">
                      {movie.watched ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-zinc-600 hover:text-zinc-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
