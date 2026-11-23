import React from 'react';
import { ConventionView } from '../components/ConventionView';
import { BridgeFilter, OlapColumns } from '../engine/bridgeQueryEngine';
import { SampleDealsDataset } from '../engine/sampleDealsEngine';

const DEFAULT_FLANNERY_FILTER: BridgeFilter = {
  convMask: 1,
  minHcp: 11,
  maxHcp: 15,
  exactSpades: 4,
  exactHearts: 5,
};

interface FlanneryPageProps {
  olapDb: OlapColumns | null;
  sampleDb: SampleDealsDataset | null;
  totalDeals: number;
  fallbackSummary?: any;
  onLatencyUpdate?: (ms: number) => void;
}

export const FlanneryPage: React.FC<FlanneryPageProps> = ({
  olapDb,
  sampleDb,
  totalDeals,
  fallbackSummary,
  onLatencyUpdate,
}) => {
  return (
    <ConventionView
      title="Flannery 2♦ Analyzer"
      badge="11–15 HP • 4♠ & 5♥"
      description="Flannery 2♦ viser eksakt 4-farve i spar og 5-farve i hjerter med begrænset styrke. Konventionen eliminerer det frygtede genmeldingsproblem efter en naturlig 1♥ åbning og giver makker øjeblikkeligt overblik over fit i begge majorfarver."
      theoryNotes="I standard bridge efter 1♥ - 1NT tvinges åbner til at genmelde en 3-korts minor eller 2♥ med 5-4 fordeling. Flannery garanterer, at 4-korts sparfarven ikke forsvinder, og afklarer om 4♥, 4♠ eller 3NT giver den højeste stikforventning."
      defaultFilter={DEFAULT_FLANNERY_FILTER}
      fallbackSummary={fallbackSummary}
      olapDb={olapDb}
      sampleDb={sampleDb}
      totalDatabaseDeals={totalDeals}
      onLatencyUpdate={onLatencyUpdate}
    />
  );
};
