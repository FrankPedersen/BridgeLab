/**
 * BridgeLab TypeScript Types and Constants
 */

// Technique Bitmask Constants (uint16)
export const TECH_SQUEEZE = 1 << 0;             // 1: Simple, Double, or Strip Squeeze
export const TECH_ENDPLAY = 1 << 1;             // 2: Elimination & Throw-in / Forced Return
export const TECH_TRUMP_COUP = 1 << 2;          // 4: Grand Coup, Devil's Coup, Coup En Passant, Smother Play
export const TECH_UNBLOCK_COUP = 1 << 3;        // 8: Vienna Coup, Anti-Bath Coup
export const TECH_COMMUNICATION_COUP = 1 << 4;  // 16: Scissors Coup, Merrimac Coup, Deschapelles Coup, Holdup
export const TECH_CHOICE_COUP = 1 << 5;         // 32: Morton's Fork Coup, Crocodile Coup, Avoidance Play, Alcatraz Coup
export const TECH_INTRA_FINESSE = 1 << 6;       // 64: Intra-Finesse / Double Pinning

export const TECHNIQUE_LABELS: Record<number, string> = {
  [TECH_SQUEEZE]: "Squeeze",
  [TECH_ENDPLAY]: "Slutspil / Indspil",
  [TECH_TRUMP_COUP]: "Trumfkup",
  [TECH_UNBLOCK_COUP]: "Afblokeringskup",
  [TECH_COMMUNICATION_COUP]: "Kommunikationskup",
  [TECH_CHOICE_COUP]: "Valgkup",
  [TECH_INTRA_FINESSE]: "Intra-Knibning",
};

export interface GeminiNote {
  techniques: string[];
  critical_trick: number;
  summary_da: string;
}

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
  technique_flags: number;
  gemini_note?: GeminiNote;
}
