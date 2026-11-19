import React from "react";
import { Film, ListOrdered, Ticket, Shield } from "lucide-react";

export type ViewType = "movies" | "rewatch" | "booking";

interface NavbarProps {
  currentView: ViewType;
  onSelectView: (view: ViewType) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onSelectView }) => {
  const tabs = [
    { id: "movies" as ViewType, label: "1. Movies & Prerequisites", icon: Film },
    { id: "rewatch" as ViewType, label: "2. Rewatch Plan", icon: ListOrdered },
    { id: "booking" as ViewType, label: "3. Watch-Party Booking", icon: Ticket },
  ];

  return (
    <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-800 flex items-center justify-center shadow-lg shadow-emerald-950/50 border border-emerald-500/30">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="mcu-title text-xl font-bold tracking-wider text-white">
                  DOOMSDAY <span className="text-emerald-400">READY</span>
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  MCU Rewatch
                </span>
              </div>
              <p className="text-xs text-zinc-400 hidden sm:block">
                Avengers: Doomsday Roadmap & Ticket Optimizer
              </p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="flex space-x-1 sm:space-x-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentView === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectView(tab.id)}
                  className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-500/10"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-zinc-400"}`} />
                  <span className="hidden md:inline">{tab.label}</span>
                  <span className="md:hidden">
                    {tab.id === "movies" ? "Movies" : tab.id === "rewatch" ? "Plan" : "Booking"}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
