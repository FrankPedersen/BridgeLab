"""Separation between auction state and future bidding strategies."""

from dataclasses import dataclass
from typing import Protocol, Tuple

from auction import Auction, Call, Seat
from duplicate_scoring import Vulnerability


@dataclass(frozen=True)
class StrategyMetadata:
    strategy_id: str
    strategy_name: str
    version: str

    def __post_init__(self):
        if not self.strategy_id or not self.strategy_name or not self.version:
            raise ValueError("Strategy metadata values must be non-empty")


@dataclass(frozen=True)
class StrategyState:
    hand: Tuple[int, ...]
    seat: Seat
    vulnerability: Vulnerability
    dealer: Seat
    auction: Auction

    def __post_init__(self):
        hand = tuple(self.hand)
        if len(hand) != 13:
            raise ValueError("A hand in bidding state must contain 13 cards")
        if len(set(hand)) != 13:
            raise ValueError("A hand in bidding state may not contain duplicate cards")
        if any(card not in range(52) for card in hand):
            raise ValueError("A hand contains a card outside 0-51")
        object.__setattr__(self, "hand", hand)
        object.__setattr__(self, "seat", Seat(self.seat))
        object.__setattr__(self, "vulnerability", Vulnerability(self.vulnerability))
        object.__setattr__(self, "dealer", Seat(self.dealer))
        if self.dealer != self.auction.dealer:
            raise ValueError("StrategyState dealer must match auction dealer")


class BiddingStrategy(Protocol):
    metadata: StrategyMetadata

    def choose_call(self, state: StrategyState) -> Call:
        ...
