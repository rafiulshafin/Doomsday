import React from "react";
import { Film, ListOrdered, Ticket, Shield } from "lucide-react";

export type ViewType = "movies" | "rewatch" | "booking";

interface NavbarProps {
  currentView: ViewType;
  onSelectView: (view: ViewType) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onSelectView }) => {
  const tabs = [
    { id: "movies" as ViewType, label: "Movies & Prereqs", shortLabel: "Movies", icon: Film },
    { id: "rewatch" as ViewType, label: "Rewatch Plan", shortLabel: "Plan", icon: ListOrdered },
    { id: "booking" as ViewType, label: "Seat Booking", shortLabel: "Booking", icon: Ticket },
  ];

  return (
    <header className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-50 w-full max-w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Logo / Title */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-800 flex items-center justify-center shadow-lg shadow-emerald-950/50 border border-emerald-500/30 shrink-0">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span className="mcu-title text-sm sm:text-xl font-bold tracking-wider text-white">
                  DOOMSDAY <span className="text-emerald-400">READY</span>
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-semibold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  MCU Rewatch
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden lg:block">
                Avengers: Doomsday Roadmap & Ticket Optimizer
              </p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="flex space-x-1 shrink-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentView === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectView(tab.id)}
                  className={`flex items-center space-x-1 sm:space-x-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    isActive
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-500/10"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? "text-emerald-400" : "text-zinc-400"}`} />
                  <span className="hidden md:inline">{tab.label}</span>
                  <span className="md:hidden">{tab.shortLabel}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
