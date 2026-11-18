import React from 'react';
import { QueryResult } from '../engine/bridgeQueryEngine';
import { Target, ShieldAlert, Award } from 'lucide-react';

interface KpiCardsProps {
  result: QueryResult;
  databaseTotalDeals: number;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ result, databaseTotalDeals }) => {
  const matchingPct = databaseTotalDeals > 0 
    ? ((result.totalDeals / databaseTotalDeals) * 100).toFixed(2) 
    : '0';

  const cards = [
    {
      title: 'Matchende Spil',
      value: result.totalDeals.toLocaleString('da-DK'),
      subtitle: `${matchingPct}% af databasen`,
      icon: Target,
      iconColor: 'text-cyan-400',
      bgGlow: 'from-cyan-500/10 to-transparent',
      borderColor: 'border-cyan-500/30',
      progress: Math.min(100, Number(matchingPct)),
      progressColor: 'bg-cyan-400',
    },
    {
      title: '4♥ Står',
      value: `${result.pct4H.toFixed(1)}%`,
      subtitle: '≥ 10 stik i Hjerter',
      icon: () => <span className="text-xl font-bold text-rose-500 leading-none">♥</span>,
      bgGlow: 'from-rose-500/10 to-transparent',
      borderColor: 'border-rose-500/30',
      progress: result.pct4H,
      progressColor: 'bg-rose-500',
    },
    {
      title: '4♠ Står',
      value: `${result.pct4S.toFixed(1)}%`,
      subtitle: '≥ 10 stik i Spar',
      icon: () => <span className="text-xl font-bold text-sky-400 leading-none">♠</span>,
      bgGlow: 'from-sky-500/10 to-transparent',
      borderColor: 'border-sky-500/30',
      progress: result.pct4S,
      progressColor: 'bg-sky-400',
    },
    {
      title: '3NT Står',
      value: `${result.pct3NT.toFixed(1)}%`,
      subtitle: '≥ 9 stik i Uden Trumf',
      icon: () => <span className="text-sm font-bold tracking-tight text-amber-400">NT</span>,
      bgGlow: 'from-amber-500/10 to-transparent',
      borderColor: 'border-amber-500/30',
      progress: result.pct3NT,
      progressColor: 'bg-amber-400',
    },
    {
      title: 'Slem (12+ stik)',
      value: `${result.pctSlam.toFixed(1)}%`,
      subtitle: '6-trin eller 7-trin (NS)',
      icon: Award,
      iconColor: 'text-purple-400',
      bgGlow: 'from-purple-500/10 to-transparent',
      borderColor: 'border-purple-500/30',
      progress: result.pctSlam,
      progressColor: 'bg-purple-400',
    },
    {
      title: 'Modparten Har Udgang',
      value: `${result.pctOppGame.toFixed(1)}%`,
      subtitle: 'ØV vinder 3NT / 4♥ / 4♠ / 5m',
      icon: ShieldAlert,
      iconColor: 'text-orange-400',
      bgGlow: 'from-orange-500/10 to-transparent',
      borderColor: 'border-orange-500/30',
      progress: result.pctOppGame,
      progressColor: 'bg-orange-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {cards.map((c, idx) => {
        const IconComponent = c.icon;
        return (
          <div
            key={idx}
            className={`relative overflow-hidden rounded-2xl bg-slate-900/90 border ${c.borderColor} p-4 sm:p-5 shadow-lg backdrop-blur flex flex-col justify-between transition-all hover:scale-[1.02]`}
          >
            {/* Ambient subtle glow background */}
            <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-gradient-to-br ${c.bgGlow} blur-xl pointer-events-none`} />

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400 tracking-wide uppercase">
                  {c.title}
                </span>
                <div className="w-7 h-7 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center shrink-0">
                  {typeof IconComponent === 'function' ? (
                    // @ts-ignore
                    <IconComponent className={`w-4 h-4 ${c.iconColor || ''}`} />
                  ) : null}
                </div>
              </div>

              <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-1">
                {c.value}
              </div>
              <p className="text-xs text-slate-400 truncate">{c.subtitle}</p>
            </div>

            {/* Visual progress bar */}
            <div className="mt-4 pt-2 border-t border-slate-800/80">
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${c.progressColor}`}
                  style={{ width: `${Math.min(100, c.progress)}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
