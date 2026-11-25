import sys
from pathlib import Path

pipeline_dir = Path(__file__).resolve().parents[1]
if str(pipeline_dir) not in sys.path:
    sys.path.insert(0, str(pipeline_dir))

import pytest

from auction import Seat
from bidding_strategy import StrategyMetadata
from duplicate_scoring import Vulnerability
from experiment import Experiment
from evaluation import DealEvaluation, StrategyEvaluation
from auction import Auction


def metadata(name):
    return StrategyMetadata(f"{name}-id", name, "0.1.0")


def test_experiment_reuses_identical_deal_ids():
    experiment = Experiment(
        experiment_id="exp-1",
        experiment_version="1",
        population_definition={"seeds": "0-999", "sample": "deterministic"},
        strategy_a=metadata("A"),
        strategy_b=metadata("B"),
        deal_ids=(1, 2, 3),
        dealer=Seat.NORTH,
        vulnerability=Vulnerability.NONE,
        scoring_method="duplicate",
    )
    assert experiment.deal_ids == (1, 2, 3)


def test_experiment_rejects_duplicate_deals():
    with pytest.raises(ValueError):
        Experiment(
            experiment_id="exp-1",
            experiment_version="1",
            population_definition="0-999",
            strategy_a=metadata("A"),
            strategy_b=metadata("B"),
            deal_ids=(1, 1),
            dealer=Seat.NORTH,
            vulnerability=Vulnerability.NONE,
            scoring_method="duplicate",
        )


def test_evaluation_models_do_not_invent_results():
    auction_state = Auction(Seat.NORTH, Vulnerability.NONE)
    result_a = StrategyEvaluation("A", auction_state, None, None, None)
    result_b = StrategyEvaluation("B", auction_state, None, None, None)
    evaluation = DealEvaluation(1847281, result_a, result_b)
    assert evaluation.raw_score_difference is None
    assert evaluation.imp_difference is None
