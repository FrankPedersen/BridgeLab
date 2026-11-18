"""
deal_prng.py - Deterministic Card Generation and Deal Reconstruction
Uses a 32-bit Mulberry32 PRNG + Fisher-Yates shuffle to ensure 100% bit-exact
parity between Python and TypeScript.
"""

from typing import List, Tuple, Dict

SUIT_NAMES = ['Spades', 'Hearts', 'Diamonds', 'Clubs']
SUIT_SYMBOLS = ['♠', '♥', '♦', '♣']
RANK_NAMES = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A']
HCP_MAP = {12: 4, 11: 3, 10: 2, 9: 1}  # Ace=4, King=3, Queen=2, Jack=1


class Mulberry32:
    """Mulberry32 PRNG - 100% identical implementation to TypeScript version."""
    def __init__(self, seed: int):
        self.s = seed & 0xFFFFFFFF

    def next_uint32(self) -> int:
        self.s = (self.s + 0x6D2B79F5) & 0xFFFFFFFF
        t = self.s
        m1 = (t ^ (t >> 15)) & 0xFFFFFFFF
        m2 = t | 1
        t = (m1 * m2) & 0xFFFFFFFF
        t = (t ^ (t + (((t ^ (t >> 7)) * 61) & 0xFFFFFFFF))) & 0xFFFFFFFF
        return (t ^ (t >> 14)) & 0xFFFFFFFF

    def next_int(self, max_exclusive: int) -> int:
        return self.next_uint32() % max_exclusive


def generate_deal(seed: int) -> Tuple[List[int], List[int], List[int], List[int]]:
    """
    Generate 4 hands of 13 cards (North, East, South, West) deterministically from seed.
    Card encoding: 0..51 where:
      suit = card // 13 (0=Spades, 1=Hearts, 2=Diamonds, 3=Clubs)
      rank = card % 13  (0='2', ..., 11='K', 12='A')
    """
    rng = Mulberry32(seed)
    cards = list(range(52))
    for i in range(51, 0, -1):
        j = rng.next_int(i + 1)
        cards[i], cards[j] = cards[j], cards[i]

    # Hand 0: North (cards 0..12) - Responder
    # Hand 1: East  (cards 13..25)
    # Hand 2: South (cards 26..38) - Opener
    # Hand 3: West  (cards 39..51)
    return cards[0:13], cards[13:26], cards[26:39], cards[39:52]


def evaluate_hand(hand: List[int]) -> Dict:
    """
    Evaluates suit lengths and HCP for a 13-card hand.
    """
    suits = [[], [], [], []]  # Spades, Hearts, Diamonds, Clubs
    hcp = 0
    for card in hand:
        s = card // 13
        r = card % 13
        suits[s].append(r)
        hcp += HCP_MAP.get(r, 0)

    for s in range(4):
        suits[s].sort(reverse=True)

    return {
        'hcp': hcp,
        'spades': len(suits[0]),
        'hearts': len(suits[1]),
        'diamonds': len(suits[2]),
        'clubs': len(suits[3]),
        'suit_cards': suits
    }


def compute_conv_flags(south_eval: Dict) -> int:
    """
    Compute convention bitmask (1 byte) for South (Opener):
    - Bit 0 (1): Flannery (11-15 HP, 4♠, 5♥, ikke 5-5)
    - Bit 1 (2): Weak Two (6-farve ♥/♠/♦, 6-10 HP)
    - Bit 2 (4): Precision 1♣ (16+ HP)
    - Bit 3 (8): Multi 2♦ (Svag 2 i major, 6-10 HP)
    """
    flags = 0
    hcp = south_eval['hcp']
    s = south_eval['spades']
    h = south_eval['hearts']
    d = south_eval['diamonds']
    c = south_eval['clubs']

    # Bit 0 (1): Flannery
    # 11-15 HCP, exactly 4 spades, exactly 5 hearts (not 5-5)
    if 11 <= hcp <= 15 and s == 4 and h == 5:
        flags |= 1

    # Bit 1 (2): Weak Two
    # 6-10 HCP, exactly 6 cards in one of ♥, ♠, ♦, no other 4+ card suit
    lengths = [s, h, d, c]
    six_card_suits = [i for i, l in enumerate(lengths[:3]) if l == 6]  # only S, H, D
    if 6 <= hcp <= 10 and len(six_card_suits) == 1:
        # Check no other suit has >= 4 cards
        other_lengths = [l for i, l in enumerate(lengths) if i != six_card_suits[0]]
        if max(other_lengths) <= 3:
            flags |= 2

    # Bit 2 (4): Precision 1♣
    # 16+ HCP (any distribution)
    if hcp >= 16:
        flags |= 4

    # Bit 3 (8): Multi 2♦
    # 6-10 HCP, weak 2 in a major (6 spades or 6 hearts), no other 4+ card suit
    major_six = [i for i, l in enumerate([s, h]) if l == 6]
    if 6 <= hcp <= 10 and len(major_six) == 1:
        other_lengths = [l for i, l in enumerate(lengths) if i != major_six[0]]
        if max(other_lengths) <= 3:
            flags |= 8

    return flags
