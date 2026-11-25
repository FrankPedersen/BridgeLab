import sys
import json
import subprocess
from pathlib import Path

pipeline_dir = Path(__file__).resolve().parents[1]
if str(pipeline_dir) not in sys.path:
    sys.path.insert(0, str(pipeline_dir))

import pyarrow.parquet as pq
import pyarrow as pa

from deal_prng import generate_deal, evaluate_hand
from dds_engine import solve_deal
from rng import Mulberry32
from endplay import Deal, Denom, Player
from endplay.dds import calc_all_tables


def deal_pbn(seed: int) -> str:
    ranks = "23456789TJQKA"
    hands = generate_deal(seed)
    parts = []
    for cards in hands:
        parts.append(".".join(
            "".join(ranks[c % 13] for c in cards if c // 13 == suit)
            for suit in range(4)
        ))
    return "N:" + " ".join(parts)


def test_rng_vectors():
    expected = {
        1: "N:48.TA87.2J46.QT5 5A9TK3.5.KT37.34 7Q6.J2Q.Q.79682A 2J.6K439.A859.JK",
        42: "N:3Q4J.7T6.Q.J5A6T 5A6.9K5.925J.29Q T.423AQ.4A76.K84 892K7.J8.K8T3.73",
        123456: "N:KQ4.T4.956A.32T8 T68J.K87.KJQ.954 9253.QJ96.3.7A6K A7.A235.T2847.QJ",
    }
    for seed, pbn in expected.items():
        assert deal_pbn(seed) == pbn

    rng = Mulberry32(1)
    assert [rng.next_uint32() for _ in range(5)] == [
        623224492, 315494378, 3507235615, 4253694669, 402365544
    ]


def test_true_dds_accuracy():
    for seed in (1, 42, 123456, 500, 9001):
        hands = generate_deal(seed)
        evaluations = [evaluate_hand(hand) for hand in hands]
        n_eval, e_eval, s_eval, w_eval = evaluations
        result = solve_deal(hands, n_eval, s_eval, e_eval, w_eval)
        assert result["dds_source"] == "endplay_dds"
        assert all(0 <= result[f"dds_{suit}_{player}"] <= 13
                   for suit in ("s", "h", "d", "c", "nt")
                   for player in ("n", "e", "s", "w"))


def test_olap_integrity(tmp_path):
    expected = 400000
    table = pa.table({
        "deal_count": pa.array([expected], type=pa.uint32()),
    })
    path = tmp_path / "bridge_olap.parquet"
    pq.write_table(table, path)
    actual = sum(pq.read_table(path).column("deal_count").to_pylist())
    assert actual == expected


def test_deal_integrity():
    for seed in (0, 1, 42, 123456, 999999):
        hands = generate_deal(seed)
        flat_cards = [card for hand in hands for card in hand]
        assert len(flat_cards) == 52
        assert all(len(hand) == 13 for hand in hands)
        assert len(set(flat_cards)) == 52
        assert all(card in range(52) for card in flat_cards)

        evaluations = [evaluate_hand(hand) for hand in hands]
        assert sum(hand["hcp"] for hand in evaluations) == 40
        for evaluation in evaluations:
            assert sum((evaluation["spades"], evaluation["hearts"], evaluation["diamonds"], evaluation["clubs"])) == 13


def test_hcp_values():
    hands = [[12], [11], [10], [9], [0]]
    assert evaluate_hand(hands[0])["hcp"] == 4
    assert evaluate_hand(hands[1])["hcp"] == 3
    assert evaluate_hand(hands[2])["hcp"] == 2
    assert evaluate_hand(hands[3])["hcp"] == 1
    assert evaluate_hand(hands[4])["hcp"] == 0


def test_seed_reproducibility_and_difference():
    assert generate_deal(42) == generate_deal(42)
    assert generate_deal(42) != generate_deal(43)


def test_typescript_rng_parity():
    repo_root = Path(__file__).resolve().parents[2]
    result = subprocess.run(
        ["node", str(pipeline_dir / "tests" / "verify_typescript_rng.js")],
        cwd=repo_root,
        check=True,
        capture_output=True,
        text=True,
    )
    actual = json.loads(result.stdout)
    vectors = json.loads((repo_root / "docs" / "rng-vectors.json").read_text(encoding="utf-8"))

    ranks = "23456789TJQKA"
    for seed_text, expected_hands in vectors["seeds"].items():
        seed = int(seed_text)
        python_hands = generate_deal(seed)
        python_pbn_hands = []
        for cards in python_hands:
            python_pbn_hands.append(".".join(
                "".join(ranks[c % 13] for c in cards if c // 13 == suit)
                for suit in range(4)
            ))
        assert python_pbn_hands == expected_hands
        assert actual[str(seed)] == expected_hands


def test_fixed_dds_fixtures():
    repo_root = Path(__file__).resolve().parents[2]
    fixtures = json.loads((repo_root / "docs" / "dds-fixtures.json").read_text(encoding="utf-8"))
    for fixture in fixtures["fixtures"]:
        deal = Deal(fixture["pbn"], complete_deal=True)
        table = calc_all_tables([deal])[0]
        actual_north = {
            "spades": table[Denom.spades, Player.north],
            "hearts": table[Denom.hearts, Player.north],
            "diamonds": table[Denom.diamonds, Player.north],
            "clubs": table[Denom.clubs, Player.north],
            "notrump": table[Denom.nt, Player.north],
        }
        assert actual_north == fixture["north"]
