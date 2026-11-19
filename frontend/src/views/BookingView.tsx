import React, { useState, useEffect } from "react";
import { Cinema, BookingQuoteResponse } from "../types";
import { api } from "../api/client";
import {
  Ticket,
  Users,
  CheckCircle2,
  XCircle,
  Plus,
  Building2,
  Sparkles,
  Info,
} from "lucide-react";

interface BookingViewProps {
  cinemas: Cinema[];
  onRefreshCinemas: () => void;
}

export const BookingView: React.FC<BookingViewProps> = ({
  cinemas,
  onRefreshCinemas,
}) => {
  const [selectedCinemaId, setSelectedCinemaId] = useState<string>(
    cinemas[0] ? cinemas[0].id : ""
  );
  const [groupSize, setGroupSize] = useState<number>(44);
  const [quote, setQuote] = useState<BookingQuoteResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add Cinema Modal State
  const [isAddCinemaOpen, setIsAddCinemaOpen] = useState(false);
  const [newCinemaName, setNewCinemaName] = useState("");
  const [newBundleSizesStr, setNewBundleSizesStr] = useState("6, 9, 20");
  const [addCinemaError, setAddCinemaError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedCinemaId && cinemas.length > 0) {
      setSelectedCinemaId(cinemas[0].id);
    }
  }, [cinemas, selectedCinemaId]);

  const fetchQuote = async (cinemaId: string, size: number) => {
    if (!cinemaId || size < 1 || size > 10000) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getBookingQuote(cinemaId, size);
      setQuote(res);
    } catch (err: any) {
      setError(err.message || "Failed to calculate quote.");
      setQuote(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCinemaId && groupSize >= 1 && groupSize <= 10000) {
      fetchQuote(selectedCinemaId, groupSize);
    }
  }, [selectedCinemaId, groupSize]);

  const selectedCinema = cinemas.find((c) => c.id === selectedCinemaId);

  const handleCreateCinema = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddCinemaError(null);

    const sizes = newBundleSizesStr
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((s) => !isNaN(s) && s > 0);

    if (sizes.length === 0 || sizes.length > 10) {
      setAddCinemaError("Must provide between 1 and 10 bundle sizes.");
      return;
    }

    try {
      const created = await api.createCinema({
        name: newCinemaName.trim(),
        bundleSizes: sizes,
      });
      setIsAddCinemaOpen(false);
      setNewCinemaName("");
      setNewBundleSizesStr("");
      onRefreshCinemas();
      setSelectedCinemaId(created.id);
    } catch (err: any) {
      setAddCinemaError(err.message || "Failed to create cinema.");
    }
  };

  const presets = [6, 11, 44, 7, 50, 100];

  return (
    <div className="space-y-5 sm:space-y-6 w-full max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Ticket className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
            Watch-Party Seat Bundle Optimizer
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Find the fewest bundles for your group size with zero empty seats.
          </p>
        </div>

        <button
          onClick={() => setIsAddCinemaOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-semibold rounded-lg border border-zinc-700 transition-colors w-full sm:w-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Cinema
        </button>
      </div>

      {/* Main Grid: Cinema Selection & Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Left Column: Input Form */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-5 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-6">
          <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-3">
            <Building2 className="w-4 h-4 text-emerald-400" />
            Booking Parameters
          </h2>

          {/* Cinema Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
              Select Cinema
            </label>
            <select
              value={selectedCinemaId}
              onChange={(e) => setSelectedCinemaId(e.target.value)}
              className="w-full px-3 py-2 sm:py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 font-medium focus:outline-none focus:border-emerald-500 cursor-pointer truncate"
            >
              {cinemas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Selected Cinema Bundle Info */}
          {selectedCinema && (
            <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-1.5">
              <span className="text-xs text-zinc-400 font-medium">Bundle Sizes:</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedCinema.bundleSizes.map((size) => (
                  <span
                    key={size}
                    className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20"
                  >
                    {size} seats
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Group Size Input */}
          <div>
            <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5 flex items-center justify-between">
              <span>Group Size (1–10,000)</span>
              <span className="text-zinc-500 font-normal">Attendees</span>
            </label>
            <div className="relative">
              <Users className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                min={1}
                max={10000}
                value={groupSize}
                onChange={(e) => setGroupSize(Number(e.target.value))}
                className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Sample Presets */}
          <div>
            <span className="text-xs text-zinc-500 block mb-1.5">Quick Test Cases:</span>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((size) => (
                <button
                  key={size}
                  onClick={() => setGroupSize(size)}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                    groupSize === size
                      ? "bg-emerald-600 text-white border-emerald-500 font-bold"
                      : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800"
                  }`}
                >
                  {size}p
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Quote Results Display */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="h-full min-h-[250px] flex flex-col items-center justify-center p-6 sm:p-8 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-500">
              <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mb-3" />
              <p className="text-xs sm:text-sm font-medium">Solving minimum bundle knapsack...</p>
            </div>
          ) : error ? (
            <div className="p-4 sm:p-6 bg-red-950/40 border border-red-500/40 rounded-2xl text-red-200 text-xs sm:text-sm">
              {error}
            </div>
          ) : quote ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3 sm:pb-4 gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] sm:text-xs uppercase text-zinc-400 font-semibold truncate block">
                    {quote.cinemaName}
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-white">Party of {quote.groupSize}</h3>
                </div>

                {quote.possible ? (
                  <span className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] sm:text-xs font-bold shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Exact Match
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-[11px] sm:text-xs font-bold shrink-0">
                    <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Not Possible
                  </span>
                )}
              </div>

              {quote.possible ? (
                <div className="space-y-4 sm:space-y-6">
                  {/* Hero Quote Result */}
                  <div className="bg-gradient-to-br from-emerald-950/30 via-zinc-950 to-zinc-950 border border-emerald-800/40 rounded-xl p-4 sm:p-6 text-center space-y-2">
                    <span className="text-[10px] sm:text-xs uppercase tracking-wider text-emerald-400 font-semibold flex items-center justify-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Fewest Bundles Required
                    </span>
                    <div className="text-2xl sm:text-4xl font-extrabold text-white break-words">
                      {quote.formatted}
                    </div>
                    <p className="text-[11px] sm:text-xs text-zinc-400">
                      Total: {quote.totalBundles} {quote.totalBundles === 1 ? "bundle" : "bundles"} exactly equals {quote.groupSize} seats (0 empty seats).
                    </p>
                  </div>

                  {/* Bundle Breakdown Cards */}
                  <div>
                    <h4 className="text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-2.5">
                      Purchase Breakdown
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                      {quote.bundles.map((bundle) => (
                        <div
                          key={bundle.size}
                          className="p-3 sm:p-4 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between"
                        >
                          <div>
                            <div className="text-[11px] text-zinc-400">Bundle Size</div>
                            <div className="text-base sm:text-lg font-bold text-white">{bundle.size} seats</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[11px] text-emerald-400 font-medium">Qty</div>
                            <div className="text-lg sm:text-xl font-extrabold text-emerald-400">
                              × {bundle.count}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 sm:p-8 text-center bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <Info className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-white">Not possible</h4>
                  <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
                    No combination of bundle sizes ({selectedCinema?.bundleSizes.join(", ")}) can sum up to exactly {quote.groupSize} seats.
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Add Cinema Modal */}
      {isAddCinemaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-5 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-base sm:text-lg text-white">Add Cinema</h3>
              <button
                onClick={() => setIsAddCinemaOpen(false)}
                className="text-zinc-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {addCinemaError && (
              <div className="p-3 bg-red-950/50 border border-red-500/40 rounded-lg text-xs text-red-200">
                {addCinemaError}
              </div>
            )}

            <form onSubmit={handleCreateCinema} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">
                  Cinema Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Metro IMAX"
                  value={newCinemaName}
                  onChange={(e) => setNewCinemaName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">
                  Bundle Sizes (comma-separated, 1–500 each) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2, 5 or 6, 9, 20"
                  value={newBundleSizesStr}
                  onChange={(e) => setNewBundleSizesStr(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddCinemaOpen(false)}
                  className="px-4 py-2 text-sm text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-emerald-900/40"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
