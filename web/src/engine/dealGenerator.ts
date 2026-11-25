/**
 * dealGenerator.ts - Deterministic Deal Reconstruction
 * Generates 100% bit-exact deals from deal_id matching the Python simulator.
 */

export const SUIT_SYMBOLS = ['♠', '♥', '♦', '♣'] as const;
export const SUIT_NAMES = ['Spades', 'Hearts', 'Diamonds', 'Clubs'] as const;
export const RANK_CHARS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const;

export interface HandEvaluation {
  spades: string[];
  hearts: string[];
  diamonds: string[];
  clubs: string[];
  hcp: number;
  totalCards: number;
}

export interface ReconstructedDeal {
  dealId: number;
  north: HandEvaluation;
  east: HandEvaluation;
  south: HandEvaluation;
  west: HandEvaluation;
}

import { Mulberry32 } from './rng';
export { Mulberry32 } from './rng';

const HCP_VALUES: Record<number, number> = {
  12: 4, // Ace
  11: 3, // King
  10: 2, // Queen
  9: 1,  // Jack
};

function evaluateHandCards(cardIndices: number[]): HandEvaluation {
  const suits: [number[], number[], number[], number[]] = [[], [], [], []];
  let hcp = 0;

  for (const c of cardIndices) {
    const suit = Math.floor(c / 13);
    const rank = c % 13;
    suits[suit].push(rank);
    hcp += HCP_VALUES[rank] || 0;
  }

  // Sort descending by rank (A, K, Q, ...)
  for (let s = 0; s < 4; s++) {
    suits[s].sort((a, b) => b - a);
  }

  return {
    spades: suits[0].map(r => RANK_CHARS[r]),
    hearts: suits[1].map(r => RANK_CHARS[r]),
    diamonds: suits[2].map(r => RANK_CHARS[r]),
    clubs: suits[3].map(r => RANK_CHARS[r]),
    hcp,
    totalCards: cardIndices.length,
  };
}

/**
 * Deterministically reconstructs the full 4-hand bridge deal from deal_id.
 */
export function reconstructDeal(dealId: number): ReconstructedDeal {
  const rng = new Mulberry32(dealId);
  const deck = Array.from({ length: 52 }, (_, i) => i);

  // Fisher-Yates shuffle
  for (let i = 51; i > 0; i--) {
    const j = rng.nextInt(i + 1);
    const temp = deck[i];
    deck[i] = deck[j];
    deck[j] = temp;
  }

  // Cards distribution:
  // North: 0..12, East: 13..25, South: 26..38, West: 39..51
  const northCards = deck.slice(0, 13);
  const eastCards = deck.slice(13, 26);
  const southCards = deck.slice(26, 39);
  const westCards = deck.slice(39, 52);

  return {
    dealId,
    north: evaluateHandCards(northCards),
    east: evaluateHandCards(eastCards),
    south: evaluateHandCards(southCards),
    west: evaluateHandCards(westCards),
  };
}
