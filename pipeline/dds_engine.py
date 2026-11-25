"""True Double Dummy integration using endplay's DDS implementation."""

from typing import List, Tuple, Dict

try:
    from endplay import Deal, Denom, Player
    from endplay.dds import calc_all_tables
except Exception as exc:
    raise ImportError("endplay is required; install pipeline/requirements.txt") from exc


def _to_pbn(hands: Tuple[List[int], List[int], List[int], List[int]]) -> str:
    ranks = "23456789TJQKA"
    hand_strings = []
    for cards in hands:
        suit_strings = []
        for suit in range(4):
            suit_strings.append("".join(
                ranks[c % 13] for c in cards if c // 13 == suit
            ))
        hand_strings.append(".".join(suit_strings))
    return "N:" + " ".join(hand_strings)


def solve_deal(hands: Tuple[List[int], List[int], List[int], List[int]], n_eval: Dict, s_eval: Dict, e_eval: Dict, w_eval: Dict) -> Dict[str, int]:
    deal = Deal(_to_pbn(hands), complete_deal=True)
    try:
        table = calc_all_tables([deal])[0]
    except Exception as exc:
        raise RuntimeError("endplay DD calculation failed") from exc

    denoms = [
        ("s", Denom.spades),
        ("h", Denom.hearts),
        ("d", Denom.diamonds),
        ("c", Denom.clubs),
        ("nt", Denom.nt),
    ]
    players = [
        ("n", Player.north),
        ("e", Player.east),
        ("s", Player.south),
        ("w", Player.west),
    ]
    table_values = {}
    for suit_name, denom in denoms:
        for player_name, player in players:
            table_values[f"dds_{suit_name}_{player_name}"] = int(table[denom, player])

    dds_spades = table_values["dds_s_n"]
    dds_hearts = table_values["dds_h_n"]
    dds_diamonds = table_values["dds_d_n"]
    dds_clubs = table_values["dds_c_n"]
    dds_nt = table_values["dds_nt_n"]

    opp_game = int(
        table[Denom.nt, Player.east] >= 9
        or table[Denom.spades, Player.east] >= 10
        or table[Denom.hearts, Player.east] >= 10
        or table[Denom.diamonds, Player.east] >= 11
        or table[Denom.clubs, Player.east] >= 11
    )

    result = {
        "dds_s": int(dds_spades),
        "dds_h": int(dds_hearts),
        "dds_d": int(dds_diamonds),
        "dds_c": int(dds_clubs),
        "dds_nt": int(dds_nt),
        "opp_game": opp_game,
        "dds_source": "endplay_dds",
    }
    result.update(table_values)
    return result
