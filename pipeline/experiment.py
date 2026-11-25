"""Domain model for reproducible bidding-system experiments."""

from dataclasses import dataclass
from typing import Any, Tuple

from auction import Seat
from bidding_strategy import StrategyMetadata
from duplicate_scoring import Vulnerability


@dataclass(frozen=True)
class Experiment:
    experiment_id: str
    experiment_version: str
    population_definition: Any
    strategy_a: StrategyMetadata
    strategy_b: StrategyMetadata
    deal_ids: Tuple[int, ...]
    dealer: Seat
    vulnerability: Vulnerability
    scoring_method: str

    def __post_init__(self):
        if not self.experiment_id or not self.experiment_version:
            raise ValueError("Experiment ID and version must be non-empty")
        if not self.population_definition:
            raise ValueError("Population definition must be non-empty")
        if not self.deal_ids:
            raise ValueError("Experiment deal_ids must not be empty")
        if len(set(self.deal_ids)) != len(self.deal_ids):
            raise ValueError("Experiment deal_ids must not contain duplicates")
        if any(not isinstance(deal_id, int) or isinstance(deal_id, bool) for deal_id in self.deal_ids):
            raise ValueError("Deal IDs must be integers")
        object.__setattr__(self, "deal_ids", tuple(self.deal_ids))
        object.__setattr__(self, "dealer", Seat(self.dealer))
        object.__setattr__(self, "vulnerability", Vulnerability(self.vulnerability))
        if not self.scoring_method:
            raise ValueError("Scoring method must be non-empty")
