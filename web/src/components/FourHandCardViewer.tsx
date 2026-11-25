import React, { useState, useMemo } from 'react';
import { SampleDealRecord } from '../engine/sampleDealsEngine';
import { reconstructDeal, HandEvaluation } from '../engine/dealGenerator';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';

interface FourHandCardViewerProps {
  sampleDeals: SampleDealRecord[];
}

const SingleHandDisplay: React.FC<{
  position: 'Nord' | 'Syd' | 'Øst' | 'Vest';
  role?: string;
  hand: HandEvaluation;
  isHighlighted?: boolean;
}> = ({ position, role, hand, isHighlighted }) => {
  const formatSuit = (cards: string[]) => {
    if (!cards || cards.length === 0) return <span className="text-slate-500 italic">—</span>;
    return <span className="font-mono tracking-wider font-semibold">{cards.join(' ')}</span>;
  };

  return (
    <div
      className={`rounded-xl p-3 sm:p-4 transition-all ${
        isHighlighted
          ? 'bg-slate-800/95 border-2 border-cyan-400/80 shadow-lg shadow-cyan-900/30'
          : 'bg-slate-900/90 border border-slate-800 shadow-md'
      }`}
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="font-extrabold text-sm sm:text-base text-white tracking-wide">
            {position}
          </span>
          {role && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
              {role}
            </span>
          )}
        </div>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
          {hand.hcp} HP
        </span>
      </div>

      <div className="space-y-1 text-xs sm:text-sm">
        <div className="flex items-center space-x-2 text-sky-400">
          <span className="w-4 font-bold text-base leading-none">♠</span>
          {formatSuit(hand.spades)}
        </div>
        <div className="flex items-center space-x-2 text-rose-500">
          <span className="w-4 font-bold text-base leading-none">♥</span>
          {formatSuit(hand.hearts)}
        </div>
        <div className="flex items-center space-x-2 text-orange-400">
          <span className="w-4 font-bold text-base leading-none">♦</span>
          {formatSuit(hand.diamonds)}
        </div>
        <div className="flex items-center space-x-2 text-emerald-400">
          <span className="w-4 font-bold text-base leading-none">♣</span>
          {formatSuit(hand.clubs)}
        </div>
      </div>
    </div>
  );
};

export const FourHandCardViewer: React.FC<FourHandCardViewerProps> = ({ sampleDeals }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Keep index in valid bounds
  const safeIndex = Math.min(currentIndex, Math.max(0, sampleDeals.length - 1));
  const activeRecord = sampleDeals[safeIndex];

  // Reconstruct deal cards deterministically from deal_id
  const reconstructed = useMemo(() => {
    if (!activeRecord) return null;
    return reconstructDeal(activeRecord.dealId);
  }, [activeRecord]);

  if (!activeRecord || !reconstructed) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
        <p>Ingen konkrete eksempelhænder matcher det aktuelle filter.</p>
        <p className="text-xs text-slate-400 mt-1">Prøv at løsne filtrene i Mad Libs baren.</p>
      </div>
    );
  }

  const { north, east, south, west } = reconstructed;
  const totalNsHcp = north.hcp + south.hcp;
  const totalEwHcp = east.hcp + west.hcp;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur">
      {/* Header and Deal Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Eye className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base sm:text-lg font-bold text-white">
              4-Hånds Eksempel (Deterministisk Deal #{activeRecord.dealId})
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Eksakt kortfordeling genskabt 1:1 i browseren ud fra PRNG-seed
          </p>
        </div>

        {/* Carousel pagination */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <span className="text-xs text-slate-400 font-medium">
            Spil {safeIndex + 1} af {sampleDeals.length}
          </span>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={safeIndex === 0}
              className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-40 hover:bg-slate-700 transition-colors"
              title="Forrige spil"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentIndex((prev) => Math.min(sampleDeals.length - 1, prev + 1))}
              disabled={safeIndex >= sampleDeals.length - 1}
              className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-40 hover:bg-slate-700 transition-colors"
              title="Næste spil"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bridge Table 4-Hands Layout */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* West Hand */}
        <div className="order-2 md:order-1">
          <SingleHandDisplay position="Vest" hand={west} />
        </div>

        {/* Center: North on top, South at bottom, Middle board info */}
        <div className="order-1 md:order-2 flex flex-col space-y-4">
          {/* North Hand */}
          <SingleHandDisplay position="Nord" role="Makker (Svarer)" hand={north} />

          {/* Center Table Summary */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 text-center text-xs">
            <div className="grid grid-cols-2 gap-2 text-slate-300">
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800/80">
                <span className="text-[10px] uppercase text-cyan-400 block font-semibold">Nord/Syd HP</span>
                <span className="text-base font-extrabold text-white">{totalNsHcp} HP</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800/80">
                <span className="text-[10px] uppercase text-slate-400 block font-semibold">Øst/Vest HP</span>
                <span className="text-base font-extrabold text-white">{totalEwHcp} HP</span>
              </div>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              Giver: <span className="text-slate-200 font-semibold">Syd</span> • Zone: <span className="text-slate-200 font-semibold">Ingen i fare</span>
            </div>
          </div>

          {/* South Hand (Opener) */}
          <SingleHandDisplay
            position="Syd"
            role="Åbner"
            hand={south}
            isHighlighted={true}
          />
        </div>

        {/* East Hand & DDS Table */}
        <div className="order-3 space-y-4">
          <SingleHandDisplay position="Øst" hand={east} />

          {/* DDS Trick Table */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 shadow-md">
            <div className="text-xs font-bold text-slate-300 mb-2 flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span>DDS Double Dummy Stik</span>
              <span className="text-[10px] text-cyan-400 font-mono">Double Dummy analysis (endplay/DDS)</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs">
                <thead>
                  <tr className="text-slate-400 text-[11px] border-b border-slate-800/60">
                    <th className="py-1 text-left pl-1">Par</th>
                    <th className="py-1 text-sky-400">♠</th>
                    <th className="py-1 text-rose-500">♥</th>
                    <th className="py-1 text-orange-400">♦</th>
                    <th className="py-1 text-emerald-400">♣</th>
                    <th className="py-1 text-amber-400">NT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 font-mono">
                  <tr>
                    <td className="py-1.5 text-left font-bold text-cyan-300 pl-1">Nord/Syd</td>
                    <td className={`py-1.5 ${activeRecord.ddsS >= 10 ? 'text-emerald-400 font-extrabold bg-emerald-950/40 rounded' : 'text-slate-300'}`}>
                      {activeRecord.ddsS}
                    </td>
                    <td className={`py-1.5 ${activeRecord.ddsH >= 10 ? 'text-emerald-400 font-extrabold bg-emerald-950/40 rounded' : 'text-slate-300'}`}>
                      {activeRecord.ddsH}
                    </td>
                    <td className={`py-1.5 ${activeRecord.ddsD >= 11 ? 'text-emerald-400 font-extrabold bg-emerald-950/40 rounded' : 'text-slate-300'}`}>
                      {activeRecord.ddsD}
                    </td>
                    <td className={`py-1.5 ${activeRecord.ddsC >= 11 ? 'text-emerald-400 font-extrabold bg-emerald-950/40 rounded' : 'text-slate-300'}`}>
                      {activeRecord.ddsC}
                    </td>
                    <td className={`py-1.5 ${activeRecord.ddsNt >= 9 ? 'text-amber-400 font-extrabold bg-amber-950/40 rounded' : 'text-slate-300'}`}>
                      {activeRecord.ddsNt}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1.5 text-left font-bold text-slate-400 pl-1">Øst/Vest</td>
                    <td className="py-1.5 text-slate-400">{13 - activeRecord.ddsS}</td>
                    <td className="py-1.5 text-slate-400">{13 - activeRecord.ddsH}</td>
                    <td className="py-1.5 text-slate-400">{13 - activeRecord.ddsD}</td>
                    <td className="py-1.5 text-slate-400">{13 - activeRecord.ddsC}</td>
                    <td className="py-1.5 text-slate-400">{13 - activeRecord.ddsNt}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between">
              <span>Grøn: Udgang vundet</span>
              <span>Guld: 3NT vundet</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
