import React from 'react';
import { ConventionView } from '../components/ConventionView';
import { BridgeFilter, OlapColumns } from '../engine/bridgeQueryEngine';
import { SampleDealsDataset } from '../engine/sampleDealsEngine';

const DEFAULT_PRECISION_FILTER: BridgeFilter = {
  convMask: 4,
  minHcp: 16,
};

interface PrecisionPageProps {
  olapDb: OlapColumns | null;
  sampleDb: SampleDealsDataset | null;
  totalDeals: number;
  fallbackSummary?: any;
  onLatencyUpdate?: (ms: number) => void;
}

export const PrecisionPage: React.FC<PrecisionPageProps> = ({
  olapDb,
  sampleDb,
  totalDeals,
  fallbackSummary,
  onLatencyUpdate,
}) => {
  return (
    <ConventionView
      title="Precision 1♣ Analyzer"
      badge="16+ HP • Stærk Klør"
      description="Precision 1♣ er fundamentet for det moderne klørsystem, hvor enhver hånd med 16+ honnørpoint åbnes med 1♣ for at spare meldeplads. Udforsk slemfrekvenser og 3NT succesrater under forskellige svarer-profiler."
      theoryNotes="Ved at begrænse alle andre 1-trins åbninger til 11-15 HP opnår systemet en enorm fordel i uforstyrrede meldeforløb. Double Dummy analysen belyser, hvornår der bør satses på slem (12+ stik) frem for en sikker 3NT udgang."
      defaultFilter={DEFAULT_PRECISION_FILTER}
      fallbackSummary={fallbackSummary}
      olapDb={olapDb}
      sampleDb={sampleDb}
      totalDatabaseDeals={totalDeals}
      onLatencyUpdate={onLatencyUpdate}
    />
  );
};
