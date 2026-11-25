"""Duplicate bridge contract scoring. No DDS or bidding dependencies."""

from enum import Enum


class Vulnerability(str, Enum):
    NONE = "none"
    NS = "ns"
    EW = "ew"
    BOTH = "both"


class Denomination(str, Enum):
    CLUBS = "clubs"
    DIAMONDS = "diamonds"
    HEARTS = "hearts"
    SPADES = "spades"
    NOTRUMP = "notrump"


class DoubledState(str, Enum):
    UNDOUBLED = "undoubled"
    DOUBLED = "doubled"
    REDOUBLED = "redoubled"


def is_vulnerable(vulnerability: Vulnerability, declarer_seat: str) -> bool:
    declarer = declarer_seat.lower()
    if vulnerability in (Vulnerability.BOTH,):
        return True
    if vulnerability == Vulnerability.NS:
        return declarer in ("north", "south")
    if vulnerability == Vulnerability.EW:
        return declarer in ("east", "west")
    return False


def score_contract(
    level: int,
    denomination: Denomination,
    declarer_seat: str,
    vulnerability: Vulnerability,
    doubled_state: DoubledState,
    tricks_made: int,
) -> int:
    if not 1 <= level <= 7:
        raise ValueError("Contract level must be between 1 and 7")
    denomination = Denomination(denomination)
    vulnerability = Vulnerability(vulnerability)
    doubled_state = DoubledState(doubled_state)
    required_tricks = level + 6
    vulnerable = is_vulnerable(vulnerability, declarer_seat)

    if tricks_made < required_tricks:
        undertricks = required_tricks - tricks_made
        if doubled_state == DoubledState.UNDOUBLED:
            return -(100 if vulnerable else 50) * undertricks

        if doubled_state == DoubledState.DOUBLED:
            if vulnerable:
                return -sum(200 if i == 1 else 300 for i in range(1, undertricks + 1))
            return -(
                100
                if undertricks == 1
                else 100 + 200 * (undertricks - 1)
            )

        if vulnerable:
            return -sum(400 if i == 1 else 600 for i in range(1, undertricks + 1))
        return -(
            200
            if undertricks == 1
            else 200 + 400 * (undertricks - 1)
        )

    multiplier = {
        DoubledState.UNDOUBLED: 1,
        DoubledState.DOUBLED: 2,
        DoubledState.REDOUBLED: 4,
    }[doubled_state]

    if denomination in (Denomination.CLUBS, Denomination.DIAMONDS):
        trick_value = 20
    elif denomination in (Denomination.HEARTS, Denomination.SPADES):
        trick_value = 30
    else:
        trick_value = 30

    if denomination == Denomination.NOTRUMP:
        contract_points = (70 if level == 1 else 40 + 30 * (level - 1)) * multiplier
    else:
        contract_points = level * trick_value * multiplier

    score = contract_points

    if doubled_state != DoubledState.UNDOUBLED:
        score += 50 * multiplier // 2

    overtricks = tricks_made - required_tricks
    if doubled_state == DoubledState.UNDOUBLED:
        overtrick_value = trick_value
    elif doubled_state == DoubledState.DOUBLED:
        overtrick_value = 200 if vulnerable else 100
    else:
        overtrick_value = 400 if vulnerable else 200
    score += overtricks * overtrick_value

    if contract_points >= 100:
        score += 500 if vulnerable else 300
    else:
        score += 50

    if level == 6:
        score += 750 if vulnerable else 500
    elif level == 7:
        score += 1500 if vulnerable else 1000

    return score
