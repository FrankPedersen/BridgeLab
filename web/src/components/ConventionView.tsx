import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BridgeFilter, OlapColumns, QueryResult, runBridgeQuery } from '../engine/bridgeQueryEngine';
import { SampleDealsDataset, queryMatchingSamples, SampleDealRecord } from '../engine/sampleDealsEngine';
import { MadLibsFilter } from './MadLibsFilter';
import { AdvancedFilterDrawer } from './AdvancedFilterDrawer';
import { KpiCards } from './KpiCards';
import { TrickDistributionChart } from './TrickDistributionChart';
import { FourHandCardViewer } from './FourHandCardViewer';
import { Info } from 'lucide-react';

interface ConventionViewProps {
  title: string;
  badge: string;
  description: string;
  theoryNotes?: string;
  defaultFilter: BridgeFilter;
  fallbackSummary?: any;
  olapDb: OlapColumns | null;
  sampleDb: SampleDealsDataset | null;
  totalDatabaseDeals: number;
  onLatencyUpdate?: (ms: number) => void;
}

export const ConventionView: React.FC<ConventionViewProps> = ({
  title,
  badge,
  description,
  theoryNotes,
  defaultFilter,
  fallbackSummary,
  olapDb,
  sampleDb,
  totalDatabaseDeals,
  onLatencyUpdate,
}) => {
  const [filter, setFilter] = useState<BridgeFilter>(defaultFilter);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // When defaultFilter changes (page route change), update filter only if values actually changed
  const defaultFilterSerialized = JSON.stringify(defaultFilter);
  const prevDefaultFilterRef = useRef(defaultFilterSerialized);

  useEffect(() => {
    if (prevDefaultFilterRef.current !== defaultFilterSerialized) {
      prevDefaultFilterRef.current = defaultFilterSerialized;
      setFilter(defaultFilter);
    }
  }, [defaultFilterSerialized, defaultFilter]);

  // Compute live QueryResult from in-memory OlapColumns
  const queryResult: QueryResult = useMemo(() => {
    if (olapDb) {
      console.log('[ConventionView] Running query on OLAP db with filter:', filter);
      const res = runBridgeQuery(olapDb, filter);
      console.log('[ConventionView] Query result:', res.totalDeals, 'deals, 4H:', res.pct4H, '%, tid:', res.queryTimeMs, 'ms');
      return res;
    }

    // Fallback to static summary for 0 ms initial render
    if (fallbackSummary) {
      return {
        totalDeals: fallbackSummary.totalDeals,
        pct4H: fallbackSummary.pct4H,
        pct4S: fallbackSummary.pct4S,
        pct3NT: fallbackSummary.pct3NT,
        pctSlam: fallbackSummary.pctSlam,
        pctOppGame: fallbackSummary.pctOppGame,
        distH: fallbackSummary.distH,
        distS: fallbackSummary.distS,
        distNT: fallbackSummary.distNT,
        queryTimeMs: 0,
      };
    }

    return {
      totalDeals: 0,
      pct4H: 0,
      pct4S: 0,
      pct3NT: 0,
      pctSlam: 0,
      pctOppGame: 0,
      distH: new Array(14).fill(0),
      distS: new Array(14).fill(0),
      distNT: new Array(14).fill(0),
      queryTimeMs: 0,
    };
  }, [olapDb, filter, fallbackSummary]);

  // Safely propagate latency to parent without triggering render loops
  useEffect(() => {
    if (onLatencyUpdate && queryResult.queryTimeMs !== undefined) {
      onLatencyUpdate(queryResult.queryTimeMs);
    }
  }, [queryResult.queryTimeMs, onLatencyUpdate]);

  // Query up to 5 matching sample deals for the 4-hand card viewer
  const sampleDeals: SampleDealRecord[] = useMemo(() => {
    if (sampleDb) {
      return queryMatchingSamples(sampleDb, filter, 5);
    }
    if (fallbackSummary && fallbackSummary.sample_deals) {
      return fallbackSummary.sample_deals.map((s: any) => ({
        dealId: s.deal_id,
        openerHcp: s.opener_hcp,
        spades: s.spades,
        hearts: s.hearts,
        diamonds: s.diamonds,
        clubs: s.clubs,
        convFlags: s.conv_flags,
        ddsS: s.dds_s,
        ddsH: s.dds_h,
        ddsD: s.dds_d,
        ddsC: s.dds_c,
        ddsNt: s.dds_nt,
      }));
    }
    return [];
  }, [sampleDb, filter, fallbackSummary]);

  const handleReset = () => {
    setFilter(defaultFilter);
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Intro */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {title}
          </h1>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/80">
            {badge}
          </span>
          <span className="text-xs text-slate-400 font-mono">
            {queryResult.queryTimeMs > 0 ? `⚡ Sorteret på ${queryResult.queryTimeMs} ms` : '⚡ Lynhurtig visning'}
          </span>
        </div>
        <p className="text-sm sm:text-base text-slate-300 max-w-4xl leading-relaxed">
          {description}
        </p>

        {theoryNotes && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 text-xs text-slate-400 flex items-start space-x-2">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{theoryNotes}</span>
          </div>
        )}
      </div>

      {/* Interactive Mad Libs Filter Bar */}
      <MadLibsFilter
        filter={filter}
        onFilterChange={setFilter}
        onReset={handleReset}
        onToggleAdvanced={() => setIsAdvancedOpen(!isAdvancedOpen)}
        isAdvancedOpen={isAdvancedOpen}
      />

      {/* Advanced Filter Drawer */}
      <AdvancedFilterDrawer
        isOpen={isAdvancedOpen}
        onClose={() => setIsAdvancedOpen(false)}
        filter={filter}
        onFilterChange={setFilter}
        onReset={handleReset}
      />

      {/* KPI Cards */}
      <KpiCards
        result={queryResult}
        databaseTotalDeals={totalDatabaseDeals}
      />

      {/* Dual Analysis Panels: Trick Distribution & 4-Hand Interactive Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrickDistributionChart result={queryResult} />
        <FourHandCardViewer sampleDeals={sampleDeals} />
      </div>
    </div>
  );
};
