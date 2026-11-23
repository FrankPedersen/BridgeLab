import React from 'react';
import { ConventionView } from '../components/ConventionView';
import { BridgeFilter, OlapColumns } from '../engine/bridgeQueryEngine';
import { SampleDealsDataset } from '../engine/sampleDealsEngine';

const DEFAULT_WEAK_TWO_FILTER: BridgeFilter = {
  convMask: 2,
  minHcp: 6,
  maxHcp: 10,
};

interface WeakTwoPageProps {
  olapDb: OlapColumns | null;
  sampleDb: SampleDealsDataset | null;
  totalDeals: number;
  fallbackSummary?: any;
  onLatencyUpdate?: (ms: number) => void;
}

export const WeakTwoPage: React.FC<WeakTwoPageProps> = ({
  olapDb,
  sampleDb,
  totalDeals,
  fallbackSummary,
  onLatencyUpdate,
}) => {
  return (
    <ConventionView
      title="Weak Two Analyzer"
      badge="6–10 HP • 6-farve ♥/♠/♦"
      description="Svage 2-åbninger (2♦, 2♥, 2♠) spærrer for modpartens melderum med en god 6-korts farve og begrænset honnørstyrke. Analyser udgangschancer for NS samt hvor stor risiko der er for, at ØV kan vinde udgang, hvis du passer eller åbner."
      theoryNotes="The Law of Total Tricks anbefaler hurtig spærring. Double Dummy data viser, hvor mange stik en svag 2-åbning koster i modspil vs. fordelene ved at stjæle modstandernes kontrakt."
      defaultFilter={DEFAULT_WEAK_TWO_FILTER}
      fallbackSummary={fallbackSummary}
      olapDb={olapDb}
      sampleDb={sampleDb}
      totalDatabaseDeals={totalDeals}
      onLatencyUpdate={onLatencyUpdate}
    />
  );
};
