import sys
from pathlib import Path

pipeline_dir = Path(__file__).resolve().parents[1]
if str(pipeline_dir) not in sys.path:
    sys.path.insert(0, str(pipeline_dir))

import pytest

from auction import Auction, Bid, Call, CallKind, FinalContract, Seat
from bidding_strategy import StrategyMetadata, StrategyState
from duplicate_scoring import Denomination, DoubledState, Vulnerability


def auction(calls):
    return Auction(Seat.NORTH, Vulnerability.NONE, tuple(calls))


def test_bid_ordering():
    sequence = [
        Call.bid_call(1, Denomination.CLUBS),
        Call.bid_call(1, Denomination.DIAMONDS),
        Call.bid_call(1, Denomination.HEARTS),
        Call.bid_call(1, Denomination.SPADES),
        Call.bid_call(1, Denomination.NOTRUMP),
        Call.bid_call(2, Denomination.CLUBS),
    ]
    auction_state = Auction(Seat.NORTH, Vulnerability.NONE)
    for call in sequence:
        auction_state = auction_state.with_call(call)
    assert auction_state.current_bid == Bid(2, Denomination.CLUBS)


@pytest.mark.parametrize("level", [0, 8])
def test_reject_invalid_bid_level(level):
    with pytest.raises(ValueError):
        Bid(level, Denomination.CLUBS)


def test_reject_bid_lower_than_or_equal_to_current_bid():
    state = auction([Call.bid_call(1, Denomination.NOTRUMP)])
    state = state.with_call(Call.pass_call())
    state = state.with_call(Call.pass_call())
    with pytest.raises(ValueError):
        state.with_call(Call.bid_call(1, Denomination.NOTRUMP))


def test_next_player_tracks_order():
    state = Auction(Seat.WEST, Vulnerability.NS)
    assert state.next_player == Seat.WEST
    state = state.with_call(Call.pass_call())
    assert state.next_player == Seat.NORTH
    state = state.with_call(Call.bid_call(1, Denomination.CLUBS))
    assert state.next_player == Seat.EAST


def test_passed_out():
    state = auction([Call.pass_call() for _ in range(4)])
    assert state.passed_out
    assert state.is_complete
    assert state.derive_final_contract() is None
    assert state.next_player is None


def test_complete_after_three_passes():
    state = auction([
        Call.bid_call(1, Denomination.HEARTS),
        Call.pass_call(),
        Call.bid_call(2, Denomination.HEARTS),
        Call.pass_call(),
        Call.pass_call(),
        Call.pass_call(),
    ])
    assert state.is_complete
    assert not state.passed_out
    assert state.next_player is None


def test_one_notrump_complete():
    state = auction([
        Call.bid_call(1, Denomination.NOTRUMP),
        Call.pass_call(),
        Call.pass_call(),
        Call.pass_call(),
    ])
    assert state.is_complete


def test_reject_auction_after_completion():
    state = auction([
        Call.bid_call(1, Denomination.CLUBS),
        Call.pass_call(),
        Call.pass_call(),
        Call.pass_call(),
    ])
    with pytest.raises(ValueError):
        state.with_call(Call.pass_call())


def test_double_and_redouble_validation():
    state = auction([
        Call.bid_call(1, Denomination.CLUBS),
        Call.double(),
    ])
    state = state.with_call(Call.redouble())
    contract = Auction(
        Seat.NORTH,
        Vulnerability.NONE,
        state.calls + (
            Call.pass_call(),
            Call.pass_call(),
            Call.pass_call(),
        ),
    ).derive_final_contract()
    assert contract.doubled_state == DoubledState.REDOUBLED


def test_reject_own_partnership_double():
    state = Auction(Seat.NORTH, Vulnerability.NONE)
    state = state.with_call(Call.bid_call(1, Denomination.CLUBS))
    state = state.with_call(Call.pass_call())
    with pytest.raises(ValueError):
        state.with_call(Call.double())


def test_declarer_is_first_player_in_winning_partnership():
    state = auction([
        Call.bid_call(1, Denomination.HEARTS),
        Call.pass_call(),
        Call.bid_call(2, Denomination.HEARTS),
        Call.pass_call(),
        Call.pass_call(),
        Call.pass_call(),
    ])
    contract = state.derive_final_contract()
    assert contract == FinalContract(
        level=2,
        denomination=Denomination.HEARTS,
        declarer=Seat.NORTH,
        doubled_state=DoubledState.UNDOUBLED,
    )


def test_declarer_for_opposing_partnership():
    state = auction([
        Call.bid_call(1, Denomination.CLUBS),
        Call.bid_call(1, Denomination.HEARTS),
        Call.pass_call(),
        Call.bid_call(2, Denomination.SPADES),
        Call.pass_call(),
        Call.pass_call(),
        Call.pass_call(),
    ])
    contract = state.derive_final_contract()
    assert contract.declarer == Seat.WEST
    assert contract.denomination == Denomination.SPADES


def test_undoubled_and_doubled_contract_derivation():
    undoubled = auction([
        Call.bid_call(1, Denomination.NOTRUMP),
        Call.pass_call(),
        Call.pass_call(),
        Call.pass_call(),
    ])
    assert undoubled.derive_final_contract().doubled_state == DoubledState.UNDOUBLED

    doubled = auction([
        Call.bid_call(1, Denomination.NOTRUMP),
        Call.double(),
        Call.pass_call(),
        Call.pass_call(),
        Call.pass_call(),
    ])
    assert doubled.derive_final_contract().doubled_state == DoubledState.DOUBLED


def test_strategy_metadata_is_immutable():
    metadata = StrategyMetadata("test", "Test strategy", "0.1.0")
    with pytest.raises(AttributeError):
        metadata.version = "0.2.0"


def test_strategy_state_rejects_duplicate_cards_and_wrong_size():
    auction_state = Auction(Seat.NORTH, Vulnerability.NONE)
    with pytest.raises(ValueError):
        StrategyState(tuple(range(12)), Seat.NORTH, Vulnerability.NONE, Seat.NORTH, auction_state)
    with pytest.raises(ValueError):
        StrategyState(tuple([0] * 13), Seat.NORTH, Vulnerability.NONE, Seat.NORTH, auction_state)


def test_strategy_state_requires_matching_dealer():
    auction_state = Auction(Seat.NORTH, Vulnerability.NONE)
    with pytest.raises(ValueError):
        StrategyState(tuple(range(13)), Seat.NORTH, Vulnerability.NONE, Seat.EAST, auction_state)
