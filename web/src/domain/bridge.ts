export enum Seat {
  North = "North",
  East = "East",
  South = "South",
  West = "West",
}

export enum Vulnerability {
  None = "None",
  NS = "NS",
  EW = "EW",
  Both = "Both",
}

export enum Denomination {
  Clubs = "Clubs",
  Diamonds = "Diamonds",
  Hearts = "Hearts",
  Spades = "Spades",
  Notrump = "Notrump",
}

export enum DoubledState {
  Undoubled = "Undoubled",
  Doubled = "Doubled",
  Redoubled = "Redoubled",
}

export interface Contract {
  level: number;
  denomination: Denomination;
  declarer: Seat;
  doubledState: DoubledState;
}

export function validateSeat(seat: Seat): void {
  if (!Object.values(Seat).includes(seat)) {
    throw new Error("Invalid seat");
  }
}

export function validateVulnerability(vulnerability: Vulnerability): void {
  if (!Object.values(Vulnerability).includes(vulnerability)) {
    throw new Error("Invalid vulnerability");
  }
}

export function validateDenomination(denomination: Denomination): void {
  if (!Object.values(Denomination).includes(denomination)) {
    throw new Error("Invalid denomination");
  }
}

export function validateDoubledState(doubledState: DoubledState): void {
  if (!Object.values(DoubledState).includes(doubledState)) {
    throw new Error("Invalid doubled state");
  }
}

export enum CallKind {
  Pass = "Pass",
  Bid = "Bid",
  Double = "Double",
  Redouble = "Redouble",
}

export interface Bid {
  readonly level: number;
  readonly denomination: Denomination;
}

export interface AuctionCall {
  readonly kind: CallKind;
  readonly bid?: Bid;
}

export function passCall(): AuctionCall {
  return Object.freeze({ kind: CallKind.Pass });
}

export function bidCall(level: number, denomination: Denomination): AuctionCall {
  if (!Number.isInteger(level) || level < 1 || level > 7) {
    throw new Error("Bid level must be an integer from 1 through 7");
  }
  return Object.freeze({
    kind: CallKind.Bid,
    bid: Object.freeze({ level, denomination }),
  });
}

export function doubleCall(): AuctionCall {
  return Object.freeze({ kind: CallKind.Double });
}

export function redoubleCall(): AuctionCall {
  return Object.freeze({ kind: CallKind.Redouble });
}

export interface AuctionState {
  readonly dealer: Seat;
  readonly vulnerability: Vulnerability;
  readonly calls: readonly AuctionCall[];
}

export interface StrategyMetadata {
  readonly strategy_id: string;
  readonly strategy_name: string;
  readonly version: string;
}

export interface StrategyState {
  readonly hand: readonly number[];
  readonly seat: Seat;
  readonly vulnerability: Vulnerability;
  readonly dealer: Seat;
  readonly auction: AuctionState;
}

export interface BiddingStrategy {
  readonly metadata: StrategyMetadata;
  chooseCall(state: StrategyState): AuctionCall;
}

export interface ResearchExperiment {
  readonly experiment_id: string;
  readonly experiment_version: string;
  readonly population_definition: unknown;
  readonly strategy_a: StrategyMetadata;
  readonly strategy_b: StrategyMetadata;
  readonly deal_ids: readonly number[];
  readonly dealer: Seat;
  readonly vulnerability: Vulnerability;
  readonly scoring_method: string;
}

export interface StrategyEvaluation {
  readonly strategy_id: string;
  readonly auction: AuctionState;
  readonly final_contract: Contract | null;
  readonly dds_tricks: number | null;
  readonly duplicate_score: number | null;
}

export interface DealEvaluation {
  readonly deal_id: number;
  readonly strategy_a: StrategyEvaluation;
  readonly strategy_b: StrategyEvaluation;
  readonly raw_score_difference: number | null;
  readonly imp_difference: number | null;
}

export function validateContract(contract: Contract): void {
  if (!Object.values(Seat).includes(contract.declarer)) {
    throw new Error("Invalid declarer seat");
  }
  if (!Object.values(Denomination).includes(contract.denomination)) {
    throw new Error("Invalid denomination");
  }
  if (!Object.values(DoubledState).includes(contract.doubledState)) {
    throw new Error("Invalid doubled state");
  }
  if (!Number.isInteger(contract.level) || contract.level < 1 || contract.level > 7) {
    throw new Error("Contract level must be an integer from 1 through 7");
  }
}
