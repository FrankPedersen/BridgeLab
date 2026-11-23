import React from 'react';
import { SlidersHorizontal, RotateCcw, ChevronDown } from 'lucide-react';
import { BridgeFilter } from '../engine/bridgeQueryEngine';

interface MadLibsFilterProps {
  filter: BridgeFilter;
  onFilterChange: (newFilter: BridgeFilter) => void;
  onReset: () => void;
  onToggleAdvanced?: () => void;
  isAdvancedOpen?: boolean;
}

export const MadLibsFilter: React.FC<MadLibsFilterProps> = ({
  filter,
  onFilterChange,
  onReset,
  onToggleAdvanced,
  isAdvancedOpen,
}) => {
  // Convention options
  const convValue = filter.convMask ?? 0;
  const hcpRangeValue = (() => {
    if (filter.minHcp === 13 && filter.maxHcp === 15) return '13-15';
    if (filter.minHcp === 11 && filter.maxHcp === 15) return '11-15';
    if (filter.minHcp === 6 && filter.maxHcp === 10) return '6-10';
    if (filter.minHcp === 16 && filter.maxHcp === undefined) return '16+';
    if (filter.minHcp === 20 && filter.maxHcp === undefined) return '20+';
    return 'any';
  })();

  const clubValue = (() => {
    if (filter.exactClubs === 1) return 'singleton';
    if (filter.exactClubs === 0) return 'renonce';
    if (filter.exactClubs === 2) return 'doubleton';
    return 'any';
  })();

  const fitValue = (() => {
    if (filter.minMajorFit === 8) return '8+';
    if (filter.minMajorFit === 9) return '9+';
    return 'any';
  })();

  const handleConvSelect = (val: number) => {
    const updated: BridgeFilter = {
      ...filter,
      convMask: val === 0 ? undefined : val,
    };
    if (val === 1) {
      updated.minHcp = 11;
      updated.maxHcp = 15;
      updated.exactSpades = 4;
      updated.exactHearts = 5;
    } else if (val === 2) {
      updated.minHcp = 6;
      updated.maxHcp = 10;
      delete updated.exactSpades;
      delete updated.exactHearts;
    } else if (val === 4) {
      updated.minHcp = 16;
      delete updated.maxHcp;
      delete updated.exactSpades;
      delete updated.exactHearts;
    } else if (val === 8) {
      updated.minHcp = 6;
      updated.maxHcp = 10;
      delete updated.exactSpades;
      delete updated.exactHearts;
    } else if (val === 0) {
      delete updated.convMask;
      delete updated.exactSpades;
      delete updated.exactHearts;
    }
    console.log('[Filter] Convention selected:', val, updated);
    onFilterChange(updated);
  };

  const handleHcpSelect = (val: string) => {
    let minHcp: number | undefined;
    let maxHcp: number | undefined;
    if (val === '13-15') { minHcp = 13; maxHcp = 15; }
    else if (val === '11-15') { minHcp = 11; maxHcp = 15; }
    else if (val === '6-10') { minHcp = 6; maxHcp = 10; }
    else if (val === '16+') { minHcp = 16; maxHcp = undefined; }
    else if (val === '20+') { minHcp = 20; maxHcp = undefined; }
    
    const updated: BridgeFilter = { ...filter, minHcp, maxHcp };
    if (minHcp === undefined) delete updated.minHcp;
    if (maxHcp === undefined) delete updated.maxHcp;
    console.log('[Filter] HCP range selected:', val, updated);
    onFilterChange(updated);
  };

  const handleClubSelect = (val: string) => {
    let exactClubs: number | undefined;
    if (val === 'singleton') exactClubs = 1;
    else if (val === 'renonce') exactClubs = 0;
    else if (val === 'doubleton') exactClubs = 2;
    
    const updated: BridgeFilter = { ...filter, exactClubs };
    if (exactClubs === undefined) delete updated.exactClubs;
    console.log('[Filter] Club distribution selected:', val, updated);
    onFilterChange(updated);
  };

  const handleFitSelect = (val: string) => {
    let minMajorFit: number | undefined;
    if (val === '8+') minMajorFit = 8;
    else if (val === '9+') minMajorFit = 9;
    
    const updated: BridgeFilter = { ...filter, minMajorFit };
    if (minMajorFit === undefined) delete updated.minMajorFit;
    console.log('[Filter] Major fit selected:', val, updated);
    onFilterChange(updated);
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden backdrop-blur">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Sentence UI */}
        <div className="text-base sm:text-lg text-slate-200 leading-relaxed font-normal flex flex-wrap items-center gap-2">
          <span className="text-slate-400 font-medium">Vis</span>

          {/* Convention Dropdown */}
          <div className="relative inline-block group">
            <select
              aria-label="Konvention"
              value={convValue}
              onChange={(e) => handleConvSelect(Number(e.target.value))}
              className="appearance-none cursor-pointer bg-cyan-950/80 border border-cyan-500/50 hover:border-cyan-400 text-cyan-200 font-semibold px-3 py-1.5 pr-8 rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm sm:text-base transition-all"
            >
              <option value={0}>alle åbninger</option>
              <option value={1}>Flannery (4♠-5♥)</option>
              <option value={2}>Weak Two (6-farve)</option>
              <option value={4}>Precision (Stærk 1♣)</option>
              <option value={8}>Multi 2♦ (Svag major)</option>
            </select>
            <ChevronDown className="w-4 h-4 text-cyan-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:scale-110 transition-transform" />
          </div>

          <span className="text-slate-400">hænder med</span>

          {/* HCP Range Dropdown */}
          <div className="relative inline-block group">
            <select
              aria-label="Honnørpoint (HP)"
              value={hcpRangeValue}
              onChange={(e) => handleHcpSelect(e.target.value)}
              className="appearance-none cursor-pointer bg-indigo-950/80 border border-indigo-500/50 hover:border-indigo-400 text-indigo-200 font-semibold px-3 py-1.5 pr-8 rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm sm:text-base transition-all"
            >
              <option value="any">enhver HP</option>
              <option value="11-15">11–15 HP</option>
              <option value="13-15">13–15 HP (Stærk)</option>
              <option value="6-10">6–10 HP (Svag)</option>
              <option value="16+">16+ HP (Stærk)</option>
              <option value="20+">20+ HP (Slemzone)</option>
            </select>
            <ChevronDown className="w-4 h-4 text-indigo-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:scale-110 transition-transform" />
          </div>

          <span className="text-slate-400">,</span>

          {/* Clubs Dropdown */}
          <div className="relative inline-block group">
            <select
              aria-label="Klør-fordeling"
              value={clubValue}
              onChange={(e) => handleClubSelect(e.target.value)}
              className="appearance-none cursor-pointer bg-emerald-950/80 border border-emerald-500/50 hover:border-emerald-400 text-emerald-200 font-semibold px-3 py-1.5 pr-8 rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm sm:text-base transition-all"
            >
              <option value="any">enhver klørfordeling</option>
              <option value="singleton">singleton klør (1♣)</option>
              <option value="renonce">renonce klør (0♣)</option>
              <option value="doubleton">doubleton klør (2♣)</option>
            </select>
            <ChevronDown className="w-4 h-4 text-emerald-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:scale-110 transition-transform" />
          </div>

          <span className="text-slate-400">og makker med</span>

          {/* Major Fit Dropdown */}
          <div className="relative inline-block group">
            <select
              aria-label="Majorfit hos Nord/Syd"
              value={fitValue}
              onChange={(e) => handleFitSelect(e.target.value)}
              className="appearance-none cursor-pointer bg-rose-950/80 border border-rose-500/50 hover:border-rose-400 text-rose-200 font-semibold px-3 py-1.5 pr-8 rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-rose-400 text-sm sm:text-base transition-all"
            >
              <option value="any">uanset majorfit</option>
              <option value="8+">mindst 8-korts majorfit</option>
              <option value="9+">mindst 9-korts majorfit</option>
            </select>
            <ChevronDown className="w-4 h-4 text-rose-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:scale-110 transition-transform" />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
          {onToggleAdvanced && (
            <button
              onClick={onToggleAdvanced}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium border transition-colors ${
                isAdvancedOpen
                  ? 'bg-cyan-600 text-white border-cyan-500 shadow-md shadow-cyan-600/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700/80'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Avanceret</span>
            </button>
          )}

          <button
            onClick={onReset}
            title="Nulstil filtre til sidens standard"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium bg-slate-800/80 text-slate-300 border border-slate-700/70 hover:bg-slate-700/80 hover:text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Nulstil</span>
          </button>
        </div>
      </div>
    </div>
  );
};
