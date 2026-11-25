export interface EnrichedSampleDeal {
  deal_id: number;
  opener_hcp: number;
  spades: number;
  hearts: number;
  diamonds: number;
  clubs: number;
  conv_flags: number;
  dds_s: number;
  dds_h: number;
  dds_d: number;
  dds_c: number;
  dds_nt: number;
  dds_source: "endplay_dds";
}

export interface BridgeFilter {
  convMask?: number;
  minHcp?: number;
  maxHcp?: number;
  exactClubs?: number;
  exactDiamonds?: number;
  exactSpades?: number;
  exactHearts?: number;
  minMajorFit?: number;
  minRespHcp?: number;
  maxRespHcp?: number;
}
