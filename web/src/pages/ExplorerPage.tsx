import React from 'react';
import { ConventionView } from '../components/ConventionView';
import { BridgeFilter, OlapColumns } from '../engine/bridgeQueryEngine';
import { SampleDealsDataset } from '../engine/sampleDealsEngine';

const DEFAULT_EXPLORER_FILTER: BridgeFilter = {};

interface ExplorerPageProps {
  olapDb: OlapColumns | null;
  sampleDb: SampleDealsDataset | null;
  totalDeals: number;
  fallbackSummary?: any;
  onLatencyUpdate?: (ms: number) => void;
}

export const ExplorerPage: React.FC<ExplorerPageProps> = ({
  olapDb,
  sampleDb,
  totalDeals,
  fallbackSummary,
  onLatencyUpdate,
}) => {
  return (
    <ConventionView
      title="Fri Bridge Explorer"
      badge="Fuld Ad-Hoc Analyse"
      description="Design dine egne hypoteser og filtrer frit på tværs af honnørpoint, enkeltfarver, majorfits og konventions-flag. Alle beregninger aggregeres lynhurtigt i browseren direkte på de flade TypedArrays."
      theoryNotes="Brug Mad Libs filterbaren eller klik på 'Avanceret' for at angive præcise kortantal i spar, hjerter, ruder eller klør samt makkers forventede styrke."
      defaultFilter={DEFAULT_EXPLORER_FILTER}
      fallbackSummary={fallbackSummary}
      olapDb={olapDb}
      sampleDb={sampleDb}
      totalDatabaseDeals={totalDeals}
      onLatencyUpdate={onLatencyUpdate}
    />
  );
};
