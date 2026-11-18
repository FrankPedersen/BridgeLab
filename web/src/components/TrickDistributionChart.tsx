import React, { useState } from 'react';
import { QueryResult } from '../engine/bridgeQueryEngine';
import { BarChart3 } from 'lucide-react';

interface TrickDistributionChartProps {
  result: QueryResult;
}

type TabMode = 'all' | 'hearts' | 'spades' | 'nt';

export const TrickDistributionChart: React.FC<TrickDistributionChartProps> = ({ result }) => {
  const [activeTab, setActiveTab] = useState<TabMode>('all');
  const [hoveredTrick, setHoveredTrick] = useState<number | null>(null);

  // We display tricks 7 through 13
  const trickRange = [7, 8, 9, 10, 11, 12, 13];

  // Maximum value for scaling the bars
  let maxPct = 0;
  for (const t of trickRange) {
    maxPct = Math.max(maxPct, result.distH[t] || 0, result.distS[t] || 0, result.distNT[t] || 0);
  }
  const chartMax = Math.max(10, Math.ceil(maxPct / 10) * 10);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur flex flex-col justify-between">
      {/* Header and Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base sm:text-lg font-bold text-white">
              Stik-fordeling (Double Dummy)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Sandsynlighed for antal stik vundet af Nord/Syd (7 til 13 stik)
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'all'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sammenlign
          </button>
          <button
            onClick={() => setActiveTab('hearts')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'hearts'
                ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60 shadow-sm'
                : 'text-slate-400 hover:text-rose-400'
            }`}
          >
            <span>♥</span>
            <span>Hjerter</span>
          </button>
          <button
            onClick={() => setActiveTab('spades')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'spades'
                ? 'bg-sky-950/80 text-sky-300 border border-sky-800/60 shadow-sm'
                : 'text-slate-400 hover:text-sky-400'
            }`}
          >
            <span>♠</span>
            <span>Spar</span>
          </button>
          <button
            onClick={() => setActiveTab('nt')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'nt'
                ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60 shadow-sm'
                : 'text-slate-400 hover:text-amber-400'
            }`}
          >
            <span>NT</span>
          </button>
        </div>
      </div>

      {/* Contract Milestone Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-3">
        <span className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
          <span>3NT Udgang (≥ 9 stik)</span>
        </span>
        <span className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
          <span>4♥/4♠ Udgang (≥ 10 stik)</span>
        </span>
        <span className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block" />
          <span>Lilleslem (≥ 12 stik)</span>
        </span>
      </div>

      {/* Chart Visualizer */}
      <div className="mt-6 pt-4 relative min-h-[260px] flex flex-col justify-end">
        {/* Background Grid Lines */}
        <div className="absolute inset-x-0 bottom-8 top-0 flex flex-col justify-between pointer-events-none opacity-20">
          <div className="border-b border-dashed border-slate-400 flex justify-between text-[10px] text-slate-400">
            <span>{chartMax}%</span>
          </div>
          <div className="border-b border-dashed border-slate-400 flex justify-between text-[10px] text-slate-400">
            <span>{Math.round(chartMax * 0.75)}%</span>
          </div>
          <div className="border-b border-dashed border-slate-400 flex justify-between text-[10px] text-slate-400">
            <span>{Math.round(chartMax * 0.5)}%</span>
          </div>
          <div className="border-b border-dashed border-slate-400 flex justify-between text-[10px] text-slate-400">
            <span>{Math.round(chartMax * 0.25)}%</span>
          </div>
          <div className="border-b border-slate-600 flex justify-between text-[10px] text-slate-400">
            <span>0%</span>
          </div>
        </div>

        {/* Columns for Tricks 7 to 13 */}
        <div className="grid grid-cols-7 gap-2 sm:gap-4 relative z-10 items-end pb-8">
          {trickRange.map((tricks) => {
            const pctH = result.distH[tricks] || 0;
            const pctS = result.distS[tricks] || 0;
            const pctNT = result.distNT[tricks] || 0;

            const isNtGame = tricks === 9;
            const isMajorGame = tricks === 10;
            const isSlam = tricks === 12;

            return (
              <div
                key={tricks}
                className="flex flex-col items-center group relative cursor-pointer"
                onMouseEnter={() => setHoveredTrick(tricks)}
                onMouseLeave={() => setHoveredTrick(null)}
              >
                {/* Milestone Badge above bar */}
                <div className="mb-1 text-[10px] font-bold h-4 flex items-center">
                  {isNtGame && <span className="text-amber-400 bg-amber-950/80 px-1 rounded border border-amber-800/80">3NT</span>}
                  {isMajorGame && <span className="text-emerald-400 bg-emerald-950/80 px-1 rounded border border-emerald-800/80">Udgang</span>}
                  {isSlam && <span className="text-purple-400 bg-purple-950/80 px-1 rounded border border-purple-800/80">Slem</span>}
                </div>

                {/* Bars Area */}
                <div className="w-full flex justify-center items-end h-44 gap-1">
                  {/* Hearts Bar */}
                  {(activeTab === 'all' || activeTab === 'hearts') && (
                    <div
                      className="w-full max-w-[20px] rounded-t-md bg-gradient-to-t from-rose-700 to-rose-500 transition-all duration-300 hover:brightness-125 relative group"
                      style={{ height: `${(pctH / chartMax) * 100}%` }}
                    >
                      {activeTab === 'hearts' && pctH > 0 && (
                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-rose-300 whitespace-nowrap">
                          {pctH}%
                        </span>
                      )}
                    </div>
                  )}

                  {/* Spades Bar */}
                  {(activeTab === 'all' || activeTab === 'spades') && (
                    <div
                      className="w-full max-w-[20px] rounded-t-md bg-gradient-to-t from-sky-700 to-sky-400 transition-all duration-300 hover:brightness-125 relative group"
                      style={{ height: `${(pctS / chartMax) * 100}%` }}
                    >
                      {activeTab === 'spades' && pctS > 0 && (
                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-sky-300 whitespace-nowrap">
                          {pctS}%
                        </span>
                      )}
                    </div>
                  )}

                  {/* NT Bar */}
                  {(activeTab === 'all' || activeTab === 'nt') && (
                    <div
                      className="w-full max-w-[20px] rounded-t-md bg-gradient-to-t from-amber-700 to-amber-400 transition-all duration-300 hover:brightness-125 relative group"
                      style={{ height: `${(pctNT / chartMax) * 100}%` }}
                    >
                      {activeTab === 'nt' && pctNT > 0 && (
                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-amber-300 whitespace-nowrap">
                          {pctNT}%
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom X-Axis Label */}
                <div className="text-center mt-2">
                  <span className="text-xs sm:text-sm font-bold text-slate-200">
                    {tricks}
                  </span>
                  <span className="text-[10px] text-slate-400 block -mt-0.5">stik</span>
                </div>

                {/* Hover Popover Tooltip */}
                {hoveredTrick === tricks && (
                  <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 bg-slate-950 border border-slate-700 rounded-xl p-3 shadow-2xl text-xs w-44 pointer-events-none">
                    <div className="font-bold text-slate-200 mb-1 border-b border-slate-800 pb-1">
                      {tricks} Stik Vundet:
                    </div>
                    <div className="flex justify-between text-rose-400 py-0.5">
                      <span>♥ Hjerter:</span>
                      <span className="font-mono font-bold">{pctH}%</span>
                    </div>
                    <div className="flex justify-between text-sky-400 py-0.5">
                      <span>♠ Spar:</span>
                      <span className="font-mono font-bold">{pctS}%</span>
                    </div>
                    <div className="flex justify-between text-amber-400 py-0.5">
                      <span>NT Uden trumf:</span>
                      <span className="font-mono font-bold">{pctNT}%</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
