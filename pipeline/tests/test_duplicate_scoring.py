import sys
from pathlib import Path

pipeline_dir = Path(__file__).resolve().parents[1]
if str(pipeline_dir) not in sys.path:
    sys.path.insert(0, str(pipeline_dir))

from duplicate_scoring import (
    Denomination,
    DoubledState,
    Vulnerability,
    score_contract,
)


def score(level, denomination, vulnerable=False, doubled="undoubled", tricks_made=None):
    if tricks_made is None:
        tricks_made = level + 6
    return score_contract(
        level=level,
        denomination=Denomination(denomination),
        declarer_seat="north",
        vulnerability=Vulnerability.BOTH if vulnerable else Vulnerability.NONE,
        doubled_state=DoubledState(doubled),
        tricks_made=tricks_made,
    )


def test_partscores():
    assert score(1, "clubs") == 70
    assert score(2, "diamonds") == 90
    assert score(1, "notrump") == 120


def test_games():
    assert score(3, "notrump") == 400
    assert score(4, "hearts") == 420
    assert score(4, "spades", vulnerable=True) == 620
    assert score(5, "clubs") == 400


def test_slams():
    assert score(6, "notrump") == 990
    assert score(6, "spades", vulnerable=True) == 1430
    assert score(7, "notrump") == 1520
    assert score(7, "hearts", vulnerable=True) == 2210


def test_doubled_and_redoubled_contracts():
    assert score(1, "notrump", vulnerable=False, doubled="doubled") == 490
    assert score(3, "notrump", vulnerable=False, doubled="doubled") == 550
    assert score(3, "notrump", vulnerable=False, doubled="redoubled") == 800


def test_overtricks():
    assert score(4, "hearts", vulnerable=False, tricks_made=11) == 450
    assert score(4, "hearts", vulnerable=True, doubled="doubled", tricks_made=11) == 990
    assert score(3, "notrump", vulnerable=False, doubled="redoubled", tricks_made=10) == 1000


def test_undertricks():
    assert score_contract(3, Denomination.NOTRUMP, "north", Vulnerability.NONE, DoubledState.UNDOUBLED, 8) == -50
    assert score_contract(3, Denomination.NOTRUMP, "north", Vulnerability.BOTH, DoubledState.UNDOUBLED, 8) == -100
    assert score_contract(3, Denomination.NOTRUMP, "north", Vulnerability.NONE, DoubledState.DOUBLED, 8) == -100
    assert score_contract(3, Denomination.NOTRUMP, "north", Vulnerability.BOTH, DoubledState.DOUBLED, 8) == -200


def test_invalid_contract_level():
    import pytest
    with pytest.raises(ValueError):
        score_contract(0, Denomination.SPADES, "north", Vulnerability.NONE, DoubledState.UNDOUBLED, 6)
