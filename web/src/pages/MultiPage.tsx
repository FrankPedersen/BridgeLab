import React from 'react';
import { ConventionView } from '../components/ConventionView';
import type { BridgeFilter } from '../types/bridge';
import type { OlapColumns } from '../engine/bridgeQueryEngine';
import type { SampleDealsDataset } from '../engine/sampleDealsEngine';

const DEFAULT_MULTI_FILTER: BridgeFilter = {
  convMask: 8,
  minHcp: 6,
  maxHcp: 10,
};

interface MultiPageProps {
  olapDb: OlapColumns | null;
  sampleDb: SampleDealsDataset | null;
  totalDeals: number;
  fallbackSummary?: any;
  onLatencyUpdate?: (ms: number) => void;
}

export const MultiPage: React.FC<MultiPageProps> = ({
  olapDb,
  sampleDb,
  totalDeals,
  fallbackSummary,
  onLatencyUpdate,
}) => (
  <ConventionView
    title="Multi 2♦ Analyzer"
    badge="6–10 HP • Svag major"
    description="Multi 2♦ bruges til at vise en svag hånd med en sekskortsfarve i spar eller hjerter. Ægte Double Dummy-data viser udgangschancer for parret i spillet."
    theoryNotes="Multi 2♦ spærrer modpartens melderum og kan samtidig skjule en stærk eller særligt fordelt hånd efter lokale aftaler."
    defaultFilter={DEFAULT_MULTI_FILTER}
    fallbackSummary={fallbackSummary}
    olapDb={olapDb}
    sampleDb={sampleDb}
    totalDatabaseDeals={totalDeals}
    onLatencyUpdate={onLatencyUpdate}
  />
);
