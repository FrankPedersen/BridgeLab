import React from 'react';
import { Zap } from 'lucide-react';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  isEngineReady: boolean;
  totalDeals: number;
  lastLatencyMs?: number;
  dataSource?: 'GCS' | 'Local';
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPath,
  onNavigate,
  isEngineReady,
  totalDeals,
  lastLatencyMs,
  dataSource = 'GCS',
}) => {
  const navItems = [
    { path: '/', label: 'Oversigt' },
    { path: '/flannery', label: 'Flannery 2♦' },
    { path: '/weak-two', label: 'Weak Two' },
    { path: '/precision', label: 'Precision 1♣' },
    { path: '/multi', label: 'Multi 2♦' },
    { path: '/explorer', label: 'Fri Explorer' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div 
          onClick={() => onNavigate('/')} 
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <span className="text-xl font-bold tracking-tighter">♠</span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base tracking-wide bg-gradient-to-r from-white via-slate-100 to-cyan-200 bg-clip-text text-transparent">
                Bridge DDS Explorer
              </span>
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                Serverless
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Double Dummy In-Memory Portal</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
          {navItems.map((item) => {
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Status Indicators */}
        <div className="flex items-center space-x-3 text-xs">
          {/* Query Latency */}
          {lastLatencyMs !== undefined && (
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>{lastLatencyMs} ms</span>
            </div>
          )}

          {/* Engine Status */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80">
            <span className={`w-2 h-2 rounded-full ${isEngineReady ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-amber-400 animate-pulse'}`} />
            <span className="text-slate-300 font-medium">
              {isEngineReady ? (
                <>
                  <span className="text-slate-400 hidden lg:inline">
                    {dataSource === 'GCS' ? 'GCS Live: ' : 'Hyparquet: '}
                  </span>
                  {totalDeals.toLocaleString('da-DK')} spil
                </>
              ) : (
                'Indlæser data...'
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden flex overflow-x-auto px-4 py-2 border-t border-slate-800/60 space-x-2 scrollbar-none bg-slate-950/40">
        {navItems.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={`whitespace-nowrap px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/60'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
