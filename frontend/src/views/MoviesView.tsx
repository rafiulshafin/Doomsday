import React, { useState } from "react";
import { Movie } from "../types";
import { api } from "../api/client";
import {
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  Layers,
  AlertTriangle,
  Edit2,
  Film,
  Search,
} from "lucide-react";

interface MoviesViewProps {
  movies: Movie[];
  onRefresh: () => void;
}

export const MoviesView: React.FC<MoviesViewProps> = ({ movies, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [releaseYear, setReleaseYear] = useState<number>(2026);
  const [runtime, setRuntime] = useState<number>(120);
  const [watched, setWatched] = useState(false);
  const [selectedPrereqs, setSelectedPrereqs] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setTitle("");
    setReleaseYear(2026);
    setRuntime(120);
    setWatched(false);
    setSelectedPrereqs([]);
    setFormError(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const openEditModal = (movie: Movie) => {
    setEditingMovie(movie);
    setTitle(movie.title);
    setReleaseYear(movie.releaseYear);
    setRuntime(movie.runtime);
    setWatched(movie.watched);
    setSelectedPrereqs(movie.prerequisites.map((p) => p.prerequisiteId));
    setFormError(null);
  };

  // Toggle Watched Status directly from card
  const handleToggleWatched = async (movie: Movie, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.updateMovie(movie.id, { watched: !movie.watched });
      onRefresh();
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  const handlePrereqToggle = (id: string) => {
    setSelectedPrereqs((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSaveMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      if (editingMovie) {
        await api.updateMovie(editingMovie.id, {
          title,
          releaseYear: Number(releaseYear),
          runtime: Number(runtime),
          watched,
          prerequisites: selectedPrereqs,
        });
        setEditingMovie(null);
      } else {
        await api.createMovie({
          title,
          releaseYear: Number(releaseYear),
          runtime: Number(runtime),
          watched,
          prerequisites: selectedPrereqs,
        });
        setIsAddModalOpen(false);
      }
      resetForm();
      onRefresh();
    } catch (err: any) {
      if (err.code === "CIRCULAR_DEPENDENCY" || err.status === 409) {
        setFormError(
          `🚫 CIRCULAR DEPENDENCY (409): ${err.message || "A movie cannot depend on itself directly or transitively!"}`
        );
      } else {
        setFormError(err.message || "Failed to save movie.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMovies = movies.filter((m) =>
    m.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-5 sm:space-y-6 w-full max-w-full">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Film className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
            Marvel Cinematic Universe Catalog
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Add movies, manage watch prerequisites, and mark what you've seen.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search movies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-emerald-900/40 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Movie
          </button>
        </div>
      </div>

      {/* Movies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {filteredMovies.map((movie) => {
          const prereqMovies = movie.prerequisites.map((p) => p.prerequisite).filter(Boolean);

          return (
            <div
              key={movie.id}
              className={`p-4 sm:p-5 rounded-xl border transition-all ${
                movie.watched
                  ? "bg-zinc-900/50 border-emerald-900/40 hover:border-emerald-700/60"
                  : "bg-zinc-900/80 border-zinc-800/80 hover:border-zinc-700"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 flex-1 min-w-0">
                  <h3 className="font-semibold text-base sm:text-lg text-white leading-tight break-words">
                    {movie.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-zinc-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                      {movie.releaseYear}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-zinc-500" />
                      {movie.runtime}m ({Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m)
                    </span>
                  </div>
                </div>

                {/* Watched Toggle Button */}
                <button
                  onClick={(e) => handleToggleWatched(movie, e)}
                  title={movie.watched ? "Mark as unwatched" : "Mark as watched"}
                  className="p-1 text-zinc-400 hover:text-white transition-colors shrink-0"
                >
                  {movie.watched ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <Circle className="w-6 h-6 text-zinc-600 hover:text-zinc-400" />
                  )}
                </button>
              </div>

              {/* Prerequisites Section */}
              <div className="mt-4 pt-3 border-t border-zinc-800/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-zinc-400 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-emerald-500" />
                    Prerequisites ({prereqMovies.length})
                  </span>
                  <button
                    onClick={() => openEditModal(movie)}
                    className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit
                  </button>
                </div>

                {prereqMovies.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {prereqMovies.map((prereq) => (
                      <span
                        key={prereq!.id}
                        className={`text-xs px-2 py-0.5 rounded-full border ${
                          prereq!.watched
                            ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/50"
                            : "bg-zinc-800/80 text-zinc-300 border-zinc-700/60"
                        }`}
                      >
                        {prereq!.title}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-zinc-500 italic">None (can watch anytime)</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Movie Modal */}
      {(isAddModalOpen || editingMovie) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-5 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h2 className="text-lg sm:text-xl font-bold text-white">
                {editingMovie ? `Edit Movie` : "Add MCU Movie"}
              </h2>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingMovie(null);
                  setFormError(null);
                }}
                className="text-zinc-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {/* Error Banner */}
            {formError && (
              <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-lg flex items-start gap-2 text-xs sm:text-sm text-red-200">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveMovie} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">
                  Movie Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Avengers: Doomsday"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">
                    Release Year *
                  </label>
                  <input
                    type="number"
                    required
                    min={1900}
                    max={2040}
                    value={releaseYear}
                    onChange={(e) => setReleaseYear(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">
                    Runtime (min) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={300}
                    value={runtime}
                    onChange={(e) => setRuntime(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Watched Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={watched}
                  onChange={(e) => setWatched(e.target.checked)}
                  className="rounded bg-zinc-950 border-zinc-800 text-emerald-500 focus:ring-emerald-500"
                />
                <span>I have already watched this movie</span>
              </label>

              {/* Prerequisites Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">
                  Prerequisites (Movies to watch first)
                </label>
                <div className="max-h-40 overflow-y-auto p-2 bg-zinc-950 border border-zinc-800 rounded-lg space-y-1">
                  {movies
                    .filter((m) => (editingMovie ? m.id !== editingMovie.id : true))
                    .map((m) => {
                      const isSelected = selectedPrereqs.includes(m.id);
                      return (
                        <div
                          key={m.id}
                          onClick={() => handlePrereqToggle(m.id)}
                          className={`flex items-center justify-between p-2 rounded cursor-pointer text-xs transition-colors ${
                            isSelected
                              ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800/40"
                              : "hover:bg-zinc-800/60 text-zinc-300"
                          }`}
                        >
                          <span className="truncate pr-2">{m.title} ({m.releaseYear})</span>
                          <span className="text-[10px] text-zinc-500 shrink-0">
                            {isSelected ? "Selected" : "Add"}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingMovie(null);
                    setFormError(null);
                  }}
                  className="px-4 py-2 text-sm text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-emerald-900/40 disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : editingMovie ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
