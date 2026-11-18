import React from 'react';
import { BridgeFilter } from '../engine/bridgeQueryEngine';
import { X, RefreshCw } from 'lucide-react';

interface AdvancedFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filter: BridgeFilter;
  onFilterChange: (newFilter: BridgeFilter) => void;
  onReset: () => void;
}

export const AdvancedFilterDrawer: React.FC<AdvancedFilterDrawerProps> = ({
  isOpen,
  onClose,
  filter,
  onFilterChange,
  onReset,
}) => {
  if (!isOpen) return null;

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-2xl mt-4 animate-in fade-in slide-in-from-top-4 duration-200">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <h4 className="text-sm font-bold text-white flex items-center space-x-2">
          <span>Avancerede Filtre & Skævheder</span>
        </h4>
        <div className="flex items-center space-x-2">
          <button
            onClick={onReset}
            className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 px-2 py-1 rounded bg-slate-800"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Nulstil</span>
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4 text-xs">
        {/* Column 1: HCP Ranges */}
        <div className="space-y-4">
          <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] block">
            Honnørpoint (HP)
          </span>

          {/* Opener HCP */}
          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Åbners HP (Syd):</span>
              <span className="font-mono font-bold text-cyan-400">
                {filter.minHcp ?? 0} – {filter.maxHcp ?? 37} HP
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min="0"
                max="37"
                placeholder="Min HP"
                value={filter.minHcp ?? ''}
                onChange={(e) =>
                  onFilterChange({
                    ...filter,
                    minHcp: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
              />
              <input
                type="number"
                min="0"
                max="37"
                placeholder="Maks HP"
                value={filter.maxHcp ?? ''}
                onChange={(e) =>
                  onFilterChange({
                    ...filter,
                    maxHcp: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
              />
            </div>
          </div>

          {/* Responder HCP */}
          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Makkers HP (Nord):</span>
              <span className="font-mono font-bold text-indigo-400">
                {filter.minRespHcp ?? 0} – {filter.maxRespHcp ?? 37} HP
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min="0"
                max="37"
                placeholder="Min HP"
                value={filter.minRespHcp ?? ''}
                onChange={(e) =>
                  onFilterChange({
                    ...filter,
                    minRespHcp: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
              />
              <input
                type="number"
                min="0"
                max="37"
                placeholder="Maks HP"
                value={filter.maxRespHcp ?? ''}
                onChange={(e) =>
                  onFilterChange({
                    ...filter,
                    maxRespHcp: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
              />
            </div>
          </div>
        </div>

        {/* Column 2: Exact Opener Suit Lengths */}
        <div className="space-y-4">
          <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] block">
            Eksakt Farvelængde hos Åbner (Syd)
          </span>

          <div className="grid grid-cols-2 gap-3">
            {/* Spades */}
            <div>
              <label className="text-sky-400 font-bold flex items-center space-x-1 mb-1">
                <span>♠ Spar:</span>
              </label>
              <select
                aria-label="Eksakt antal spar hos Åbner"
                value={filter.exactSpades ?? ''}
                onChange={(e) =>
                  onFilterChange({
                    ...filter,
                    exactSpades: e.target.value !== '' ? Number(e.target.value) : undefined,
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-white"
              >
                <option value="">Alle længder</option>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>
                    Eksakt {n} kort
                  </option>
                ))}
              </select>
            </div>

            {/* Hearts */}
            <div>
              <label className="text-rose-400 font-bold flex items-center space-x-1 mb-1">
                <span>♥ Hjerter:</span>
              </label>
              <select
                aria-label="Eksakt antal hjerter hos Åbner"
                value={filter.exactHearts ?? ''}
                onChange={(e) =>
                  onFilterChange({
                    ...filter,
                    exactHearts: e.target.value !== '' ? Number(e.target.value) : undefined,
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-white"
              >
                <option value="">Alle længder</option>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>
                    Eksakt {n} kort
                  </option>
                ))}
              </select>
            </div>

            {/* Diamonds */}
            <div>
              <label className="text-orange-400 font-bold flex items-center space-x-1 mb-1">
                <span>♦ Ruder:</span>
              </label>
              <select
                aria-label="Eksakt antal ruder hos Åbner"
                value={filter.exactDiamonds ?? ''}
                onChange={(e) =>
                  onFilterChange({
                    ...filter,
                    exactDiamonds: e.target.value !== '' ? Number(e.target.value) : undefined,
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-white"
              >
                <option value="">Alle længder</option>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>
                    Eksakt {n} kort
                  </option>
                ))}
              </select>
            </div>

            {/* Clubs */}
            <div>
              <label className="text-emerald-400 font-bold flex items-center space-x-1 mb-1">
                <span>♣ Klør:</span>
              </label>
              <select
                aria-label="Eksakt antal klør hos Åbner"
                value={filter.exactClubs ?? ''}
                onChange={(e) =>
                  onFilterChange({
                    ...filter,
                    exactClubs: e.target.value !== '' ? Number(e.target.value) : undefined,
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-white"
              >
                <option value="">Alle længder</option>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>
                    Eksakt {n} kort
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Column 3: Fits & Conventions */}
        <div className="space-y-4">
          <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] block">
            Partnerskabsfit & Konvention
          </span>

          {/* Min Major Fit */}
          <div>
            <label className="text-slate-300 block mb-1">Min. Majorfit (NS samlet):</label>
            <select
              aria-label="Minimum majorfit"
              value={filter.minMajorFit ?? ''}
              onChange={(e) =>
                onFilterChange({
                  ...filter,
                  minMajorFit: e.target.value !== '' ? Number(e.target.value) : undefined,
                })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
            >
              <option value="">Ingen begrænsning</option>
              <option value="8">Mindst 8-korts fit i enten ♠ eller ♥</option>
              <option value="9">Mindst 9-korts fit i enten ♠ eller ♥</option>
              <option value="10">Mindst 10-korts fit</option>
            </select>
          </div>

          {/* Quick Convention Presets */}
          <div>
            <label className="text-slate-300 block mb-1">Konvention (Bitmask):</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onFilterChange({ ...filter, convMask: undefined })}
                className={`py-1.5 px-2 rounded-lg border text-center transition-colors ${
                  !filter.convMask
                    ? 'bg-cyan-600/30 border-cyan-400 text-cyan-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Alle (0)
              </button>
              <button
                type="button"
                onClick={() => onFilterChange({ ...filter, convMask: 1 })}
                className={`py-1.5 px-2 rounded-lg border text-center transition-colors ${
                  filter.convMask === 1
                    ? 'bg-cyan-600/30 border-cyan-400 text-cyan-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Flannery (1)
              </button>
              <button
                type="button"
                onClick={() => onFilterChange({ ...filter, convMask: 2 })}
                className={`py-1.5 px-2 rounded-lg border text-center transition-colors ${
                  filter.convMask === 2
                    ? 'bg-cyan-600/30 border-cyan-400 text-cyan-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Weak Two (2)
              </button>
              <button
                type="button"
                onClick={() => onFilterChange({ ...filter, convMask: 4 })}
                className={`py-1.5 px-2 rounded-lg border text-center transition-colors ${
                  filter.convMask === 4
                    ? 'bg-cyan-600/30 border-cyan-400 text-cyan-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Precision (4)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
