"""
technique_detector.py - Fast Vectorized Heuristics and Advanced Bridge Play Detection
Implements the Two-Tier Fast Filter Architecture for detecting advanced play techniques
(Squeezes, Endplays, Coups, Intra-Finesse) across 5M deals without performance bottlenecks.
"""

from typing import Tuple, List, Dict, Optional
from constants import (
    TECH_SQUEEZE,
    TECH_ENDPLAY,
    TECH_TRUMP_COUP,
    TECH_UNBLOCK_COUP,
    TECH_COMMUNICATION_COUP,
    TECH_CHOICE_COUP,
    TECH_INTRA_FINESSE,
    TECHNIQUE_NAMES_DA,
    TECHNIQUE_LABELS,
)

SUIT_NAMES_DA = ['spar', 'hjerter', 'ruder', 'klør']
SUIT_SYMBOLS = ['♠', '♥', '♦', '♣']
CARD_RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'B', 'D', 'K', 'E']


def card_str(suit_idx: int, rank_idx: int) -> str:
    return f"{SUIT_SYMBOLS[suit_idx]}{CARD_RANKS[rank_idx]}"


class FastTechniqueEvaluator:
    """
    Two-Tier Fast Filter Evaluator:
    - Tier 1: Fast O(1) heuristic pre-check to eliminate non-candidate deals in sub-microseconds.
    - Tier 2: Deep structural and tactical pattern recognition on candidate deals (~3-5% of total).
    """

    @staticmethod
    def is_candidate(n_eval: dict, s_eval: dict, e_eval: dict, w_eval: dict, dds: dict) -> bool:
        """
        Tier 1: O(1) structural pre-check.
        Deals must have tight game/slam trick expectations or sharp distribution.
        """
        ns_hcp = n_eval['hcp'] + s_eval['hcp']
        dds_nt = dds.get('dds_nt', 0)
        dds_s = dds.get('dds_s', 0)
        dds_h = dds.get('dds_h', 0)
        dds_d = dds.get('dds_d', 0)
        dds_c = dds.get('dds_c', 0)

        max_suit_tricks = max(dds_s, dds_h, dds_d, dds_c)

        # 1. Tight NT contracts: 9-12 tricks with moderate HCP (21-28 HCP)
        if 9 <= dds_nt <= 12 and 21 <= ns_hcp <= 28:
            return True

        # 2. Tight Major contracts: 10-12 tricks with moderate HCP (19-27 HCP)
        if (dds_s >= 10 or dds_h >= 10) and 19 <= ns_hcp <= 27:
            return True

        # 3. Slam borderline: 12-13 tricks with 29-33 HCP
        if (max_suit_tricks >= 12 or dds_nt >= 12) and 28 <= ns_hcp <= 33:
            return True

        # 4. Long suit with short side suits (classic elimination/squeeze profile)
        for s_idx in range(4):
            ns_fit = n_eval['suit_cards'][s_idx] + s_eval['suit_cards'][s_idx]
            if len(ns_fit) >= 8:
                # check side suit shortages
                for side_idx in range(4):
                    if side_idx != s_idx:
                        s_short = min(len(n_eval['suit_cards'][side_idx]), len(s_eval['suit_cards'][side_idx]))
                        if s_short <= 1 and max_suit_tricks >= 9:
                            return True

        return False

    @classmethod
    def evaluate_deal(
        cls,
        deal: Tuple[List[int], List[int], List[int], List[int]],
        n_eval: dict,
        s_eval: dict,
        e_eval: dict,
        w_eval: dict,
        dds: dict,
        detailed: bool = False
    ) -> Tuple[int, List[Dict]]:
        """
        Evaluates a deal for all 7 advanced play technique categories.
        Returns:
          technique_flags (uint16 bitmask)
          notes (list of dicts containing technique details for sample deals)
        """
        # Tier 1: Fast filter
        if not cls.is_candidate(n_eval, s_eval, e_eval, w_eval, dds):
            return 0, []

        flags = 0
        notes = []

        ns_hcp = n_eval['hcp'] + s_eval['hcp']
        dds_nt = dds.get('dds_nt', 0)
        dds_s = dds.get('dds_s', 0)
        dds_h = dds.get('dds_h', 0)

        n_cards = n_eval['suit_cards']
        s_cards = s_eval['suit_cards']
        e_cards = e_eval['suit_cards']
        w_cards = w_eval['suit_cards']

        # Determine primary contract denomination for NS: Spades, Hearts or NT
        denom_idx = -1  # -1 = NT, 0 = Spades, 1 = Hearts
        fit_s = len(n_cards[0]) + len(s_cards[0])
        fit_h = len(n_cards[1]) + len(s_cards[1])

        if fit_s >= 8 and dds_s >= dds_nt and dds_s >= dds_h:
            denom_idx = 0
        elif fit_h >= 8 and dds_h >= dds_nt:
            denom_idx = 1
        elif dds_nt >= 9:
            denom_idx = -1

        # -------------------------------------------------------------
        # 1. TECH_SQUEEZE (bit 1, value 1)
        # Squeeze requirement:
        # - Long running suit in NS (>= 5 cards with top honors A/K)
        # - Two side menace suits where one defender holds key stoppers in both
        # -------------------------------------------------------------
        squeeze_found = False
        long_suit = -1
        for s_idx in range(4):
            suit_len = max(len(n_cards[s_idx]), len(s_cards[s_idx]))
            has_high = (12 in n_cards[s_idx] or 12 in s_cards[s_idx]) and (11 in n_cards[s_idx] or 11 in s_cards[s_idx])
            if suit_len >= 5 and has_high:
                long_suit = s_idx
                break

        if long_suit != -1 and (dds_nt >= 9 or (denom_idx >= 0 and max(dds_s, dds_h) >= 10)):
            # Check for defender squeezed in two side suits
            side_suits = [i for i in range(4) if i != long_suit]
            for victim, victim_cards, victim_name in [(1, e_cards, "Øst"), (3, w_cards, "Vest")]:
                guarded_count = 0
                menace_suits = []
                for s_i in side_suits:
                    v_len = len(victim_cards[s_i])
                    # Has honor or length guard
                    has_guard = any(r in victim_cards[s_i] for r in [11, 10, 9]) or v_len >= 4
                    ns_has_menace = (12 in n_cards[s_i] or 12 in s_cards[s_i]) or (10 in n_cards[s_i] or 10 in s_cards[s_i])
                    if has_guard and ns_has_menace:
                        guarded_count += 1
                        menace_suits.append(SUIT_NAMES_DA[s_i])

                if guarded_count >= 2:
                    flags |= TECH_SQUEEZE
                    squeeze_found = True
                    if detailed:
                        s_name = SUIT_NAMES_DA[long_suit]
                        m_str = " og ".join(menace_suits[:2])
                        notes.append({
                            "type": "Squeeze",
                            "bit": TECH_SQUEEZE,
                            "critical_trick": 11,
                            "summary_da": f"Kør {s_name}-farven i bund; {victim_name} kommer i skvis i {m_str} i stik 11."
                        })
                    break

        # -------------------------------------------------------------
        # 2. TECH_ENDPLAY (bit 2, value 2)
        # Elimination & Throw-in:
        # - NS can eliminate at least one side suit (ruffing out)
        # - A defender holds an exit card and is forced to yield a trick or ruff-and-sluff
        # -------------------------------------------------------------
        if denom_idx >= 0 and (dds_s >= 10 or dds_h >= 10):
            trump_s = denom_idx
            # Check elimination in side suits
            eliminated_suits = []
            for s_i in range(4):
                if s_i != trump_s:
                    if len(n_cards[s_i]) == 0 or len(s_cards[s_i]) == 0:
                        eliminated_suits.append(SUIT_NAMES_DA[s_i])

            if eliminated_suits:
                for victim_cards, victim_name in [(e_cards, "Øst"), (w_cards, "Vest")]:
                    # Defender has honors in remaining side suit
                    for s_i in range(4):
                        if s_i != trump_s and SUIT_NAMES_DA[s_i] not in eliminated_suits:
                            if any(r in victim_cards[s_i] for r in [11, 10]):
                                flags |= TECH_ENDPLAY
                                if detailed:
                                    elim_str = eliminated_suits[0]
                                    notes.append({
                                        "type": "Endplay",
                                        "bit": TECH_ENDPLAY,
                                        "critical_trick": 10,
                                        "summary_da": f"Eliminer {elim_str} og indspil {victim_name}, som tvinges til at åbne op eller give trumf og afkast."
                                    })
                                break
                    if flags & TECH_ENDPLAY:
                        break

        # -------------------------------------------------------------
        # 3. TECH_TRUMP_COUP (bit 4, value 4)
        # Grand Coup / Coup En Passant / Smother Play:
        # - Fit >= 8 in trump suit, opponent has trump length behind (>= 3 trumps with honor)
        # - Declarer shortens trumps to execute the coup
        # -------------------------------------------------------------
        if denom_idx >= 0:
            trump_s = denom_idx
            t_fit = len(n_cards[trump_s]) + len(s_cards[trump_s])
            if t_fit >= 8:
                e_trumps = len(e_cards[trump_s])
                w_trumps = len(w_cards[trump_s])
                # Opponent has 3+ trumps or high trump honor (K or D)
                if (e_trumps >= 3 and any(r in e_cards[trump_s] for r in [10, 11])) or \
                   (w_trumps >= 3 and any(r in w_cards[trump_s] for r in [10, 11])):
                    # NS has ruffing values in side suit
                    side_ruffs = sum(1 for i in range(4) if i != trump_s and (len(n_cards[i]) <= 1 or len(s_cards[i]) <= 1))
                    if side_ruffs >= 2:
                        flags |= TECH_TRUMP_COUP
                        if detailed:
                            t_name = SUIT_NAMES_DA[trump_s]
                            notes.append({
                                "type": "Trump Coup",
                                "bit": TECH_TRUMP_COUP,
                                "critical_trick": 12,
                                "summary_da": f"Forkort egne trumfer via afstik i sidefarver for at fange modpartens {t_name}-længde i slutspillet (Grand Coup)."
                            })

        # -------------------------------------------------------------
        # 4. TECH_UNBLOCK_COUP (bit 8, value 8)
        # Vienna Coup / Anti-Bath Coup:
        # - Vienna Coup: Cash isolated high card (A/K) in menace suit to unblock dummy before squeeze
        # - Anti-Bath Coup: Holding A-J over opponent K/Q lead
        # -------------------------------------------------------------
        if squeeze_found:
            # Check for isolated master honor in side suit
            for s_i in range(4):
                if s_i != long_suit:
                    has_ace_s = (12 in s_cards[s_i] and len(s_cards[s_i]) <= 2)
                    has_high_n = (10 in n_cards[s_i] or 11 in n_cards[s_i]) and 12 not in n_cards[s_i]
                    if has_ace_s and has_high_n:
                        flags |= TECH_UNBLOCK_COUP
                        if detailed:
                            s_name = SUIT_NAMES_DA[s_i]
                            notes.append({
                                "type": "Vienna Coup",
                                "bit": TECH_UNBLOCK_COUP,
                                "critical_trick": 7,
                                "summary_da": f"Indkasser {s_name} Es tidligt (Vienna Coup) for at afblokere Nords trussel før skvisen."
                            })
                        break

        # Check Anti-Bath: A-J in hand vs K-Q in opponent hand
        if not (flags & TECH_UNBLOCK_COUP):
            for s_i in range(4):
                ns_has_aj = (12 in s_cards[s_i] and 9 in s_cards[s_i]) or (12 in n_cards[s_i] and 9 in n_cards[s_i])
                opp_has_kq = (11 in w_cards[s_i] and 10 in w_cards[s_i]) or (11 in e_cards[s_i] and 10 in e_cards[s_i])
                if ns_has_aj and opp_has_kq:
                    flags |= TECH_UNBLOCK_COUP
                    if detailed:
                        s_name = SUIT_NAMES_DA[s_i]
                        notes.append({
                            "type": "Anti-Bath Coup",
                            "bit": TECH_UNBLOCK_COUP,
                            "critical_trick": 1,
                            "summary_da": f"Duk modpartens {s_name}-udspil med E-B (Anti-Bath Coup) for at beholde gaffelen."
                        })
                    break

        # -------------------------------------------------------------
        # 5. TECH_COMMUNICATION_COUP (bit 16, value 16)
        # Scissors Coup / Merrimac / Deschapelles:
        # - Conceding a trick to cut opponent communications or knocking out an entry
        # -------------------------------------------------------------
        if denom_idx >= 0:
            for s_i in range(4):
                if s_i != denom_idx:
                    # NS has loser with opponent ruff threat
                    opp_has_short = (len(e_cards[s_i]) <= 1 or len(w_cards[s_i]) <= 1)
                    opp_has_entry = (12 in e_cards[s_i] or 12 in w_cards[s_i] or 11 in e_cards[s_i] or 11 in w_cards[s_i])
                    if opp_has_short and opp_has_entry:
                        flags |= TECH_COMMUNICATION_COUP
                        if detailed:
                            s_name = SUIT_NAMES_DA[s_i]
                            notes.append({
                                "type": "Scissors Coup",
                                "bit": TECH_COMMUNICATION_COUP,
                                "critical_trick": 4,
                                "summary_da": f"Giv et frivilligt stik væk i {s_name} (Scissors Coup) for at afbryde modpartens forbindelse."
                            })
                        break

        # -------------------------------------------------------------
        # 6. TECH_CHOICE_COUP (bit 32, value 32)
        # Morton's Fork Coup / Avoidance Play:
        # - Trapping a defender with two losing choices or leading to protect danger hand
        # -------------------------------------------------------------
        for s_i in range(4):
            # Morton's fork holding: dummy has A-x or K-x, declarer leads towards it with minor tenace
            ns_holding = n_cards[s_i] + s_cards[s_i]
            if 12 in ns_holding and 10 in ns_holding and 11 not in ns_holding:
                # Opponent has King
                if (11 in w_cards[s_i] and len(w_cards[s_i]) >= 2) or (11 in e_cards[s_i] and len(e_cards[s_i]) >= 2):
                    flags |= TECH_CHOICE_COUP
                    if detailed:
                        s_name = SUIT_NAMES_DA[s_i]
                        notes.append({
                            "type": "Morton's Fork",
                            "bit": TECH_CHOICE_COUP,
                            "critical_trick": 6,
                            "summary_da": f"Spil mod {s_name}-gaffelen (Morton's Fork): Går modstanderen op med Kongen, etableres stik; dukker de, vinder ti-eren."
                        })
                    break

        # -------------------------------------------------------------
        # 7. TECH_INTRA_FINESSE (bit 64, value 64)
        # Intra-Finesse / Double Pinning:
        # - Split tenace holding like A-Q-10 vs low cards or K-10-x vs A-J-x
        # -------------------------------------------------------------
        for s_i in range(4):
            # Check for A-Q-10 opposite small cards, or K-10-x opposite A-J-x
            has_a_q_10 = (12 in s_cards[s_i] and 10 in s_cards[s_i] and 8 in s_cards[s_i]) or \
                         (12 in n_cards[s_i] and 10 in n_cards[s_i] and 8 in n_cards[s_i])
            has_k_10_aj = ((11 in s_cards[s_i] and 8 in s_cards[s_i]) and (12 in n_cards[s_i] and 9 in n_cards[s_i])) or \
                          ((11 in n_cards[s_i] and 8 in n_cards[s_i]) and (12 in s_cards[s_i] and 9 in s_cards[s_i]))
            if has_a_q_10 or has_k_10_aj:
                flags |= TECH_INTRA_FINESSE
                if detailed:
                    s_name = SUIT_NAMES_DA[s_i]
                    notes.append({
                        "type": "Intra-Finesse",
                        "bit": TECH_INTRA_FINESSE,
                        "critical_trick": 5,
                        "summary_da": f"Udfør intra-knibning i {s_name}: Spil lavt mod 10-eren for at fange modpartens mellemkort."
                    })
                break

        return flags, notes
