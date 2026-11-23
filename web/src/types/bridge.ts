/**
 * BridgeLab TypeScript Types and Constants
 */

// Technique Bitmask Constants (uint16)
export const TECH_SQUEEZE = 1 << 0;             // 1: Skvis (Simple, Double, or Strip Squeeze)
export const TECH_ENDPLAY = 1 << 1;             // 2: Slutspil (Elimination & Throw-in / Forced Return)
export const TECH_TRUMP_COUP = 1 << 2;          // 4: Trumfkup (Grand Coup, Devil's Coup, Coup En Passant, Smother Play)
export const TECH_UNBLOCK_COUP = 1 << 3;        // 8: Afblokering (Vienna Coup, Anti-Bath Coup)
export const TECH_COMMUNICATION_COUP = 1 << 4;  // 16: Kommunikationskup (Scissors Coup, Merrimac Coup, Deschapelles Coup, Holdup)
export const TECH_CHOICE_COUP = 1 << 5;         // 32: Valg-kup (Morton's Fork Coup, Crocodile Coup, Avoidance Play, Alcatraz Coup)
export const TECH_INTRA_FINESSE = 1 << 6;       // 64: Intra-knibning (Double Pinning)

export const TECHNIQUE_LABELS: Record<number, string> = {
  [TECH_SQUEEZE]: "Skvis",
  [TECH_ENDPLAY]: "Slutspil",
  [TECH_TRUMP_COUP]: "Trumfkup",
  [TECH_UNBLOCK_COUP]: "Afblokering (Vienna / Anti-Bath)",
  [TECH_COMMUNICATION_COUP]: "Kommunikationskup (Scissors / Merrimac)",
  [TECH_CHOICE_COUP]: "Valg-kup (Morton's Fork / Krokodille)",
  [TECH_INTRA_FINESSE]: "Intra-knibning",
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

export interface BridgeFilter {
  convMask?: number;       // 1 = Flannery, 2 = Weak Two, 4 = Precision 1♣, 8 = Multi 2♦
  techniqueMask?: number;  // Bitmask of selected techniques; 0 or undefined means "Alle spil"
  techniqueMatchMode?: 'ANY' | 'ALL'; // default 'ANY'
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
