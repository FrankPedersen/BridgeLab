# Strategy identity

| Field | Value |
|---|---|
| `strategy_id` | `flannery-exp001` |
| `strategy_name` | Flannery Experiment 001 |
| `version` | `1.0.0` |

These identifiers are frozen for this experiment version. A change to a
bidding rule requires a new strategy version; published results must identify
the version used.

## Scope

This is a rule specification, not an implemented bidding strategy. Experiment
001 compares this strategy with Natural 1H on the same deals:

- South is dealer and opener.
- South has 11–15 HCP inclusive, exactly five hearts, and exactly four
  spades.
- There are no additional South-hand, North-hand, or opponent-hand filters.
- Vulnerability is None.
- East and West use `always-pass` version `1.0.0`, taking each of their normal
  turns and passing whenever legally entitled to act.
- Competitive bidding, opponent doubles/redoubles, passed-hand bidding,
  opening-seat variation, and vulnerability variation are off.
- The fixed Experiment 001 opening is 2D. This does not claim that every
  real-world Flannery agreement has this definition.

The strategy's information is restricted to the acting player's own hand,
seat, dealer, vulnerability, previous calls, and public strategy
configuration. It must not receive partner/opponent cards, the complete deal,
DDS results, future calls, contract potential, scores, or prior simulation
statistics.

The general auction, DDS, scoring, and experiment structures already exist in
the repository. No Flannery call-selection implementation exists. This file
does not add one.

## Opening rule

**Specified for Experiment 001 v1:** South, when acting at the start of the
auction with the eligible hand defined above, opens 2D. No suit-quality,
controls, losing-trick-count, vulnerability, positional, or honour-location
conditions may be added.

## Response rules

**UNDEFINED - DOMAIN DECISION REQUIRED.** No response to 2D has been approved.
For example, no suit, notrump, pass, strength, fit, forcing, or artificial
meaning is specified here.

## Opener rebids

**UNDEFINED - DOMAIN DECISION REQUIRED.** No South continuation after a North
response has been approved.

## Responder continuations

**UNDEFINED - DOMAIN DECISION REQUIRED.** No North continuation after a South
rebid has been approved.

## Sign-offs

**UNDEFINED - DOMAIN DECISION REQUIRED.** No sign-off actions or conditions
have been approved.

## Invitations

**UNDEFINED - DOMAIN DECISION REQUIRED.** No invitational calls, ranges, or
accept/decline continuations have been approved.

## Game-forcing actions

**UNDEFINED - DOMAIN DECISION REQUIRED.** No game-forcing call or continuation
has been approved.

## Slam policy

Slam conventions are off unless explicitly included in a later approved
strategy specification. No slam exploration or slam-convention calls are
specified for this version.

## Unsupported auction states

All North/South actions after the specified South 2D opening are uncovered
until response and continuation rules are approved. This includes every
North response, every South rebid, every subsequent North call, and any
unexpected auction state. Those states must be reported as uncovered; the
strategy must not silently choose Pass or any other call.

The always-pass policy applies only to East and West. It does not define a
North/South action.

## Rule matrix

Priority is only meaningful for specified rules. The sole opening rule below
has priority 1 in its exact state. No priority order has been approved for
the undefined states. An undefined row is a gap record, not an executable
rule or a permitted call.

| Rule ID | Auction state | Acting seat | Hand requirements | Call | Meaning | Forcing status | Priority | Next state |
|---------|---------------|-------------|-------------------|------|---------|----------------|----------|------------|
| FLAN-S-OPEN-001 | Auction empty; South is dealer | South | 11–15 HCP, exactly 5 hearts, exactly 4 spades; no other hand criteria | 2D | Experiment 001 Flannery opening | Not applicable to opening | 1 | West acts; under the experiment's opponent policy West passes. North is then to act. |
| FLAN-RESP-UNDEFINED | South 2D, West Pass | North | UNDEFINED - DOMAIN DECISION REQUIRED | UNDEFINED - DOMAIN DECISION REQUIRED | Response meaning not specified | UNDEFINED - DOMAIN DECISION REQUIRED | UNDEFINED | Uncovered strategy state |
| FLAN-REBID-UNDEFINED | A North response has occurred and South is next | South | UNDEFINED - DOMAIN DECISION REQUIRED | UNDEFINED - DOMAIN DECISION REQUIRED | Opener continuation not specified | UNDEFINED - DOMAIN DECISION REQUIRED | UNDEFINED | Uncovered strategy state |
| FLAN-CONT-UNDEFINED | A South rebid has occurred and North is next | North | UNDEFINED - DOMAIN DECISION REQUIRED | UNDEFINED - DOMAIN DECISION REQUIRED | Responder continuation not specified | UNDEFINED - DOMAIN DECISION REQUIRED | UNDEFINED | Uncovered strategy state |
| FLAN-LATER-UNDEFINED | Any later North/South turn not covered by an approved rule | North or South | UNDEFINED - DOMAIN DECISION REQUIRED | UNDEFINED - DOMAIN DECISION REQUIRED | No approved rule | UNDEFINED - DOMAIN DECISION REQUIRED | UNDEFINED | Uncovered strategy state; do not use a Pass fallback |

## Rule traceability

When rules are approved and implemented, each decision should record at least
`strategy_id`, `strategy_version`, acting seat, `rule_id`, and call. The
opening rule identifier above is a documentation identifier only; no
executable trace currently exists.

## Approval status

Only the Experiment 001 opening action is specified. Response and
continuation rules remain unapproved. Do not implement Flannery bidding logic
until a bridge-domain expert supplies and approves the missing rules.
