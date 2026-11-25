"""Structures for future auction and contract evaluations."""

from dataclasses import dataclass
from typing import Optional

from auction import Auction, FinalContract


@dataclass(frozen=True)
class StrategyEvaluation:
    strategy_id: str
    auction: Auction
    final_contract: Optional[FinalContract]
    dds_tricks: Optional[int]
    duplicate_score: Optional[int]


@dataclass(frozen=True)
class DealEvaluation:
    deal_id: int
    strategy_a: StrategyEvaluation
    strategy_b: StrategyEvaluation
    raw_score_difference: Optional[int] = None
    imp_difference: Optional[int] = None
