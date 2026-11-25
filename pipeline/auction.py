"""Reusable immutable bridge auction domain model."""

from dataclasses import dataclass
from enum import Enum
from typing import Iterable, Optional, Tuple

from duplicate_scoring import Denomination, DoubledState, Vulnerability


class Seat(str, Enum):
    NORTH = "North"
    EAST = "East"
    SOUTH = "South"
    WEST = "West"


SEATS = (Seat.NORTH, Seat.EAST, Seat.SOUTH, Seat.WEST)


def next_seat(seat: Seat) -> Seat:
    return SEATS[(SEATS.index(seat) + 1) % len(SEATS)]


class CallKind(str, Enum):
    PASS = "Pass"
    BID = "Bid"
    DOUBLE = "Double"
    REDOUBLE = "Redouble"


@dataclass(frozen=True)
class Bid:
    level: int
    denomination: Denomination

    def __post_init__(self):
        if not isinstance(self.level, int) or isinstance(self.level, bool):
            raise ValueError("Bid level must be an integer")
        if not 1 <= self.level <= 7:
            raise ValueError("Bid level must be between 1 and 7")
        object.__setattr__(self, "denomination", Denomination(self.denomination))

    @property
    def rank(self) -> int:
        denomination_rank = {
            Denomination.CLUBS: 0,
            Denomination.DIAMONDS: 1,
            Denomination.HEARTS: 2,
            Denomination.SPADES: 3,
            Denomination.NOTRUMP: 4,
        }[self.denomination]
        return self.level * 5 + denomination_rank

    def __str__(self) -> str:
        symbols = {
            Denomination.CLUBS: "C",
            Denomination.DIAMONDS: "D",
            Denomination.HEARTS: "H",
            Denomination.SPADES: "S",
            Denomination.NOTRUMP: "NT",
        }
        return f"{self.level}{symbols[self.denomination]}"


@dataclass(frozen=True)
class Call:
    kind: CallKind
    bid: Optional[Bid] = None

    def __post_init__(self):
        object.__setattr__(self, "kind", CallKind(self.kind))
        if self.kind == CallKind.BID:
            if self.bid is None:
                raise ValueError("A bid call requires a Bid")
            object.__setattr__(self, "bid", Bid(self.bid.level, self.bid.denomination))
        elif self.bid is not None:
            raise ValueError("Only a bid call may contain a Bid")

    @classmethod
    def pass_call(cls) -> "Call":
        return cls(CallKind.PASS)

    @classmethod
    def bid_call(cls, level: int, denomination: Denomination) -> "Call":
        return cls(CallKind.BID, Bid(level, denomination))

    @classmethod
    def double(cls) -> "Call":
        return cls(CallKind.DOUBLE)

    @classmethod
    def redouble(cls) -> "Call":
        return cls(CallKind.REDOUBLE)

    def __str__(self) -> str:
        if self.kind == CallKind.BID:
            return str(self.bid)
        return self.kind.value


@dataclass(frozen=True)
class FinalContract:
    level: int
    denomination: Denomination
    declarer: Seat
    doubled_state: DoubledState

    def __post_init__(self):
        if not isinstance(self.level, int) or isinstance(self.level, bool):
            raise ValueError("Contract level must be an integer")
        if not 1 <= self.level <= 7:
            raise ValueError("Contract level must be between 1 and 7")
        object.__setattr__(self, "denomination", Denomination(self.denomination))
        object.__setattr__(self, "declarer", Seat(self.declarer))
        object.__setattr__(self, "doubled_state", DoubledState(self.doubled_state))


@dataclass(frozen=True)
class Auction:
    dealer: Seat
    vulnerability: Vulnerability
    calls: Tuple[Call, ...] = ()

    def __post_init__(self):
        object.__setattr__(self, "dealer", Seat(self.dealer))
        object.__setattr__(self, "vulnerability", Vulnerability(self.vulnerability))
        object.__setattr__(self, "calls", tuple(self.calls))
        self._validate_calls()

    def _validate_calls(self) -> None:
        current_bid: Optional[Bid] = None
        for index, call in enumerate(self.calls):
            seat = self.player_to_act_at(index)
            if call.kind == CallKind.BID:
                if call.bid is None:
                    raise ValueError("A bid call requires a Bid")
                if current_bid is not None and call.bid.rank <= current_bid.rank:
                    raise ValueError("Bid must be higher than the current bid")
                current_bid = call.bid
            elif call.kind == CallKind.DOUBLE:
                last_action = self._last_non_pass(index)
                if last_action is None or last_action["call"].kind != CallKind.BID:
                    raise ValueError("A double requires an immediately preceding bid")
                bid_seat = last_action["seat"]
                if self._partnership(seat) == self._partnership(bid_seat):
                    raise ValueError("A partnership cannot double its own bid")
            elif call.kind == CallKind.REDOUBLE:
                last_action = self._last_non_pass(index)
                if last_action is None or last_action["call"].kind != CallKind.DOUBLE:
                    raise ValueError("A redouble requires an immediately preceding double")
                double_seat = last_action["seat"]
                if self._partnership(seat) == self._partnership(double_seat):
                    raise ValueError("A partnership cannot redouble its own double")

        if len(self.calls) == 4 and all(call.kind == CallKind.PASS for call in self.calls):
            return
        if len(self.calls) >= 4:
            for index in range(3, len(self.calls)):
                if all(call.kind == CallKind.PASS for call in self.calls[index - 2 : index + 1]):
                    if index + 1 < len(self.calls):
                        raise ValueError("Auction is complete; no further calls are legal")

    def player_to_act_at(self, call_index: int) -> Seat:
        seat = self.dealer
        for _ in range(call_index):
            seat = next_seat(seat)
        return seat

    @property
    def next_player(self) -> Optional[Seat]:
        if self.is_complete:
            return None
        return self.player_to_act_at(len(self.calls))

    @property
    def is_complete(self) -> bool:
        if len(self.calls) == 0:
            return False
        if len(self.calls) >= 4 and all(call.kind == CallKind.PASS for call in self.calls[:4]):
            return len(self.calls) == 4
        if len(self.calls) < 4:
            return False
        return all(call.kind == CallKind.PASS for call in self.calls[-3:])

    @property
    def passed_out(self) -> bool:
        return len(self.calls) == 4 and all(call.kind == CallKind.PASS for call in self.calls)

    @property
    def current_bid(self) -> Optional[Bid]:
        for call in reversed(self.calls):
            if call.kind == CallKind.BID:
                return call.bid
        return None

    def with_call(self, call: Call) -> "Auction":
        if self.is_complete:
            raise ValueError("Auction is complete; no further calls are legal")
        return Auction(self.dealer, self.vulnerability, self.calls + (call,))

    def _last_non_pass(self, before_index: int) -> Optional[dict]:
        for index in range(before_index - 1, -1, -1):
            call = self.calls[index]
            if call.kind != CallKind.PASS:
                return {"call": call, "seat": self.player_to_act_at(index)}
        return None

    @staticmethod
    def _partnership(seat: Seat) -> str:
        return "NS" if seat in (Seat.NORTH, Seat.SOUTH) else "EW"

    def derive_final_contract(self) -> Optional[FinalContract]:
        if not self.is_complete or self.passed_out:
            return None

        last_bid_index = -1
        final_bid: Optional[Bid] = None
        for index in range(len(self.calls) - 1, -1, -1):
            if self.calls[index].kind == CallKind.BID:
                last_bid_index = index
                final_bid = self.calls[index].bid
                break
        if final_bid is None:
            return None

        winning_seat = self.player_to_act_at(last_bid_index)
        winning_partnership = self._partnership(winning_seat)
        declarer: Optional[Seat] = None
        for index, call in enumerate(self.calls[: last_bid_index + 1]):
            if call.kind != CallKind.BID or call.bid is None:
                continue
            seat = self.player_to_act_at(index)
            if call.bid.denomination == final_bid.denomination:
                if self._partnership(seat) == winning_partnership:
                    declarer = seat
                    break
        if declarer is None:
            raise ValueError("Could not determine declarer")

        doubled_state = DoubledState.UNDOUBLED
        for call in reversed(self.calls[last_bid_index + 1 :]):
            if call.kind == CallKind.PASS:
                continue
            if call.kind == CallKind.REDOUBLE:
                doubled_state = DoubledState.REDOUBLED
            elif call.kind == CallKind.DOUBLE:
                doubled_state = DoubledState.DOUBLED
            break

        return FinalContract(
            level=final_bid.level,
            denomination=final_bid.denomination,
            declarer=declarer,
            doubled_state=doubled_state,
        )
