import React from 'react';
import { ArrowRight, Zap, Database, ShieldCheck, Cpu } from 'lucide-react';
import { QueryResult } from '../engine/bridgeQueryEngine';
import { KpiCards } from '../components/KpiCards';

interface HomePageProps {
  onNavigate: (path: string) => void;
  globalResult: QueryResult | null;
  totalDealsCount: number;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  globalResult,
  totalDealsCount,
}) => {
  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-8 sm:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 text-xs font-semibold mb-6">
            <Zap className="w-3.5 h-3.5" />
            <span>100% Serverless • Ren Klient-side In-Memory Motor</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Udforsk Double Dummy-analyse
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
            Velkommen til DDS Explorer: En lynhurtig analyse- og simulationsportal for kontraktbridge.
            Gennemse resultater fra indlæste Double Dummy-datasæt direkte i din browser.
            Værdier vises kun, når den tilhørende OLAP-database er indlæst og verificeret.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <button
              onClick={() => onNavigate('/flannery')}
              className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm sm:text-base shadow-lg shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5"
            >
              <span>Udforsk Flannery 2♦</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('/explorer')}
              className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm sm:text-base border border-slate-700 transition-all"
            >
              <span>Fri Explorer</span>
            </button>
          </div>
        </div>

        {/* Feature Pills */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="flex items-start space-x-3">
            <Cpu className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block">TypedArray Motor</span>
              <span className="text-slate-400">Flade Uint8/Uint32 buffere afvikles direkte i RAM.</span>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Database className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block">Pre-aggregeret OLAP</span>
              <span className="text-slate-400">Preaggregerede datasæt indlæses som et lokalt TypedArray-view.</span>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block">0 ms Initial Render</span>
              <span className="text-slate-400">Statiske JSON-summaries viser tal inden data hentes.</span>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block">0 kr. Driftsomkostninger</span>
              <span className="text-slate-400">GitHub Pages + Google Cloud Storage Always Free.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Global Dataset Snapshot */}
      {globalResult && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">
              Globalt Gennemsnit i Hele Databasen ({totalDealsCount.toLocaleString('da-DK')} spil)
            </h2>
            <span className="text-xs text-slate-400">Ufiltreret basisstatistik</span>
          </div>
          <KpiCards result={globalResult} databaseTotalDeals={totalDealsCount} />
        </section>
      )}

      {/* Convention Shortcuts Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">Konventions-Analyzere</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Flannery */}
          <div
            onClick={() => onNavigate('/flannery')}
            className="group cursor-pointer rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 p-6 shadow-xl transition-all hover:scale-[1.02] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800/80 text-xs font-bold">
                  2♦ Åbning
                </span>
                <span className="text-xs font-mono text-slate-400">11–15 HP</span>
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                Flannery 2♦
              </h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Åbning der viser eksakt 4-farve spar og 5-farve hjerter. Løser det klassiske
                genmeldingsproblem og afdækker om 4♥, 4♠ eller 3NT er den optimale udgang.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-semibold text-cyan-400 group-hover:translate-x-1 transition-transform">
              <span>Åbn Flannery Analyzer</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          {/* Weak Two */}
          <div
            onClick={() => onNavigate('/weak-two')}
            className="group cursor-pointer rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 p-6 shadow-xl transition-all hover:scale-[1.02] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800/80 text-xs font-bold">
                  2♥ / 2♠ / 2♦
                </span>
                <span className="text-xs font-mono text-slate-400">6–10 HP</span>
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                Weak Two (Svage Toere)
              </h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Aggressiv spærring med 6-korts farve. Se den præcise balance mellem egne
                udgangschancer og modstanderens risiko for at misse eller vinde udgang.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-semibold text-indigo-400 group-hover:translate-x-1 transition-transform">
              <span>Åbn Weak Two Analyzer</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          {/* Precision 1C */}
          <div
            onClick={() => onNavigate('/precision')}
            className="group cursor-pointer rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-6 shadow-xl transition-all hover:scale-[1.02] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800/80 text-xs font-bold">
                  1♣ Kunstig
                </span>
                <span className="text-xs font-mono text-slate-400">16+ HP</span>
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                Precision 1♣ (Stærk Klør)
              </h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Stærk kunstig åbning med 16+ point. Analyser slemfrekvenser og udgangssikkerhed,
                når modparten melder ind eller makker har positiv hånd.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition-transform">
              <span>Åbn Precision Analyzer</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
